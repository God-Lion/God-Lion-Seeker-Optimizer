#!/bin/bash
# Docker Swarm Monitoring Script - Real-time Dashboard
# Provides comprehensive monitoring of Swarm cluster health and performance

set -euo pipefail

# Configuration
STACK_NAME="${STACK_NAME:-godlionseeker}"
REFRESH_INTERVAL="${REFRESH_INTERVAL:-5}"
LOG_FILE="/var/log/swarm-monitor.log"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Check if running on Swarm manager
check_swarm() {
    if ! docker info --format '{{.Swarm.ControlAvailable}}' 2>/dev/null | grep -q true; then
        echo "Error: This script must run on a Swarm manager node"
        exit 1
    fi
}

# Get cluster statistics
get_cluster_stats() {
    local total_nodes
    local manager_nodes
    local worker_nodes
    local active_nodes
    local drain_nodes
    
    total_nodes=$(docker node ls --format '{{.ID}}' | wc -l)
    manager_nodes=$(docker node ls --filter "role=manager" --format '{{.ID}}' | wc -l)
    worker_nodes=$(docker node ls --filter "role=worker" --format '{{.ID}}' | wc -l)
    active_nodes=$(docker node ls --filter "availability=active" --format '{{.ID}}' | wc -l)
    drain_nodes=$(docker node ls --filter "availability=drain" --format '{{.ID}}' | wc -l)
    
    echo "$total_nodes:$manager_nodes:$worker_nodes:$active_nodes:$drain_nodes"
}

# Get service statistics
get_service_stats() {
    local total_services
    local running_services
    local failed_tasks
    
    total_services=$(docker service ls --format '{{.ID}}' 2>/dev/null | wc -l)
    running_services=$(docker service ls --format '{{.Replicas}}' 2>/dev/null | grep -c '/' || echo "0")
    failed_tasks=$(docker stack ps "$STACK_NAME" --filter "desired-state=running" --format '{{.CurrentState}}' 2>/dev/null | grep -c 'Failed' || echo "0")
    
    echo "$total_services:$running_services:$failed_tasks"
}

# Get resource usage
get_resource_usage() {
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Display header
display_header() {
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║         Docker Swarm Monitoring Dashboard - $STACK_NAME${NC}${CYAN}              ║${NC}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════════════╝${NC}"
    echo -e "${BLUE}$(date '+%Y-%m-%d %H:%M:%S')${NC} | Refresh: ${REFRESH_INTERVAL}s | Press Ctrl+C to exit"
    echo ""
}

# Display cluster status
display_cluster_status() {
    echo -e "${BOLD}${GREEN}═══ Cluster Status ═══${NC}"
    
    local stats
    stats=$(get_cluster_stats)
    IFS=':' read -r total managers workers active drain <<< "$stats"
    
    echo -e "  ${CYAN}Total Nodes:${NC}    $total"
    echo -e "  ${CYAN}Manager Nodes:${NC}  $managers"
    echo -e "  ${CYAN}Worker Nodes:${NC}   $workers"
    echo -e "  ${GREEN}Active Nodes:${NC}   $active"
    if [ "$drain" -gt 0 ]; then
        echo -e "  ${YELLOW}Drain Nodes:${NC}    $drain"
    fi
    echo ""
}

# Display node list
display_nodes() {
    echo -e "${BOLD}${GREEN}═══ Swarm Nodes ═══${NC}"
    docker node ls --format "table {{.Hostname}}\t{{.Status}}\t{{.Availability}}\t{{.ManagerStatus}}\t{{.EngineVersion}}" | \
        sed "s/Ready/${GREEN}Ready${NC}/g; s/Down/${RED}Down${NC}/g; s/Leader/${CYAN}Leader${NC}/g; s/Reachable/${BLUE}Reachable${NC}/g"
    echo ""
}

# Display stack services
display_services() {
    echo -e "${BOLD}${GREEN}═══ Stack Services ($STACK_NAME) ═══${NC}"
    
    if docker stack ls 2>/dev/null | grep -q "$STACK_NAME"; then
        docker stack services "$STACK_NAME" --format "table {{.Name}}\t{{.Mode}}\t{{.Replicas}}\t{{.Image}}\t{{.Ports}}" | \
            sed "s/\([0-9]\+\)\/\1/${GREEN}\1\/\1${NC}/g; s/\([0-9]\+\)\/\([0-9]\+\)/${YELLOW}\1\/\2${NC}/g"
    else
        echo -e "  ${YELLOW}Stack '$STACK_NAME' not found${NC}"
    fi
    echo ""
}

# Display service tasks
display_tasks() {
    echo -e "${BOLD}${GREEN}═══ Service Tasks ═══${NC}"
    
    if docker stack ls 2>/dev/null | grep -q "$STACK_NAME"; then
        docker stack ps "$STACK_NAME" --no-trunc --format "table {{.Name}}\t{{.Node}}\t{{.CurrentState}}\t{{.Error}}" | \
            head -n 20 | \
            sed "s/Running/${GREEN}Running${NC}/g; s/Failed/${RED}Failed${NC}/g; s/Pending/${YELLOW}Pending${NC}/g; s/Shutdown/${BLUE}Shutdown${NC}/g"
    else
        echo -e "  ${YELLOW}No tasks found for stack '$STACK_NAME'${NC}"
    fi
    echo ""
}

# Display resource usage
display_resources() {
    echo -e "${BOLD}${GREEN}═══ Resource Usage (Top 10 Containers) ═══${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}" | head -n 11
    echo ""
}

# Display network information
display_networks() {
    echo -e "${BOLD}${GREEN}═══ Swarm Networks ═══${NC}"
    docker network ls --filter "driver=overlay" --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}" | head -n 10
    echo ""
}

# Display service logs (errors only)
display_recent_errors() {
    echo -e "${BOLD}${RED}═══ Recent Errors (Last 5 minutes) ═══${NC}"
    
    local services
    services=$(docker service ls --format '{{.Name}}' 2>/dev/null | grep "^${STACK_NAME}_" || echo "")
    
    if [ -n "$services" ]; then
        local error_found=false
        while IFS= read -r service; do
            local errors
            errors=$(docker service logs --since 5m --tail 10 "$service" 2>/dev/null | grep -i "error\|fatal\|exception" | tail -n 3 || echo "")
            if [ -n "$errors" ]; then
                echo -e "${YELLOW}[$service]${NC}"
                echo "$errors" | sed 's/^/  /'
                error_found=true
            fi
        done <<< "$services"
        
        if [ "$error_found" = false ]; then
            echo -e "  ${GREEN}No errors found${NC}"
        fi
    else
        echo -e "  ${YELLOW}No services found${NC}"
    fi
    echo ""
}

# Display health status
display_health() {
    echo -e "${BOLD}${GREEN}═══ Service Health Status ═══${NC}"
    
    local healthy=0
    local unhealthy=0
    local unknown=0
    
    while IFS= read -r service; do
        local health
        health=$(docker service inspect "$service" --format '{{range .Spec.TaskTemplate.ContainerSpec.Healthcheck}}healthy{{end}}' 2>/dev/null || echo "unknown")
        
        if [ "$health" = "healthy" ]; then
            ((healthy++)) || true
        elif [ "$health" = "unhealthy" ]; then
            ((unhealthy++)) || true
        else
            ((unknown++)) || true
        fi
    done < <(docker service ls --format '{{.Name}}' 2>/dev/null | grep "^${STACK_NAME}_" || echo "")
    
    echo -e "  ${GREEN}Healthy:${NC}   $healthy"
    echo -e "  ${RED}Unhealthy:${NC} $unhealthy"
    echo -e "  ${YELLOW}Unknown:${NC}   $unknown"
    echo ""
}

# Display storage volumes
display_volumes() {
    echo -e "${BOLD}${GREEN}═══ Stack Volumes ═══${NC}"
    docker volume ls --filter "name=${STACK_NAME}" --format "table {{.Name}}\t{{.Driver}}\t{{.Mountpoint}}" 2>/dev/null || echo "  No volumes found"
    echo ""
}

# Main monitoring loop
main() {
    check_swarm
    
    while true; do
        clear
        display_header
        display_cluster_status
        display_nodes
        display_services
        display_tasks
        display_resources
        display_health
        display_recent_errors
        display_networks
        display_volumes
        
        echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════════════${NC}"
        echo -e "Monitoring ${BOLD}$STACK_NAME${NC} stack... Next refresh in ${REFRESH_INTERVAL}s"
        
        sleep "$REFRESH_INTERVAL"
    done
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}Monitoring stopped${NC}"; exit 0' INT TERM

# Run main function
main "$@"

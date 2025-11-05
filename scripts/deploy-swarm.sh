#!/bin/bash
# Quick Deployment Script for God Lion Seeker Optimizer on Docker Swarm
# This script automates the entire deployment process

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
STACK_NAME="godlionseeker"
COMPOSE_FILE="docker-compose.swarm.yml"
DOCKER_USERNAME="${DOCKER_USERNAME:-}"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BOLD}${BLUE}"
    echo "═══════════════════════════════════════════════════════════"
    echo "  God Lion Seeker Optimizer - Docker Swarm Deployment"
    echo "═══════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if running on Swarm manager
    if ! docker info --format '{{.Swarm.ControlAvailable}}' 2>/dev/null | grep -q true; then
        log_error "This script must run on a Docker Swarm manager node."
        log_info "Initialize Swarm with: docker swarm init"
        exit 1
    fi
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    # Check Docker username
    if [ -z "$DOCKER_USERNAME" ]; then
        read -p "Enter Docker Hub username: " DOCKER_USERNAME
        export DOCKER_USERNAME
    fi
    
    log_success "Prerequisites check passed"
}

# Create storage directories
setup_storage() {
    log_info "Setting up storage directories..."
    
    sudo mkdir -p /mnt/swarm-storage/{postgres,redis,prometheus,grafana}
    sudo chown -R 999:999 /mnt/swarm-storage/postgres
    sudo chown -R 999:999 /mnt/swarm-storage/redis
    sudo chown -R 65534:65534 /mnt/swarm-storage/prometheus
    sudo chown -R 472:472 /mnt/swarm-storage/grafana
    
    log_success "Storage directories created"
}

# Setup secrets
setup_secrets() {
    log_info "Setting up Docker secrets..."
    
    mkdir -p secrets
    chmod 700 secrets
    
    # Generate passwords if files don't exist
    [ -f secrets/postgres_password.txt ] || openssl rand -base64 32 > secrets/postgres_password.txt
    [ -f secrets/mysql_root_password.txt ] || openssl rand -base64 32 > secrets/mysql_root_password.txt
    [ -f secrets/mysql_password.txt ] || openssl rand -base64 32 > secrets/mysql_password.txt
    [ -f secrets/redis_password.txt ] || openssl rand -base64 32 > secrets/redis_password.txt
    [ -f secrets/grafana_admin_password.txt ] || openssl rand -base64 32 > secrets/grafana_admin_password.txt
    
    chmod 600 secrets/*.txt
    
    # Create secrets in Swarm (if not exist)
    for secret in postgres_password mysql_root_password mysql_password redis_password grafana_admin_password; do
        if ! docker secret inspect $secret >/dev/null 2>&1; then
            docker secret create $secret secrets/${secret}.txt
            log_success "Created secret: $secret"
        else
            log_info "Secret already exists: $secret"
        fi
    done
    
    log_success "All secrets configured"
}

# Setup configs
setup_configs() {
    log_info "Setting up Docker configs..."
    
    # Remove old configs if they exist
    docker config rm nginx_config 2>/dev/null || true
    docker config rm nginx_default_conf 2>/dev/null || true
    docker config rm prometheus_config 2>/dev/null || true
    
    # Create new configs
    docker config create nginx_config nginx/nginx-swarm.conf
    docker config create nginx_default_conf nginx/conf.d/default.conf
    docker config create prometheus_config prometheus/prometheus.yml
    
    log_success "All configs created"
}

# Pull latest images
pull_images() {
    log_info "Pulling latest Docker images..."
    
    docker pull ${DOCKER_USERNAME}/godlionseeker-api:latest
    docker pull ${DOCKER_USERNAME}/godlionseeker-client:latest
    
    log_success "Images pulled successfully"
}

# Deploy stack
deploy_stack() {
    log_info "Deploying stack to Swarm..."
    
    docker stack deploy -c $COMPOSE_FILE $STACK_NAME --with-registry-auth
    
    log_success "Stack deployed"
}

# Wait for services
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    local max_wait=300
    local elapsed=0
    local interval=10
    
    while [ $elapsed -lt $max_wait ]; do
        local total=$(docker stack ps $STACK_NAME --filter "desired-state=running" --format "{{.CurrentState}}" 2>/dev/null | wc -l)
        local running=$(docker stack ps $STACK_NAME --filter "desired-state=running" --format "{{.CurrentState}}" 2>/dev/null | grep -c "Running" || echo "0")
        
        if [ "$total" -gt 0 ] && [ "$running" -eq "$total" ]; then
            log_success "All services are running ($running/$total)"
            return 0
        fi
        
        log_info "Services starting: $running/$total (waiting ${elapsed}s / ${max_wait}s)"
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    log_warning "Timeout waiting for all services to start"
    return 1
}

# Display deployment info
display_info() {
    log_info "Deployment Information:"
    echo ""
    
    echo -e "${BOLD}Stack Services:${NC}"
    docker stack services $STACK_NAME
    echo ""
    
    echo -e "${BOLD}Service Tasks:${NC}"
    docker stack ps $STACK_NAME --no-trunc | head -n 20
    echo ""
    
    local manager_ip=$(docker node inspect self --format '{{ .Status.Addr }}')
    
    echo -e "${BOLD}Access URLs:${NC}"
    echo -e "  Application:  ${GREEN}http://${manager_ip}${NC}"
    echo -e "  Grafana:      ${GREEN}http://${manager_ip}:3000${NC}"
    echo ""
    
    echo -e "${BOLD}Grafana Credentials:${NC}"
    echo -e "  Username: ${YELLOW}admin${NC}"
    echo -e "  Password: ${YELLOW}(stored in grafana_admin_password secret)${NC}"
    echo ""
    
    echo -e "${BOLD}Useful Commands:${NC}"
    echo -e "  Monitor:      ${YELLOW}./scripts/monitor-swarm.sh${NC}"
    echo -e "  Scale API:    ${YELLOW}docker service scale ${STACK_NAME}_api=5${NC}"
    echo -e "  View logs:    ${YELLOW}docker service logs -f ${STACK_NAME}_api${NC}"
    echo -e "  Backup:       ${YELLOW}./scripts/backup-swarm.sh${NC}"
    echo ""
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    local manager_ip=$(docker node inspect self --format '{{ .Status.Addr }}')
    
    # Check if Nginx is responding
    if curl -sf http://${manager_ip}/health > /dev/null; then
        log_success "Health check passed - Application is responding"
        return 0
    else
        log_warning "Health check failed - Application may not be fully ready yet"
        return 1
    fi
}

# Rollback function
rollback_deployment() {
    log_error "Deployment failed! Rolling back..."
    
    docker service update --rollback ${STACK_NAME}_api
    docker service update --rollback ${STACK_NAME}_client
    docker service update --rollback ${STACK_NAME}_nginx
    
    log_info "Rollback initiated. Check service status with:"
    log_info "  docker stack ps $STACK_NAME"
}

# Main deployment flow
main() {
    print_header
    
    # Trap errors and rollback
    trap 'log_error "Deployment failed!"; rollback_deployment; exit 1' ERR
    
    check_prerequisites
    setup_storage
    setup_secrets
    setup_configs
    pull_images
    deploy_stack
    
    if wait_for_services; then
        sleep 10  # Give services a moment to stabilize
        
        if health_check; then
            log_success "Deployment completed successfully! 🚀"
            display_info
        else
            log_warning "Deployment completed but health check failed"
            log_info "Services may still be initializing. Run health check manually:"
            log_info "  curl http://localhost/health"
            display_info
        fi
    else
        log_error "Services did not start in time"
        log_info "Check logs with: docker service logs ${STACK_NAME}_api"
        exit 1
    fi
}

# Handle script arguments
case "${1:-deploy}" in
    deploy)
        main
        ;;
    
    rollback)
        log_info "Rolling back deployment..."
        rollback_deployment
        ;;
    
    remove)
        log_warning "Removing stack: $STACK_NAME"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            docker stack rm $STACK_NAME
            log_success "Stack removed"
        else
            log_info "Removal cancelled"
        fi
        ;;
    
    status)
        docker stack services $STACK_NAME
        echo ""
        docker stack ps $STACK_NAME
        ;;
    
    logs)
        service="${2:-api}"
        docker service logs -f ${STACK_NAME}_${service}
        ;;
    
    scale)
        service="${2:-api}"
        replicas="${3:-3}"
        docker service scale ${STACK_NAME}_${service}=${replicas}
        ;;
    
    *)
        echo "Usage: $0 {deploy|rollback|remove|status|logs|scale}"
        echo ""
        echo "Commands:"
        echo "  deploy              Deploy the stack (default)"
        echo "  rollback            Rollback to previous deployment"
        echo "  remove              Remove the stack"
        echo "  status              Show stack status"
        echo "  logs [service]      Show service logs (default: api)"
        echo "  scale [service] [n] Scale service (default: api, 3 replicas)"
        exit 1
        ;;
esac

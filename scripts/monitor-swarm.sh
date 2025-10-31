#!/bin/bash
while true; do
  clear
  echo "=== Docker Swarm Status ==="
  echo ""
  echo "Nodes:"
  docker node ls
  echo ""
  echo "Services:"
  docker service ls
  echo ""
  echo "Service Tasks:"
  docker stack ps godlionseeker --no-trunc
  echo ""
  echo "Resource Usage:"
  docker stats --no-stream
  sleep 5
done

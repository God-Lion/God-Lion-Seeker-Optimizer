# Docker Swarm Operations Guide

## Daily Operations

### Check Cluster Health
```bash
docker node ls
docker service ls
docker stack ps godlionseeker
```
### View Service Logs
```bash
docker service logs -f godlionseeker_api
docker service logs --tail 100 godlionseeker_postgres
```
### Scale Services
```bash
docker service scale godlionseeker_api=5
```
### Deploy Updates
```bash
# Build new image
docker build -t localhost:5000/godlionseeker-api:v1.1.0 .
docker push localhost:5000/godlionseeker-api:v1.1.0

# Update service
docker service update --image localhost:5000/godlionseeker-api:v1.1.0 godlionseeker_api
```
## Emergency Procedures
### Service Not Starting
1.  Check logs: `docker service logs godlionseeker_api`
2.  Inspect service: `docker service inspect godlionseeker_api --pretty`
3.  Check node resources: `docker node inspect <node-id> --pretty`
4.  Verify secrets/configs exist: `docker secret ls`, `docker config ls`

### Node Failure
1.  Verify node status: `docker node ls`
2.  Check if tasks rescheduled: `docker service ps godlionseeker_api`
3.  If node recoverable, restart Docker: `sudo systemctl restart docker`
4.  If node unrecoverable, drain and remove:
    ```bash
    docker node update --availability drain <node-id>
    docker node rm <node-id>
    ```

### Database Issues
1.  Check PostgreSQL logs: `docker service logs godlionseeker_postgres`
2.  Access database: `docker exec -it <container-id> psql -U scraper_user -d godlionseeker`
3.  Check connections: `SELECT * FROM pg_stat_activity;`
4.  Restore from backup if needed

### Rollback Deployment
```bash
docker service rollback godlionseeker_api
```
## Maintenance Tasks
### Update Docker Engine
```bash
# On each node (one at a time)
docker node update --availability drain <node-id>
sudo apt-get update && sudo apt-get install docker-ce docker-ce-cli
sudo systemctl restart docker
docker node update --availability active <node-id>
```
### Rotate Secrets
```bash
# Create new secret
echo "new_password" | docker secret create db_password_v2 -

# Update service to use new secret
docker service update \
  --secret-rm db_password \
  --secret-add source=db_password_v2,target=db_password \
  godlionseeker_postgres
```
### Clean Up Resources
```bash
# Remove unused images
docker system prune -a

# Remove old tasks
docker service ps --filter "desired-state=shutdown" godlionseeker_api -q | \
  xargs docker rm
```

# SparkTest Cloud - DigitalOcean Deployment

This directory contains Docker Compose configuration for deploying SparkTest Cloud to DigitalOcean droplets.

## Quick Start

1. **Create a DigitalOcean Droplet:**
   ```bash
   # Create a Ubuntu 22.04 droplet (minimum 2GB RAM recommended)
   doctl compute droplet create sparktest-cloud \
     --image ubuntu-22-04-x64 \
     --size s-2vcpu-2gb \
     --region nyc1 \
     --ssh-keys your-ssh-key-id
   ```

2. **Deploy the application:**
   ```bash
   # Set your droplet IP
   export DROPLET_IP="your-droplet-ip-here"
   
   # Run deployment
   ./scripts/deploy-droplet.sh
   ```

3. **Access your application:**
   - Visit `http://your-droplet-ip` in your browser
   - The application will be running on port 80

## Architecture

```
Internet → Nginx (80/443) → Next.js Frontend (3000) → localStorage
                         → Redis (6379) [for future use]
```

### Services

- **Frontend**: Next.js application with your SparkTest Cloud UI
- **Nginx**: Reverse proxy with rate limiting and SSL termination
- **Redis**: For session storage and caching (prepared for future scaling)

## Configuration

### Environment Variables

Create a `.env` file for production settings:

```bash
# Production environment
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://your-domain.com

# Database (when you add backend)
# DATABASE_URL=postgresql://user:pass@host:5432/sparktest

# Stripe (for billing)
# STRIPE_PUBLIC_KEY=pk_live_...
# STRIPE_SECRET_KEY=sk_live_...
```

### SSL/HTTPS Setup

1. **Get SSL certificates** (Let's Encrypt recommended):
   ```bash
   # On your droplet
   sudo apt install certbot
   sudo certbot certonly --standalone -d your-domain.com
   ```

2. **Update nginx.conf** to uncomment HTTPS section

3. **Restart services**:
   ```bash
   docker-compose restart nginx
   ```

## Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update application
git pull
docker-compose build
docker-compose up -d

# Scale services (when needed)
docker-compose up -d --scale frontend=3
```

## Migration to DOKS

When ready to scale to DigitalOcean Kubernetes (DOKS):

1. **Convert docker-compose.yml to Kubernetes manifests**
2. **Set up DOKS cluster**:
   ```bash
   doctl kubernetes cluster create sparktest-cluster \
     --region nyc1 \
     --node-pool "name=worker-pool;size=s-2vcpu-2gb;count=3"
   ```
3. **Deploy using kubectl**

The current Docker Compose setup makes this migration straightforward.

## Monitoring

### Health Checks

- Application: `http://your-droplet-ip/health`
- Nginx: Built-in health checks in docker-compose.yml

### Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs frontend
docker-compose logs nginx
```

## Security

### Firewall Setup

```bash
# On your droplet
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable
```

### Rate Limiting

Nginx is configured with rate limiting:
- General requests: 30 req/s
- API requests: 10 req/s

## Backup

### Application Data

```bash
# Backup volumes
docker run --rm -v sparktest-cloud_app_data:/data -v $(pwd):/backup alpine tar czf /backup/app-data.tar.gz /data

# Restore volumes
docker run --rm -v sparktest-cloud_app_data:/data -v $(pwd):/backup alpine tar xzf /backup/app-data.tar.gz
```

## Cost Optimization

### Droplet Sizes

- **Development**: s-1vcpu-1gb ($6/month)
- **Production MVP**: s-2vcpu-2gb ($12/month)
- **Scaling**: s-4vcpu-8gb ($48/month)

### DOKS Migration

When you outgrow a single droplet:
- DOKS: $12/month + $12/node/month
- Load balancer: $12/month
- Managed databases: $15/month

## Troubleshooting

### Common Issues

1. **Application won't start**:
   ```bash
   docker-compose logs frontend
   ```

2. **Nginx errors**:
   ```bash
   docker-compose logs nginx
   nginx -t  # Test configuration
   ```

3. **Out of disk space**:
   ```bash
   docker system prune -a  # Clean up unused images
   ```

### Performance Monitoring

```bash
# Container stats
docker stats

# System resources
htop
df -h
```

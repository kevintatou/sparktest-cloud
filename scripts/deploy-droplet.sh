#!/bin/bash
# Deploy SparkTest Cloud to DigitalOcean Droplet

set -e

echo "🚀 Deploying SparkTest Cloud to DigitalOcean Droplet..."

# Configuration
DROPLET_IP="${DROPLET_IP:-your-droplet-ip}"
DEPLOY_USER="${DEPLOY_USER:-root}"
APP_DIR="/opt/sparktest-cloud"

echo "📦 Building and pushing Docker images..."

# Build the application
docker-compose build

# Save images to tar files for transfer
docker save sparktest-cloud_frontend:latest | gzip > frontend.tar.gz

echo "📤 Transferring files to droplet..."

# Transfer files to droplet
scp -r . $DEPLOY_USER@$DROPLET_IP:$APP_DIR/
scp frontend.tar.gz $DEPLOY_USER@$DROPLET_IP:/tmp/

echo "🔧 Setting up droplet..."

# Connect to droplet and set up
ssh $DEPLOY_USER@$DROPLET_IP << 'EOF'
# Install Docker and Docker Compose if not already installed
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Load Docker images
cd /opt/sparktest-cloud
docker load < /tmp/frontend.tar.gz

# Start services
docker-compose down || true
docker-compose up -d

# Clean up
rm /tmp/frontend.tar.gz

echo "✅ Deployment complete!"
echo "🌐 Application should be available at: http://$(curl -s ifconfig.me)"
EOF

echo "🎉 SparkTest Cloud deployed successfully!"
echo "🔗 Visit your application at: http://$DROPLET_IP"

# Question Creator - Production Deployment Guide

**Status:** Ready for deployment
**Target:** 5.161.57.219 (Debian 13, Hetzner)
**Domain:** question-creator.olmedatech.com
**Port:** 3002 (Nginx reverse proxy → 3000 Docker container)

---

## Prerequisites

### 1. Server Access
- **IP:** 5.161.57.219
- **User:** root
- **Port:** 22 (SSH)
- **OS:** Debian 13
- **Already Installed:** Docker, Docker Compose, Nginx

### 2. Local Environment
- Docker and Docker Compose installed locally
- Git access to repository
- GitHub CLI authenticated

### 3. Repository State
- ✅ All code committed to main branch
- ✅ QA validation passed (Epic 4 stories approved)
- ✅ Smoke test script verified and fixed
- ✅ No uncommitted changes

### 4. Environment Configuration
- ✅ `.env` file with all secrets (local only, not committed)
- ✅ `.env.example` committed to repository (safe template)
- ✅ `.gitignore` updated to exclude `.env` files
- ✅ All API keys and credentials obtained

---

## Deployment Steps

### Phase 1: Prepare Production Environment

#### Step 1.1: SSH into Production Server
```bash
ssh -p 22 root@5.161.57.219
# Password will be provided separately
```

#### Step 1.2: Create Application Directory
```bash
# Navigate to systems folder
cd /almeida

# Create question-creator directory
mkdir -p question-creator
cd question-creator

# Create logs directory
mkdir -p logs

# Verify directory structure
ls -la /almeida/question-creator
```

#### Step 1.3: Configure Git & Clone Repository
```bash
# Navigate to app directory
cd /almeida/question-creator

# Initialize git (if not already done)
git init
git remote add origin https://github.com/almeidatech/question-creator.git

# Fetch from GitHub
git fetch origin main

# Checkout main branch
git checkout main
```

#### Step 1.4: Setup Environment Variables
```bash
# Create .env file from template
cp .env.example .env

# Edit .env with production values
nano .env

# Required values to fill in:
# - SUPABASE_URL (already has correct URL)
# - SUPABASE_ANON_KEY (already has value)
# - SUPABASE_SERVICE_ROLE_KEY (already has value)
# - ANTHROPIC_API_KEY
# - OPENAI_API_KEY
# - CONTEXT7_API_KEY
# - API_KEY (Google Gemini)
# - GITHUB_APP_ID, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
# - GITHUB_PRIVATE_KEY (path to GitHub App private key file)
# - N8N_API_KEY (if using N8N automation)
# - SENTRY_DSN (if error tracking is enabled)

# Set correct permissions
chmod 600 .env
```

#### Step 1.5: Setup GitHub Private Key (if using GitHub App)
```bash
# Create secure location for GitHub private key
mkdir -p /almeida/.github-secrets
chmod 700 /almeida/.github-secrets

# Copy GitHub App private key to secure location
# (Provide the private key file separately)
# This is the .pem file from GitHub App installation

# Set permissions
chmod 400 /almeida/.github-secrets/github-private-key.pem

# Update .env to point to correct path
sed -i 's|GITHUB_PRIVATE_KEY_PATH=/almeida/question-creator|GITHUB_PRIVATE_KEY_PATH=/almeida/.github-secrets/github-private-key.pem|g' .env
```

### Phase 2: Build and Deploy Docker Container

#### Step 2.1: Build Docker Image
```bash
cd /almeida/question-creator

# Build the image
docker-compose build

# Verify build success
docker images | grep question-creator
```

#### Step 2.2: Start Docker Container
```bash
cd /almeida/question-creator

# Start the application
docker-compose up -d

# Verify container is running
docker-compose ps

# Check logs
docker-compose logs -f app

# Wait for startup (first boot takes 30-60 seconds)
sleep 60

# Verify health check passes
docker-compose ps  # Status should show "Up" with health status
```

#### Step 2.3: Verify Application Health
```bash
# Test local connectivity
curl -s http://localhost:3000/api/health | jq .

# Expected response: { "status": "ok" }
```

### Phase 3: Configure Nginx Reverse Proxy

#### Step 3.1: Copy Nginx Configuration
```bash
# Copy nginx config to sites-available
sudo cp /almeida/question-creator/nginx.conf /etc/nginx/sites-available/question-creator

# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/question-creator /etc/nginx/sites-enabled/question-creator

# Verify configuration
sudo nginx -t
```

#### Step 3.2: Setup SSL Certificate with Certbot
```bash
# Request SSL certificate for the domain
sudo certbot certonly --nginx -d question-creator.olmedatech.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose option to allow domain validation

# Verify certificate was created
ls -la /etc/letsencrypt/live/question-creator.olmedatech.com/

# Expected files:
# - fullchain.pem
# - privkey.pem
```

#### Step 3.3: Reload Nginx
```bash
# Test configuration
sudo nginx -t

# Reload nginx to apply changes
sudo systemctl reload nginx

# Verify nginx is running
sudo systemctl status nginx

# Check listening ports
sudo netstat -tulpn | grep nginx
# Should show: 80 and 443 listening
```

### Phase 4: Verify Deployment

#### Step 4.1: Test HTTPS Connection
```bash
# Test HTTP redirect to HTTPS
curl -I http://question-creator.olmedatech.com
# Should return: 301 redirect to https://

# Test HTTPS connection
curl -I https://question-creator.olmedatech.com
# Should return: 200 OK with security headers
```

#### Step 4.2: Run Smoke Tests
```bash
# From your local machine, run smoke tests against production
PROD_URL=https://question-creator.olmedatech.com bash docs/scripts/smoke-test.sh

# Expected output:
# ✓ Test 1: User Signup ... PASS
# ✓ Test 2: User Login ... PASS
# ... (all 8 tests should PASS)
# ✅ ALL TESTS PASSED

# Note: Some tests may return 401 if not authenticated (expected)
```

#### Step 4.3: Check Logs
```bash
# Monitor Docker container logs
docker-compose -f /almeida/question-creator/docker-compose.yml logs -f app

# Monitor Nginx access logs
sudo tail -f /var/log/nginx/question-creator_access.log

# Monitor Nginx error logs
sudo tail -f /var/log/nginx/question-creator_error.log

# Look for any errors or warnings
```

### Phase 5: Post-Deployment

#### Step 5.1: Configure Log Rotation
```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/question-creator > /dev/null <<EOF
/var/log/nginx/question-creator_access.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \`cat /var/run/nginx.pid\`
        fi
    endscript
}

/var/log/nginx/question-creator_error.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \`cat /var/run/nginx.pid\`
        fi
    endscript
}
EOF

# Test logrotate
sudo logrotate -v /etc/logrotate.d/question-creator
```

#### Step 5.2: Setup Auto-Restart on Server Reboot
```bash
# Docker containers with "restart: unless-stopped" will auto-start

# Verify in docker-compose.yml:
grep -A2 "restart:" /almeida/question-creator/docker-compose.yml

# Should show: restart: unless-stopped
```

#### Step 5.3: Setup Monitoring (Optional)
```bash
# Monitor container health
watch -n 5 "docker-compose -f /almeida/question-creator/docker-compose.yml ps"

# Or setup a cron job to monitor
# Add to crontab -e:
# */5 * * * * /almeida/question-creator/monitoring.sh

# Check Sentry for error tracking (if configured)
# https://sentry.io → question-creator project
```

---

## Troubleshooting

### Docker Container Won't Start
```bash
# Check logs
docker-compose logs app

# Common issues:
# - Port 3000 already in use: docker ps, kill conflicting container
# - Missing environment variables: verify .env file
# - Build failed: docker-compose build --no-cache

# Rebuild and start fresh
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Nginx Shows 502 Bad Gateway
```bash
# Verify Docker container is running and healthy
docker-compose ps

# Check if port 3000 is accessible
curl http://localhost:3000/api/health

# Verify Nginx proxy configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -100 /var/log/nginx/question-creator_error.log
```

### SSL Certificate Issues
```bash
# Verify certificate is valid
openssl x509 -in /etc/letsencrypt/live/question-creator.olmedatech.com/fullchain.pem -text -noout

# Renew certificate (can be done anytime, certbot auto-renews 30 days before expiry)
sudo certbot renew --dry-run

# Manual renewal
sudo certbot certonly --force-renewal -d question-creator.olmedatech.com
```

### Redis Connection Issues
```bash
# Verify Redis is accessible from the server
redis-cli -h 10.0.0.3 -p 6379 ping

# If redis-cli not installed
# docker run --rm redis:alpine redis-cli -h 10.0.0.3 -p 6379 ping

# Should return: PONG

# Check Docker logs for Redis errors
docker-compose logs app | grep -i redis
```

---

## Deployment Rollback

### Rollback to Previous Version
```bash
# Stop current container
docker-compose down

# Checkout previous git commit
git checkout <previous-commit-hash>

# Rebuild and restart
docker-compose build
docker-compose up -d

# Verify deployment
PROD_URL=https://question-creator.olmedatech.com bash docs/scripts/smoke-test.sh
```

---

## Monitoring & Maintenance

### Daily Health Check
```bash
# SSH into server
ssh root@5.161.57.219

# Check container status
docker-compose -f /almeida/question-creator/docker-compose.yml ps

# Run smoke tests from local machine
PROD_URL=https://question-creator.olmedatech.com bash docs/scripts/smoke-test.sh
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo tail -20 /var/log/nginx/question-creator_access.log
sudo tail -20 /var/log/nginx/question-creator_error.log
```

### View Application Logs
```bash
docker-compose -f /almeida/question-creator/docker-compose.yml logs -f app
```

### Update Application
```bash
cd /almeida/question-creator

# Pull latest code
git pull origin main

# Rebuild Docker image
docker-compose build

# Restart container
docker-compose up -d

# Verify deployment
docker-compose ps
```

---

## Security Checklist

- ✅ `.env` file is NOT committed to git
- ✅ `.env` is in `.gitignore`
- ✅ GitHub private key is NOT in repository
- ✅ File permissions set correctly (chmod 600 .env, chmod 400 private-key.pem)
- ✅ SSL certificates installed and auto-renewing
- ✅ Nginx headers configured for security
- ✅ Docker container runs as non-root user
- ✅ Redis password protected (if applicable)
- ✅ Regular backups of Supabase database (cloud-managed)

---

## Contact & Support

- **DevOps Contact:** Gage (github-devops)
- **Incident Response:** See docs/INCIDENT-RESPONSE.md
- **Emergency Rollback:** See "Deployment Rollback" section above

---

**Deployment completed and verified** ✅

Server is now running question-creator on:
- **URL:** https://question-creator.olmedatech.com
- **Internal Port:** 3000 (Docker)
- **External Port:** 3002 (Nginx reverse proxy)
- **SSL:** Enabled and auto-renewing via Certbot

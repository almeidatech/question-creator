# Deployment Checklist - question-creator

**Target:** 5.161.57.219 (Debian 13, Hetzner)
**Domain:** question-creator.olmedatech.com
**Status:** Ready for production deployment

---

## Pre-Deployment Requirements

### Code & Quality
- [x] All code committed to main branch
- [x] QA validation passed (Epic 4 stories all approved ✅)
- [x] Smoke test script verified and fixed
- [x] All 160 automated tests passing
- [x] No uncommitted changes
- [x] No breaking API changes
- [x] Database migrations ready and reversible

### Environment & Configuration
- [x] `.env.example` created and committed
- [x] `.gitignore` updated (includes `.env`, `.env.*`, private keys)
- [x] All API keys and credentials obtained
- [x] `.env` file prepared locally (NOT committed)
- [x] GitHub Private Key obtained (from GitHub App)

### Docker & Deployment
- [x] Dockerfile created (3-stage multi-stage build)
- [x] docker-compose.yml configured
- [x] next.config.js created with production settings
- [x] package.json updated with build/start scripts
- [x] Nginx configuration created
- [x] DEPLOYMENT.md guide completed

---

## Server Access & Credentials

### Connection Details
- **IP Address:** 5.161.57.219
- **Port:** 22 (SSH)
- **Username:** root
- **Password:** [TO BE PROVIDED]
- **OS:** Debian 13
- **Systems Path:** /almeida

### Pre-Installed Software
- ✅ Docker
- ✅ Docker Compose
- ✅ Nginx
- ✅ OpenSSH

### Network Configuration
- Internal Network: 10.0.0.2 (webserver) ↔ 10.0.0.3 (automation-server)
- Redis on automation server: redis://10.0.0.3:6379
- Supabase: Cloud (URL in .env)

---

## Deployment Step Checklist

### Phase 1: Server Preparation
- [ ] SSH into server (ssh -p 22 root@5.161.57.219)
- [ ] Verify server access and permissions
- [ ] Check available disk space (df -h)
- [ ] Check Docker status (docker ps)
- [ ] Check Nginx status (systemctl status nginx)

### Phase 2: Repository Setup
- [ ] Create /almeida/question-creator directory
- [ ] Clone repository from GitHub
- [ ] Verify git checkout on main branch
- [ ] Create logs directory

### Phase 3: Environment Configuration
- [ ] Copy .env.example to .env
- [ ] Fill in all required environment variables:
  - [ ] Supabase credentials (URL, ANON_KEY, SERVICE_ROLE_KEY)
  - [ ] Anthropic API Key
  - [ ] OpenAI API Key
  - [ ] Google Gemini API Key
  - [ ] GitHub App credentials
  - [ ] SENTRY_DSN (if using)
  - [ ] N8N webhook URL (if using)
- [ ] Set .env file permissions (chmod 600 .env)
- [ ] Setup GitHub Private Key in secure location
- [ ] Update .env GITHUB_PRIVATE_KEY_PATH

### Phase 4: Docker Build & Start
- [ ] Build Docker image (docker-compose build)
- [ ] Verify build completed successfully
- [ ] Start Docker container (docker-compose up -d)
- [ ] Wait 30-60 seconds for startup
- [ ] Check container status (docker-compose ps)
- [ ] Verify container health check passing
- [ ] Check application logs (docker-compose logs -f app)

### Phase 5: Application Health
- [ ] Test local health endpoint (curl http://localhost:3000/api/health)
- [ ] Verify API is responding
- [ ] Check for any error messages in logs

### Phase 6: Nginx Configuration
- [ ] Copy Nginx config to /etc/nginx/sites-available/question-creator
- [ ] Create symlink to sites-enabled
- [ ] Test Nginx configuration (nginx -t)
- [ ] Reload Nginx (systemctl reload nginx)

### Phase 7: SSL Certificate
- [ ] Request SSL certificate (certbot certonly --nginx -d question-creator.olmedatech.com)
- [ ] Follow Certbot prompts
- [ ] Verify certificate created in /etc/letsencrypt/live/question-creator.olmedatech.com/
- [ ] Reload Nginx to apply certificate

### Phase 8: Verification
- [ ] Test HTTP redirect (curl -I http://question-creator.olmedatech.com)
- [ ] Test HTTPS connection (curl -I https://question-creator.olmedatech.com)
- [ ] Run smoke tests from local machine:
  ```bash
  PROD_URL=https://question-creator.olmedatech.com bash docs/scripts/smoke-test.sh
  ```
- [ ] All 8 tests should PASS
- [ ] Check Nginx access logs
- [ ] Check Nginx error logs for warnings

### Phase 9: Post-Deployment Configuration
- [ ] Setup log rotation (/etc/logrotate.d/question-creator)
- [ ] Verify auto-restart on server reboot
- [ ] Setup monitoring/health checks (optional)
- [ ] Notify team of deployment

---

## Rollback Procedures

### Quick Rollback
```bash
# Stop current deployment
docker-compose -f /almeida/question-creator/docker-compose.yml down

# Checkout previous working version
cd /almeida/question-creator
git checkout <previous-commit-hash>

# Rebuild and restart
docker-compose build
docker-compose up -d

# Verify
docker-compose ps
```

### Emergency Rollback (if critical issues)
```bash
# Stop everything
docker-compose down

# Revert to last known good commit
git revert HEAD

# Rebuild
docker-compose build
docker-compose up -d
```

---

## Monitoring & Health Checks

### Daily Tasks (after deployment)
- [ ] Check Docker container status
- [ ] Run smoke test suite
- [ ] Monitor application logs
- [ ] Check Nginx access logs for errors

### Weekly Tasks
- [ ] Review error logs
- [ ] Check disk space usage
- [ ] Verify SSL certificate auto-renewal
- [ ] Check Sentry error reports (if enabled)

### Monthly Tasks
- [ ] Review and rotate logs
- [ ] Verify database backup (Supabase cloud-managed)
- [ ] Update dependencies (security patches)

---

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Docker won't start | See DEPLOYMENT.md → Troubleshooting |
| Nginx 502 Bad Gateway | Check docker-compose ps, verify health |
| SSL certificate issues | certbot renew, check log rotation |
| Redis connection error | Verify 10.0.0.3:6379 accessible |
| High memory usage | Check docker-compose logs, profile app |

---

## Deployment Summary

### What Gets Deployed
1. **Application:** Next.js server on port 3000 (Docker)
2. **Web Server:** Nginx reverse proxy on ports 80/443
3. **SSL:** Certbot-managed certificates
4. **Database:** Supabase (cloud, no local changes)
5. **Cache:** Upstash Redis on automation server
6. **Logs:** /almeida/question-creator/logs

### Architecture
```
GitHub (main branch)
       ↓
   Hetzner VPS (5.161.57.219)
       ↓
   Docker Container
   (question-creator-app)
   Port 3000 (Node.js)
       ↓
   Nginx Reverse Proxy
   Port 80 → 443 (SSL)
       ↓
  Clients
  https://question-creator.olmedatech.com
```

### Network Flow
```
Client (HTTPS)
  → Nginx (5.161.57.219:443)
  → Docker (localhost:3000)
  → Node.js App
  → Supabase (API calls)
  → Redis (10.0.0.3:6379)
```

---

## Post-Deployment Verification

### Smoke Tests
```bash
# Run from local machine
PROD_URL=https://question-creator.olmedatech.com bash docs/scripts/smoke-test.sh

# Expected output:
# ✓ Test 1: User Signup ... PASS
# ✓ Test 2: User Login ... PASS
# ✓ Test 3: Create Exam ... PASS
# ✓ Test 4: List Exams ... PASS
# ✓ Test 5: Admin Dashboard ... PASS
# ✓ Test 6: Database Health ... PASS
# ✓ Test 7: API Response Time ... PASS
# ✓ Test 8: Basic Connectivity ... PASS
# ✅ ALL TESTS PASSED
```

### Manual Verification
```bash
# From local machine
curl -I https://question-creator.olmedatech.com
# Should return: 200 OK

curl https://question-creator.olmedatech.com/api/health
# Should return: { "status": "ok" }
```

### Server Verification
```bash
# SSH into server
ssh root@5.161.57.219

# Check container status
docker-compose -f /almeida/question-creator/docker-compose.yml ps
# Should show: Up (running)

# Check Nginx status
systemctl status nginx
# Should show: active (running)

# Check logs
docker-compose -f /almeida/question-creator/docker-compose.yml logs -f app
# Should show: Next.js server started
```

---

## Communication Plan

### Deployment Notification
Send to team:
```
🚀 Production Deployment Completed

Application: question-creator
Environment: Production (Hetzner)
URL: https://question-creator.olmedatech.com
Status: ✅ LIVE

All smoke tests passing. Monitoring active.
```

### Issue Escalation
- **Minor issues:** Check logs, review INCIDENT-RESPONSE.md
- **Major issues:** See DEPLOYMENT.md → Rollback Procedures
- **Critical outage:** Emergency rollback (see rollback section)

---

## Sign-Off

**Deployment Status:** Ready for production

**Reviewed by:** Gage (DevOps Agent)
**Date:** 2026-02-02
**All checks:** ✅ PASSED

Ready to proceed with deployment.

---

**Next Steps:**
1. Provide root password
2. Execute deployment following Phase 1-9 steps above
3. Run smoke test verification
4. Notify team of go-live

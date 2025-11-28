# Flowlet Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Flowlet financial backend in a production environment with enterprise-grade security, compliance, and scalability.

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04 LTS or later, CentOS 8+, or RHEL 8+
- **Python**: 3.11 or later
- **Memory**: Minimum 8GB RAM (16GB+ recommended for production)
- **Storage**: Minimum 100GB SSD (500GB+ recommended for production)
- **CPU**: Minimum 4 cores (8+ cores recommended for production)
- **Network**: High-speed internet connection with low latency

### Required Services

- **Database**: PostgreSQL 14+ (recommended) or MySQL 8.0+
- **Cache**: Redis 6.0+ or Memcached 1.6+
- **Message Queue**: RabbitMQ 3.9+ or Apache Kafka 2.8+
- **Load Balancer**: Nginx 1.20+ or HAProxy 2.4+
- **Monitoring**: Prometheus + Grafana or equivalent
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana) or equivalent

## Installation Steps

### 1. System Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required system packages
sudo apt install -y python3.11 python3.11-venv python3.11-dev \
    postgresql-client redis-tools nginx supervisor \
    build-essential libssl-dev libffi-dev \
    git curl wget unzip

# Create application user
sudo useradd -m -s /bin/bash flowlet
sudo usermod -aG sudo flowlet
```

### 2. Database Setup

#### PostgreSQL (Recommended)

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE flowlet_production;
CREATE USER flowlet_user WITH ENCRYPTED PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE flowlet_production TO flowlet_user;
ALTER USER flowlet_user CREATEDB;
\q
EOF

# Configure PostgreSQL for production
sudo nano /etc/postgresql/14/main/postgresql.conf
# Update these settings:
# shared_buffers = 256MB
# effective_cache_size = 1GB
# work_mem = 4MB
# maintenance_work_mem = 64MB
# max_connections = 200

sudo systemctl restart postgresql
```

### 3. Redis Setup

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis for production
sudo nano /etc/redis/redis.conf
# Update these settings:
# maxmemory 512mb
# maxmemory-policy allkeys-lru
# save 900 1
# save 300 10
# save 60 10000

sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### 4. Application Deployment

```bash
# Switch to application user
sudo su - flowlet

# Clone the repository
git clone https://github.com/your-org/Flowlet.git
cd Flowlet/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create environment configuration
cp .env.example .env
nano .env
# Update all configuration values for production

# Initialize database
python production_app.py db init
python production_app.py db migrate -m "Initial migration"
python production_app.py db upgrade

# Create logs directory
mkdir -p logs
chmod 755 logs
```

### 5. SSL/TLS Configuration

```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

### 6. Nginx Configuration

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/flowlet

# Add the following configuration:
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    location / {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    location /api/v1/auth {
        limit_req zone=auth burst=10 nodelay;

        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:5001;
        access_log off;
    }

    # Static files (if any)
    location /static {
        alias /home/flowlet/Flowlet/backend/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/flowlet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 7. Process Management with Supervisor

```bash
# Install Supervisor
sudo apt install -y supervisor

# Create Supervisor configuration
sudo nano /etc/supervisor/conf.d/flowlet.conf

# Add the following configuration:
[program:flowlet]
command=/home/flowlet/Flowlet/backend/venv/bin/gunicorn --bind 127.0.0.1:5001 --workers 4 --worker-class gevent --worker-connections 1000 --timeout 30 --keep-alive 2 --max-requests 1000 --max-requests-jitter 100 --preload production_app:app
directory=/home/flowlet/Flowlet/backend
user=flowlet
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/home/flowlet/Flowlet/backend/logs/gunicorn.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=10
environment=PATH="/home/flowlet/Flowlet/backend/venv/bin"

# Update Supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start flowlet
sudo supervisorctl status
```

### 8. Monitoring Setup

#### Prometheus Configuration

```bash
# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
sudo mv prometheus-2.40.0.linux-amd64 /opt/prometheus
sudo useradd --no-create-home --shell /bin/false prometheus
sudo chown -R prometheus:prometheus /opt/prometheus

# Create Prometheus configuration
sudo nano /opt/prometheus/prometheus.yml

global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "flowlet_rules.yml"

scrape_configs:
  - job_name: 'flowlet-backend'
    static_configs:
      - targets: ['localhost:5001']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['localhost:9121']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - localhost:9093

# Create systemd service
sudo nano /etc/systemd/system/prometheus.service

[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/opt/prometheus/prometheus \
    --config.file /opt/prometheus/prometheus.yml \
    --storage.tsdb.path /opt/prometheus/data \
    --web.console.templates=/opt/prometheus/consoles \
    --web.console.libraries=/opt/prometheus/console_libraries \
    --web.listen-address=0.0.0.0:9090 \
    --web.enable-lifecycle

[Install]
WantedBy=multi-user.target

sudo systemctl daemon-reload
sudo systemctl start prometheus
sudo systemctl enable prometheus
```

#### Grafana Setup

```bash
# Install Grafana
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
sudo apt update
sudo apt install -y grafana

# Start Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server

# Access Grafana at http://your-server:3000
# Default login: admin/admin
```

### 9. Backup Configuration

```bash
# Create backup script
sudo nano /home/flowlet/backup.sh

#!/bin/bash
BACKUP_DIR="/home/flowlet/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="flowlet_production"
DB_USER="flowlet_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /home/flowlet/Flowlet

# Upload to cloud storage (example with AWS S3)
aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://your-backup-bucket/database/
aws s3 cp $BACKUP_DIR/app_backup_$DATE.tar.gz s3://your-backup-bucket/application/

# Clean up old backups (keep last 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# Make script executable
chmod +x /home/flowlet/backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/flowlet/backup.sh
```

### 10. Security Hardening

```bash
# Firewall configuration
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Fail2ban for intrusion prevention
sudo apt install -y fail2ban

sudo nano /etc/fail2ban/jail.local

[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10

sudo systemctl restart fail2ban
```

### 11. Log Management

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/flowlet

/home/flowlet/Flowlet/backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 flowlet flowlet
    postrotate
        supervisorctl restart flowlet
    endscript
}

# Test log rotation
sudo logrotate -d /etc/logrotate.d/flowlet
```

### 12. Health Checks and Monitoring

```bash
# Create health check script
nano /home/flowlet/health_check.sh

#!/bin/bash
HEALTH_URL="https://yourdomain.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): Health check passed"
    exit 0
else
    echo "$(date): Health check failed with status $RESPONSE"
    # Send alert (email, Slack, etc.)
    exit 1
fi

chmod +x /home/flowlet/health_check.sh

# Add to crontab for regular health checks
crontab -e
# Add: */5 * * * * /home/flowlet/health_check.sh >> /home/flowlet/logs/health_check.log 2>&1
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_accounts_user_id ON accounts(user_id);
CREATE INDEX CONCURRENTLY idx_transactions_account_id ON transactions(account_id);
CREATE INDEX CONCURRENTLY idx_transactions_created_at ON transactions(created_at);
CREATE INDEX CONCURRENTLY idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Analyze tables for query optimization
ANALYZE users;
ANALYZE accounts;
ANALYZE transactions;
ANALYZE audit_logs;
```

### Application Optimization

```bash
# Configure Gunicorn for optimal performance
# Update Supervisor configuration with optimized settings:

[program:flowlet]
command=/home/flowlet/Flowlet/backend/venv/bin/gunicorn \
    --bind 127.0.0.1:5001 \
    --workers 8 \
    --worker-class gevent \
    --worker-connections 1000 \
    --timeout 30 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --preload \
    --access-logfile /home/flowlet/Flowlet/backend/logs/access.log \
    --error-logfile /home/flowlet/Flowlet/backend/logs/error.log \
    --log-level info \
    production_app:app
```

## Compliance and Security

### PCI DSS Compliance

1. **Network Security**: Implement firewalls and network segmentation
2. **Data Protection**: Encrypt sensitive data at rest and in transit
3. **Access Control**: Implement strong authentication and authorization
4. **Monitoring**: Log all access to cardholder data
5. **Testing**: Regular security testing and vulnerability assessments
6. **Policies**: Maintain information security policies

### GDPR Compliance

1. **Data Minimization**: Collect only necessary data
2. **Consent Management**: Implement proper consent mechanisms
3. **Right to Erasure**: Provide data deletion capabilities
4. **Data Portability**: Allow data export in machine-readable format
5. **Breach Notification**: Implement breach detection and notification
6. **Privacy by Design**: Build privacy into system architecture

### SOX Compliance

1. **Access Controls**: Implement segregation of duties
2. **Change Management**: Document all system changes
3. **Audit Trails**: Maintain comprehensive audit logs
4. **Data Integrity**: Ensure data accuracy and completeness
5. **Backup and Recovery**: Implement robust backup procedures
6. **Documentation**: Maintain detailed system documentation

## Disaster Recovery

### Backup Strategy

1. **Database Backups**: Daily full backups, hourly incremental
2. **Application Backups**: Daily application and configuration backups
3. **Log Backups**: Real-time log shipping to remote location
4. **Testing**: Monthly backup restoration testing

### Recovery Procedures

1. **RTO (Recovery Time Objective)**: 4 hours maximum
2. **RPO (Recovery Point Objective)**: 1 hour maximum
3. **Failover Process**: Automated failover to standby systems
4. **Communication Plan**: Stakeholder notification procedures

## Maintenance

### Regular Tasks

1. **Security Updates**: Weekly security patch installation
2. **Performance Monitoring**: Daily performance review
3. **Backup Verification**: Weekly backup integrity checks
4. **Log Analysis**: Daily log review for anomalies
5. **Capacity Planning**: Monthly capacity utilization review

### Scheduled Maintenance

1. **Database Maintenance**: Weekly VACUUM and ANALYZE
2. **Certificate Renewal**: Automated SSL certificate renewal
3. **Dependency Updates**: Monthly dependency security updates
4. **Performance Tuning**: Quarterly performance optimization
5. **Security Audits**: Annual third-party security assessments

## Troubleshooting

### Common Issues

1. **High CPU Usage**: Check for inefficient queries, increase worker count
2. **Memory Leaks**: Monitor memory usage, restart workers periodically
3. **Database Locks**: Identify and optimize long-running transactions
4. **SSL Certificate Issues**: Verify certificate validity and renewal
5. **Rate Limiting**: Adjust rate limits based on usage patterns

### Monitoring Alerts

1. **Application Errors**: 5xx HTTP status codes
2. **Database Issues**: Connection failures, slow queries
3. **Security Events**: Failed authentication attempts, suspicious activity
4. **Performance Issues**: High response times, resource utilization
5. **Infrastructure Issues**: Disk space, memory usage, network connectivity

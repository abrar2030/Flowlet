"""
Real-time monitoring and alerting system for financial applications
"""

import json
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass, asdict
import threading
import queue
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class AlertSeverity(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class AlertType(Enum):
    """Types of alerts"""
    SECURITY_BREACH = "security_breach"
    FRAUD_DETECTION = "fraud_detection"
    SYSTEM_ERROR = "system_error"
    PERFORMANCE_ISSUE = "performance_issue"
    COMPLIANCE_VIOLATION = "compliance_violation"
    TRANSACTION_ANOMALY = "transaction_anomaly"
    USER_BEHAVIOR_ANOMALY = "user_behavior_anomaly"
    SYSTEM_HEALTH = "system_health"

@dataclass
class Alert:
    """Alert data structure"""
    id: str
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    description: str
    timestamp: datetime
    source: str
    user_id: Optional[str] = None
    transaction_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

class MetricCollector:
    """Collects and analyzes system metrics"""
    
    def __init__(self):
        self.metrics = {}
        self.thresholds = {
            'response_time_ms': 5000,  # 5 seconds
            'error_rate_percent': 5.0,  # 5%
            'cpu_usage_percent': 80.0,  # 80%
            'memory_usage_percent': 85.0,  # 85%
            'disk_usage_percent': 90.0,  # 90%
            'failed_login_attempts': 10,  # per minute
            'transaction_failure_rate': 2.0,  # 2%
        }
    
    def record_metric(self, metric_name: str, value: float, timestamp: datetime = None):
        """Record a metric value"""
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)
        
        if metric_name not in self.metrics:
            self.metrics[metric_name] = []
        
        self.metrics[metric_name].append({
            'value': value,
            'timestamp': timestamp
        })
        
        # Keep only last 1000 entries per metric
        if len(self.metrics[metric_name]) > 1000:
            self.metrics[metric_name] = self.metrics[metric_name][-1000:]
    
    def get_metric_average(self, metric_name: str, minutes: int = 5) -> Optional[float]:
        """Get average metric value over specified time period"""
        if metric_name not in self.metrics:
            return None
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        recent_values = [
            entry['value'] for entry in self.metrics[metric_name]
            if entry['timestamp'] >= cutoff_time
        ]
        
        if not recent_values:
            return None
        
        return sum(recent_values) / len(recent_values)
    
    def check_thresholds(self) -> List[Alert]:
        """Check if any metrics exceed thresholds"""
        alerts = []
        
        for metric_name, threshold in self.thresholds.items():
            avg_value = self.get_metric_average(metric_name)
            
            if avg_value is not None and avg_value > threshold:
                severity = AlertSeverity.CRITICAL if avg_value > threshold * 1.5 else AlertSeverity.WARNING
                
                alert = Alert(
                    id=f"metric_{metric_name}_{int(time.time())}",
                    alert_type=AlertType.PERFORMANCE_ISSUE,
                    severity=severity,
                    title=f"High {metric_name.replace('_', ' ').title()}",
                    description=f"{metric_name} is {avg_value:.2f}, exceeding threshold of {threshold}",
                    timestamp=datetime.now(timezone.utc),
                    source="metric_collector",
                    metadata={
                        'metric_name': metric_name,
                        'current_value': avg_value,
                        'threshold': threshold
                    }
                )
                alerts.append(alert)
        
        return alerts

class SecurityMonitor:
    """Monitors security-related events"""
    
    def __init__(self):
        self.failed_login_attempts = {}
        self.suspicious_ips = set()
        self.blocked_ips = set()
    
    def record_failed_login(self, ip_address: str, user_email: str = None) -> Optional[Alert]:
        """Record failed login attempt and check for suspicious activity"""
        current_time = datetime.now(timezone.utc)
        
        if ip_address not in self.failed_login_attempts:
            self.failed_login_attempts[ip_address] = []
        
        self.failed_login_attempts[ip_address].append({
            'timestamp': current_time,
            'user_email': user_email
        })
        
        # Clean old attempts (older than 1 hour)
        one_hour_ago = current_time - timedelta(hours=1)
        self.failed_login_attempts[ip_address] = [
            attempt for attempt in self.failed_login_attempts[ip_address]
            if attempt['timestamp'] >= one_hour_ago
        ]
        
        # Check for brute force attack
        recent_attempts = len(self.failed_login_attempts[ip_address])
        
        if recent_attempts >= 10:  # 10 failed attempts in 1 hour
            self.suspicious_ips.add(ip_address)
            
            if recent_attempts >= 20:  # 20 failed attempts - block IP
                self.blocked_ips.add(ip_address)
                
                return Alert(
                    id=f"brute_force_{ip_address}_{int(time.time())}",
                    alert_type=AlertType.SECURITY_BREACH,
                    severity=AlertSeverity.CRITICAL,
                    title="Brute Force Attack Detected",
                    description=f"IP {ip_address} has made {recent_attempts} failed login attempts",
                    timestamp=current_time,
                    source="security_monitor",
                    metadata={
                        'ip_address': ip_address,
                        'failed_attempts': recent_attempts,
                        'action_taken': 'ip_blocked'
                    }
                )
        
        return None
    
    def check_suspicious_transaction_patterns(self, transactions: List[Dict]) -> List[Alert]:
        """Check for suspicious transaction patterns"""
        alerts = []
        
        # Group transactions by user
        user_transactions = {}
        for transaction in transactions:
            user_id = transaction.get('user_id')
            if user_id:
                if user_id not in user_transactions:
                    user_transactions[user_id] = []
                user_transactions[user_id].append(transaction)
        
        # Check each user's transactions
        for user_id, user_txns in user_transactions.items():
            # Check for rapid transactions
            if len(user_txns) > 5:  # More than 5 transactions
                timestamps = [txn.get('timestamp') for txn in user_txns if txn.get('timestamp')]
                if timestamps:
                    timestamps.sort()
                    time_span = timestamps[-1] - timestamps[0]
                    
                    if time_span < timedelta(minutes=10):  # All within 10 minutes
                        alert = Alert(
                            id=f"rapid_transactions_{user_id}_{int(time.time())}",
                            alert_type=AlertType.TRANSACTION_ANOMALY,
                            severity=AlertSeverity.WARNING,
                            title="Rapid Transaction Pattern Detected",
                            description=f"User {user_id} made {len(user_txns)} transactions in {time_span}",
                            timestamp=datetime.now(timezone.utc),
                            source="security_monitor",
                            user_id=user_id,
                            metadata={
                                'transaction_count': len(user_txns),
                                'time_span_minutes': time_span.total_seconds() / 60
                            }
                        )
                        alerts.append(alert)
        
        return alerts

class ComplianceMonitor:
    """Monitors compliance-related events"""
    
    def __init__(self):
        self.large_transaction_threshold = 10000.00  # $10,000
        self.daily_limit_threshold = 50000.00  # $50,000
    
    def check_large_transactions(self, transactions: List[Dict]) -> List[Alert]:
        """Check for large transactions requiring reporting"""
        alerts = []
        
        for transaction in transactions:
            amount = float(transaction.get('amount', 0))
            
            if amount >= self.large_transaction_threshold:
                alert = Alert(
                    id=f"large_transaction_{transaction.get('id')}_{int(time.time())}",
                    alert_type=AlertType.COMPLIANCE_VIOLATION,
                    severity=AlertSeverity.WARNING,
                    title="Large Transaction Detected",
                    description=f"Transaction of ${amount:,.2f} requires compliance review",
                    timestamp=datetime.now(timezone.utc),
                    source="compliance_monitor",
                    user_id=transaction.get('user_id'),
                    transaction_id=transaction.get('id'),
                    metadata={
                        'amount': amount,
                        'threshold': self.large_transaction_threshold,
                        'requires_ctr': amount >= 10000  # Currency Transaction Report
                    }
                )
                alerts.append(alert)
        
        return alerts
    
    def check_daily_limits(self, user_daily_volumes: Dict[str, float]) -> List[Alert]:
        """Check for users exceeding daily limits"""
        alerts = []
        
        for user_id, daily_volume in user_daily_volumes.items():
            if daily_volume >= self.daily_limit_threshold:
                alert = Alert(
                    id=f"daily_limit_{user_id}_{int(time.time())}",
                    alert_type=AlertType.COMPLIANCE_VIOLATION,
                    severity=AlertSeverity.WARNING,
                    title="Daily Transaction Limit Exceeded",
                    description=f"User {user_id} has transacted ${daily_volume:,.2f} today",
                    timestamp=datetime.now(timezone.utc),
                    source="compliance_monitor",
                    user_id=user_id,
                    metadata={
                        'daily_volume': daily_volume,
                        'threshold': self.daily_limit_threshold
                    }
                )
                alerts.append(alert)
        
        return alerts

class AlertManager:
    """Manages alerts and notifications"""
    
    def __init__(self, email_config: Dict = None):
        self.alerts = []
        self.alert_queue = queue.Queue()
        self.email_config = email_config or {}
        self.notification_channels = []
        
        # Start alert processing thread
        self.processing_thread = threading.Thread(target=self._process_alerts, daemon=True)
        self.processing_thread.start()
    
    def add_alert(self, alert: Alert):
        """Add a new alert"""
        self.alerts.append(alert)
        self.alert_queue.put(alert)
    
    def _process_alerts(self):
        """Process alerts in background thread"""
        while True:
            try:
                alert = self.alert_queue.get(timeout=1)
                self._handle_alert(alert)
                self.alert_queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Error processing alert: {str(e)}")
    
    def _handle_alert(self, alert: Alert):
        """Handle a single alert"""
        # Log the alert
        print(f"ALERT [{alert.severity.value.upper()}] {alert.title}: {alert.description}")
        
        # Send notifications based on severity
        if alert.severity in [AlertSeverity.ERROR, AlertSeverity.CRITICAL]:
            self._send_email_notification(alert)
            self._send_slack_notification(alert)
        elif alert.severity == AlertSeverity.WARNING:
            self._send_slack_notification(alert)
    
    def _send_email_notification(self, alert: Alert):
        """Send email notification for critical alerts"""
        if not self.email_config:
            return
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_config.get('from_email')
            msg['To'] = self.email_config.get('to_email')
            msg['Subject'] = f"[FLOWLET ALERT] {alert.title}"
            
            body = f"""
            Alert Details:
            
            Type: {alert.alert_type.value}
            Severity: {alert.severity.value.upper()}
            Time: {alert.timestamp.isoformat()}
            Source: {alert.source}
            
            Description: {alert.description}
            
            Metadata: {json.dumps(alert.metadata, indent=2) if alert.metadata else 'None'}
            
            Alert ID: {alert.id}
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.email_config.get('smtp_server'), self.email_config.get('smtp_port'))
            server.starttls()
            server.login(self.email_config.get('username'), self.email_config.get('password'))
            server.send_message(msg)
            server.quit()
            
        except Exception as e:
            print(f"Failed to send email notification: {str(e)}")
    
    def _send_slack_notification(self, alert: Alert):
        """Send Slack notification"""
        # Implementation would use Slack webhook
        pass
    
    def get_active_alerts(self, severity: AlertSeverity = None) -> List[Alert]:
        """Get active (unresolved) alerts"""
        active_alerts = [alert for alert in self.alerts if not alert.resolved]
        
        if severity:
            active_alerts = [alert for alert in active_alerts if alert.severity == severity]
        
        return sorted(active_alerts, key=lambda x: x.timestamp, reverse=True)
    
    def resolve_alert(self, alert_id: str, resolved_by: str = None):
        """Mark an alert as resolved"""
        for alert in self.alerts:
            if alert.id == alert_id:
                alert.resolved = True
                alert.resolved_at = datetime.now(timezone.utc)
                alert.resolved_by = resolved_by
                break

class RealTimeMonitor:
    """Main real-time monitoring system"""
    
    def __init__(self, email_config: Dict = None):
        self.metric_collector = MetricCollector()
        self.security_monitor = SecurityMonitor()
        self.compliance_monitor = ComplianceMonitor()
        self.alert_manager = AlertManager(email_config)
        
        # Start monitoring thread
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitoring_thread.start()
    
    def _monitoring_loop(self):
        """Main monitoring loop"""
        while True:
            try:
                # Check metric thresholds
                metric_alerts = self.metric_collector.check_thresholds()
                for alert in metric_alerts:
                    self.alert_manager.add_alert(alert)
                
                # Sleep for 30 seconds before next check
                time.sleep(30)
                
            except Exception as e:
                print(f"Error in monitoring loop: {str(e)}")
                time.sleep(60)  # Wait longer on error
    
    def record_transaction(self, transaction_data: Dict):
        """Record a transaction for monitoring"""
        # Record metrics
        amount = float(transaction_data.get('amount', 0))
        self.metric_collector.record_metric('transaction_amount', amount)
        
        # Check for compliance issues
        compliance_alerts = self.compliance_monitor.check_large_transactions([transaction_data])
        for alert in compliance_alerts:
            self.alert_manager.add_alert(alert)
    
    def record_failed_login(self, ip_address: str, user_email: str = None):
        """Record a failed login attempt"""
        alert = self.security_monitor.record_failed_login(ip_address, user_email)
        if alert:
            self.alert_manager.add_alert(alert)
    
    def record_system_metric(self, metric_name: str, value: float):
        """Record a system metric"""
        self.metric_collector.record_metric(metric_name, value)
    
    def get_dashboard_data(self) -> Dict:
        """Get data for monitoring dashboard"""
        return {
            'active_alerts': len(self.alert_manager.get_active_alerts()),
            'critical_alerts': len(self.alert_manager.get_active_alerts(AlertSeverity.CRITICAL)),
            'recent_metrics': {
                metric_name: self.metric_collector.get_metric_average(metric_name)
                for metric_name in self.metric_collector.thresholds.keys()
            },
            'system_status': 'healthy' if len(self.alert_manager.get_active_alerts(AlertSeverity.CRITICAL)) == 0 else 'degraded'
        }


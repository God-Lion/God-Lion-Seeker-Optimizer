"""
Backup Monitoring Service

Monitors backup health, RPO/RTO compliance, and sends alerts
"""
import os
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List
from pathlib import Path
import json

from src.services.backup_service import BackupService
from src.services.audit_service import AuditService

logger = logging.getLogger(__name__)


class BackupMonitor:
    """
    Monitor backup system health and compliance
    
    Monitors:
    - RPO compliance (24 hours)
    - Backup success/failure
    - Disk space availability
    - Cloud storage health
    - Verification status
    """
    
    def __init__(self):
        self.backup_service = BackupService()
        self.alert_email = os.getenv("BACKUP_ALERT_EMAIL", "admin@company.com")
        self.critical_threshold_hours = 24  # RPO threshold
        self.warning_threshold_hours = 20   # Warning before RPO violation
        self.disk_space_warning_percent = 80
        self.disk_space_critical_percent = 90
    
    async def check_all(self) -> Dict[str, Any]:
        """
        Perform comprehensive health check
        
        Returns health status and alerts
        """
        health_status = {
            "timestamp": datetime.utcnow().isoformat(),
            "overall_status": "healthy",
            "checks": {},
            "alerts": [],
            "warnings": []
        }
        
        try:
            # Check RPO compliance
            rpo_check = await self._check_rpo_compliance()
            health_status["checks"]["rpo_compliance"] = rpo_check
            
            if not rpo_check["compliant"]:
                health_status["overall_status"] = "critical"
                health_status["alerts"].append({
                    "severity": "critical",
                    "message": rpo_check["message"],
                    "recommendation": rpo_check["recommendation"]
                })
            elif rpo_check.get("warning"):
                health_status["warnings"].append({
                    "severity": "warning",
                    "message": rpo_check["message"]
                })
            
            # Check backup verification status
            verification_check = await self._check_verification_status()
            health_status["checks"]["verification"] = verification_check
            
            if not verification_check["all_verified"]:
                health_status["warnings"].append({
                    "severity": "warning",
                    "message": verification_check["message"]
                })
            
            # Check disk space
            disk_check = await self._check_disk_space()
            health_status["checks"]["disk_space"] = disk_check
            
            if disk_check["status"] == "critical":
                health_status["overall_status"] = "critical"
                health_status["alerts"].append({
                    "severity": "critical",
                    "message": disk_check["message"]
                })
            elif disk_check["status"] == "warning":
                health_status["warnings"].append({
                    "severity": "warning",
                    "message": disk_check["message"]
                })
            
            # Check backup success rate
            success_check = await self._check_backup_success_rate()
            health_status["checks"]["success_rate"] = success_check
            
            if success_check["rate"] < 90:
                health_status["warnings"].append({
                    "severity": "warning",
                    "message": f"Backup success rate is {success_check['rate']}% (last 7 days)"
                })
            
            # Check restore testing
            restore_test_check = await self._check_restore_testing()
            health_status["checks"]["restore_testing"] = restore_test_check
            
            if not restore_test_check["compliant"]:
                health_status["warnings"].append({
                    "severity": "warning",
                    "message": restore_test_check["message"]
                })
            
            # Send alerts if critical
            if health_status["overall_status"] == "critical":
                await self._send_critical_alert(health_status)
            
            return health_status
        
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            health_status["overall_status"] = "error"
            health_status["alerts"].append({
                "severity": "error",
                "message": f"Health check failed: {str(e)}"
            })
            return health_status
    
    async def _check_rpo_compliance(self) -> Dict[str, Any]:
        """Check if backups meet RPO (24 hours)"""
        try:
            rpo_status = await self.backup_service.check_rpo_compliance()
            
            hours_since = rpo_status.get("hours_since_last_backup", 999)
            
            result = {
                "compliant": rpo_status["compliant"],
                "hours_since_last_backup": hours_since,
                "last_backup": rpo_status.get("last_backup"),
                "last_backup_timestamp": rpo_status.get("last_backup_timestamp")
            }
            
            if not rpo_status["compliant"]:
                result["message"] = f"RPO VIOLATION: Last backup was {hours_since:.1f} hours ago"
                result["recommendation"] = "Create full backup immediately"
            elif hours_since >= self.warning_threshold_hours:
                result["warning"] = True
                result["message"] = f"RPO WARNING: Last backup was {hours_since:.1f} hours ago"
                result["recommendation"] = "Backup should be created soon"
            else:
                result["message"] = "RPO compliant"
            
            return result
        
        except Exception as e:
            logger.error(f"RPO check failed: {e}")
            return {
                "compliant": False,
                "error": str(e),
                "message": "Failed to check RPO compliance"
            }
    
    async def _check_verification_status(self) -> Dict[str, Any]:
        """Check if recent backups have been verified"""
        try:
            backups = await self.backup_service.list_backups()
            
            # Check last 7 days
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            recent_backups = [b for b in backups if b.timestamp >= cutoff_date]
            
            if not recent_backups:
                return {
                    "all_verified": True,
                    "message": "No recent backups to verify"
                }
            
            verified_count = len([b for b in recent_backups if b.verification_timestamp])
            total_count = len(recent_backups)
            
            all_verified = verified_count == total_count
            
            return {
                "all_verified": all_verified,
                "verified_count": verified_count,
                "total_count": total_count,
                "percentage": round(verified_count / total_count * 100, 1) if total_count > 0 else 0,
                "message": f"{verified_count}/{total_count} recent backups verified" if not all_verified else "All recent backups verified"
            }
        
        except Exception as e:
            logger.error(f"Verification check failed: {e}")
            return {
                "all_verified": False,
                "error": str(e),
                "message": "Failed to check verification status"
            }
    
    async def _check_disk_space(self) -> Dict[str, Any]:
        """Check available disk space for backups"""
        try:
            import shutil
            
            disk_usage = shutil.disk_usage(str(self.backup_service.local_backup_path))
            
            total_gb = disk_usage.total / 1024 / 1024 / 1024
            used_gb = disk_usage.used / 1024 / 1024 / 1024
            free_gb = disk_usage.free / 1024 / 1024 / 1024
            percent_used = (disk_usage.used / disk_usage.total) * 100
            
            status = "healthy"
            message = f"Disk space healthy: {free_gb:.1f}GB free ({100 - percent_used:.1f}% available)"
            
            if percent_used >= self.disk_space_critical_percent:
                status = "critical"
                message = f"CRITICAL: Disk space low: {free_gb:.1f}GB free ({100 - percent_used:.1f}% available)"
            elif percent_used >= self.disk_space_warning_percent:
                status = "warning"
                message = f"WARNING: Disk space running low: {free_gb:.1f}GB free ({100 - percent_used:.1f}% available)"
            
            return {
                "status": status,
                "total_gb": round(total_gb, 2),
                "used_gb": round(used_gb, 2),
                "free_gb": round(free_gb, 2),
                "percent_used": round(percent_used, 2),
                "message": message
            }
        
        except Exception as e:
            logger.error(f"Disk space check failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "message": "Failed to check disk space"
            }
    
    async def _check_backup_success_rate(self) -> Dict[str, Any]:
        """Check backup success rate (last 7 days)"""
        try:
            backups = await self.backup_service.list_backups()
            
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            recent_backups = [b for b in backups if b.timestamp >= cutoff_date]
            
            if not recent_backups:
                return {
                    "rate": 100,
                    "total": 0,
                    "successful": 0,
                    "failed": 0,
                    "message": "No recent backups"
                }
            
            successful = len([b for b in recent_backups if b.status == "completed" or b.status == "verified"])
            failed = len([b for b in recent_backups if b.status == "failed"])
            total = len(recent_backups)
            
            rate = (successful / total * 100) if total > 0 else 0
            
            return {
                "rate": round(rate, 1),
                "total": total,
                "successful": successful,
                "failed": failed,
                "message": f"Success rate: {rate:.1f}% ({successful}/{total})"
            }
        
        except Exception as e:
            logger.error(f"Success rate check failed: {e}")
            return {
                "rate": 0,
                "error": str(e),
                "message": "Failed to check success rate"
            }
    
    async def _check_restore_testing(self) -> Dict[str, Any]:
        """Check if restore testing has been performed recently (monthly)"""
        try:
            backups = await self.backup_service.list_backups()
            
            # Check if any backup was tested in last 30 days
            cutoff_date = datetime.utcnow() - timedelta(days=30)
            tested_backups = [
                b for b in backups
                if b.restore_tested and b.timestamp >= cutoff_date
            ]
            
            compliant = len(tested_backups) > 0
            
            return {
                "compliant": compliant,
                "tested_backups_count": len(tested_backups),
                "last_tested": max((b.timestamp for b in tested_backups), default=None) if tested_backups else None,
                "message": "Monthly restore testing compliant" if compliant else "No restore testing in last 30 days"
            }
        
        except Exception as e:
            logger.error(f"Restore testing check failed: {e}")
            return {
                "compliant": False,
                "error": str(e),
                "message": "Failed to check restore testing"
            }
    
    async def _send_critical_alert(self, health_status: Dict[str, Any]):
        """Send critical alert via email and logging"""
        try:
            # Create alert message
            alert_subject = "[CRITICAL] Backup System Alert"
            alert_body = f"""
CRITICAL BACKUP SYSTEM ALERT

Timestamp: {health_status['timestamp']}
Status: {health_status['overall_status']}

CRITICAL ALERTS:
"""
            for alert in health_status["alerts"]:
                alert_body += f"\n- {alert['message']}"
                if "recommendation" in alert:
                    alert_body += f"\n  Recommendation: {alert['recommendation']}"
            
            if health_status["warnings"]:
                alert_body += "\n\nWARNINGS:\n"
                for warning in health_status["warnings"]:
                    alert_body += f"\n- {warning['message']}"
            
            alert_body += "\n\nPlease take immediate action to resolve these issues."
            
            # Send email (if mail is configured)
            try:
                import subprocess
                subprocess.run(
                    ['mail', '-s', alert_subject, self.alert_email],
                    input=alert_body.encode(),
                    check=False
                )
            except Exception as e:
                logger.warning(f"Failed to send email alert: {e}")
            
            # Log critical alert
            logger.critical(f"BACKUP SYSTEM ALERT: {alert_body}")
            
            # Log to syslog
            try:
                import subprocess
                subprocess.run(
                    ['logger', '-t', 'backup-monitor', '-p', 'user.crit', alert_subject],
                    check=False
                )
            except Exception as e:
                logger.warning(f"Failed to log to syslog: {e}")
        
        except Exception as e:
            logger.error(f"Failed to send critical alert: {e}")
    
    async def run_continuous_monitoring(self, interval_minutes: int = 60):
        """
        Run continuous monitoring loop
        
        Args:
            interval_minutes: How often to run health checks (default: 60 minutes)
        """
        logger.info(f"Starting continuous backup monitoring (interval: {interval_minutes} minutes)")
        
        while True:
            try:
                logger.info("Running backup health check...")
                health_status = await self.check_all()
                
                logger.info(f"Health check completed. Status: {health_status['overall_status']}")
                
                # Save health status to file
                status_file = Path("/var/log/backups/health_status.json")
                status_file.parent.mkdir(parents=True, exist_ok=True)
                
                with open(status_file, 'w') as f:
                    json.dump(health_status, f, indent=2)
                
                # Wait for next interval
                await asyncio.sleep(interval_minutes * 60)
            
            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes before retrying


async def main():
    """Main entry point for backup monitoring"""
    monitor = BackupMonitor()
    await monitor.run_continuous_monitoring(interval_minutes=60)


if __name__ == "__main__":
    asyncio.run(main())

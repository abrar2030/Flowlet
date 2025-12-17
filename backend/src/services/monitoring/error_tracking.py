"""
Error Tracking Service
Tracks and logs errors for monitoring and debugging
"""

import logging
import traceback
from datetime import datetime
from typing import Dict, Any, Optional, List
from collections import defaultdict
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)


@dataclass
class ErrorEvent:
    """Error event data class"""

    error_id: str
    error_type: str
    message: str
    stack_trace: str
    timestamp: str
    context: Dict[str, Any]
    severity: str = "error"
    user_id: Optional[str] = None
    request_id: Optional[str] = None


class ErrorTrackingService:
    """
    Service for tracking and analyzing errors
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize error tracking service"""
        self.config = config or {}
        self.enabled = self.config.get("ERROR_TRACKING_ENABLED", True)
        self.max_errors_in_memory = self.config.get("MAX_ERRORS_IN_MEMORY", 1000)
        self.errors: List[ErrorEvent] = []
        self.error_counts = defaultdict(int)
        self.error_id_counter = 0

        logger.info("Error Tracking Service initialized")

    def track_error(
        self,
        exception: Exception,
        context: Optional[Dict[str, Any]] = None,
        severity: str = "error",
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> str:
        """
        Track an error

        Args:
            exception: The exception that occurred
            context: Additional context information
            severity: Error severity (error, warning, critical)
            user_id: User ID if applicable
            request_id: Request ID if applicable

        Returns:
            Error ID
        """
        if not self.enabled:
            return ""

        try:
            self.error_id_counter += 1
            error_id = f"ERR-{datetime.utcnow().strftime('%Y%m%d')}-{self.error_id_counter:06d}"

            error_type = type(exception).__name__
            message = str(exception)
            stack_trace = "".join(
                traceback.format_exception(
                    type(exception), exception, exception.__traceback__
                )
            )

            error_event = ErrorEvent(
                error_id=error_id,
                error_type=error_type,
                message=message,
                stack_trace=stack_trace,
                timestamp=datetime.utcnow().isoformat(),
                context=context or {},
                severity=severity,
                user_id=user_id,
                request_id=request_id,
            )

            # Store in memory
            self.errors.append(error_event)
            if len(self.errors) > self.max_errors_in_memory:
                self.errors.pop(0)

            # Update counts
            self.error_counts[error_type] += 1

            # Log the error
            log_message = f"Error tracked: {error_id} - {error_type}: {message}"
            if severity == "critical":
                logger.critical(log_message)
            elif severity == "warning":
                logger.warning(log_message)
            else:
                logger.error(log_message)

            return error_id

        except Exception as e:
            logger.error(f"Failed to track error: {str(e)}")
            return ""

    def track_exception_dict(
        self,
        error_type: str,
        message: str,
        stack_trace: str = "",
        context: Optional[Dict[str, Any]] = None,
        severity: str = "error",
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> str:
        """
        Track an error from dictionary data

        Args:
            error_type: Type of error
            message: Error message
            stack_trace: Stack trace string
            context: Additional context
            severity: Error severity
            user_id: User ID if applicable
            request_id: Request ID if applicable

        Returns:
            Error ID
        """
        if not self.enabled:
            return ""

        try:
            self.error_id_counter += 1
            error_id = f"ERR-{datetime.utcnow().strftime('%Y%m%d')}-{self.error_id_counter:06d}"

            error_event = ErrorEvent(
                error_id=error_id,
                error_type=error_type,
                message=message,
                stack_trace=stack_trace,
                timestamp=datetime.utcnow().isoformat(),
                context=context or {},
                severity=severity,
                user_id=user_id,
                request_id=request_id,
            )

            self.errors.append(error_event)
            if len(self.errors) > self.max_errors_in_memory:
                self.errors.pop(0)

            self.error_counts[error_type] += 1

            logger.error(f"Error tracked: {error_id} - {error_type}: {message}")
            return error_id

        except Exception as e:
            logger.error(f"Failed to track error: {str(e)}")
            return ""

    def get_error(self, error_id: str) -> Optional[Dict[str, Any]]:
        """Get error by ID"""
        for error in self.errors:
            if error.error_id == error_id:
                return asdict(error)
        return None

    def get_recent_errors(
        self, limit: int = 100, severity: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get recent errors

        Args:
            limit: Maximum number of errors to return
            severity: Filter by severity (optional)

        Returns:
            List of error dictionaries
        """
        errors = self.errors
        if severity:
            errors = [e for e in errors if e.severity == severity]

        # Return most recent first
        return [asdict(e) for e in reversed(errors[-limit:])]

    def get_error_counts(self) -> Dict[str, int]:
        """Get error counts by type"""
        return dict(self.error_counts)

    def clear_errors(self) -> None:
        """Clear all tracked errors"""
        self.errors.clear()
        self.error_counts.clear()
        logger.info("Error tracking cleared")


# Global instance
_service: Optional[ErrorTrackingService] = None


def get_error_tracking_service() -> ErrorTrackingService:
    """Get the global error tracking service instance"""
    global _service
    if _service is None:
        _service = ErrorTrackingService()
    return _service


def track_error(
    exception: Exception, context: Optional[Dict[str, Any]] = None, **kwargs
) -> str:
    """Convenience function to track an error"""
    return get_error_tracking_service().track_error(exception, context, **kwargs)

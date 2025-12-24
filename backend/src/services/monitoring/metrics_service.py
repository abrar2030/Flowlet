"""
Metrics Service
Collects and reports application metrics
"""

import logging
import time
from datetime import datetime
from typing import Dict, Any, Optional, List
from collections import defaultdict
from dataclasses import dataclass, asdict
from threading import Lock

logger = logging.getLogger(__name__)


@dataclass
class Metric:
    """Metric data class"""

    name: str
    value: float
    timestamp: str
    tags: Dict[str, str]
    unit: str = ""


class MetricsService:
    """
    Service for collecting and reporting metrics
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        """Initialize metrics service"""
        self.config = config or {}
        self.enabled = self.config.get("METRICS_ENABLED", True)
        self.metrics: List[Metric] = []
        self.counters = defaultdict(float)
        self.gauges = defaultdict(float)
        self.histograms = defaultdict(list)
        self.lock = Lock()

        logger.info("Metrics Service initialized")

    def increment(
        self,
        metric_name: str,
        value: float = 1.0,
        tags: Optional[Dict[str, str]] = None,
    ) -> None:
        """
        Increment a counter metric

        Args:
            metric_name: Name of the metric
            value: Value to increment by
            tags: Optional tags for the metric
        """
        if not self.enabled:
            return

        with self.lock:
            self.counters[metric_name] += value

            metric = Metric(
                name=metric_name,
                value=value,
                timestamp=datetime.utcnow().isoformat(),
                tags=tags or {},
                unit="count",
            )
            self.metrics.append(metric)

    def gauge(
        self, metric_name: str, value: float, tags: Optional[Dict[str, str]] = None
    ) -> None:
        """
        Set a gauge metric

        Args:
            metric_name: Name of the metric
            value: Current value
            tags: Optional tags for the metric
        """
        if not self.enabled:
            return

        with self.lock:
            self.gauges[metric_name] = value

            metric = Metric(
                name=metric_name,
                value=value,
                timestamp=datetime.utcnow().isoformat(),
                tags=tags or {},
            )
            self.metrics.append(metric)

    def histogram(
        self, metric_name: str, value: float, tags: Optional[Dict[str, str]] = None
    ) -> None:
        """
        Record a value in a histogram

        Args:
            metric_name: Name of the metric
            value: Value to record
            tags: Optional tags for the metric
        """
        if not self.enabled:
            return

        with self.lock:
            self.histograms[metric_name].append(value)

            metric = Metric(
                name=metric_name,
                value=value,
                timestamp=datetime.utcnow().isoformat(),
                tags=tags or {},
            )
            self.metrics.append(metric)

    def timing(
        self,
        metric_name: str,
        duration_ms: float,
        tags: Optional[Dict[str, str]] = None,
    ) -> None:
        """
        Record a timing metric

        Args:
            metric_name: Name of the metric
            duration_ms: Duration in milliseconds
            tags: Optional tags for the metric
        """
        if not self.enabled:
            return

        with self.lock:
            metric = Metric(
                name=metric_name,
                value=duration_ms,
                timestamp=datetime.utcnow().isoformat(),
                tags=tags or {},
                unit="ms",
            )
            self.metrics.append(metric)
            self.histograms[metric_name].append(duration_ms)

    def get_counter(self, metric_name: str) -> float:
        """Get current counter value"""
        return self.counters.get(metric_name, 0.0)

    def get_gauge(self, metric_name: str) -> float:
        """Get current gauge value"""
        return self.gauges.get(metric_name, 0.0)

    def get_histogram_stats(self, metric_name: str) -> Dict[str, float]:
        """
        Get statistics for a histogram

        Args:
            metric_name: Name of the metric

        Returns:
            Dict with min, max, mean, p50, p95, p99
        """
        values = self.histograms.get(metric_name, [])
        if not values:
            return {}

        sorted_values = sorted(values)
        n = len(sorted_values)

        return {
            "count": n,
            "min": min(values),
            "max": max(values),
            "mean": sum(values) / n,
            "p50": sorted_values[int(n * 0.5)],
            "p95": sorted_values[int(n * 0.95)],
            "p99": sorted_values[int(n * 0.99)],
        }

    def get_all_metrics(self) -> List[Dict[str, Any]]:
        """Get all recorded metrics"""
        return [asdict(m) for m in self.metrics]

    def get_summary(self) -> Dict[str, Any]:
        """Get a summary of all metrics"""
        return {
            "counters": dict(self.counters),
            "gauges": dict(self.gauges),
            "histograms": {
                name: self.get_histogram_stats(name) for name in self.histograms.keys()
            },
        }

    def reset(self) -> None:
        """Reset all metrics"""
        with self.lock:
            self.metrics.clear()
            self.counters.clear()
            self.gauges.clear()
            self.histograms.clear()
        logger.info("Metrics reset")

    def timer(self, metric_name: str, tags: Optional[Dict[str, str]] = None):
        """
        Context manager for timing operations

        Usage:
            with metrics.timer('operation_name'):
                # do something
        """
        return TimerContext(self, metric_name, tags)


class TimerContext:
    """Context manager for timing operations"""

    def __init__(
        self,
        metrics_service: MetricsService,
        metric_name: str,
        tags: Optional[Dict[str, str]] = None,
    ):
        self.metrics_service = metrics_service
        self.metric_name = metric_name
        self.tags = tags
        self.start_time = None

    def __enter__(self) -> Any:
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if self.start_time:
            duration_ms = (time.time() - self.start_time) * 1000
            self.metrics_service.timing(self.metric_name, duration_ms, self.tags)


# Global instance
_service: Optional[MetricsService] = None


def get_metrics_service() -> MetricsService:
    """Get the global metrics service instance"""
    global _service
    if _service is None:
        _service = MetricsService()
    return _service


# Convenience functions
def increment(
    metric_name: str, value: float = 1.0, tags: Optional[Dict[str, str]] = None
):
    """Increment a counter"""
    get_metrics_service().increment(metric_name, value, tags)


def gauge(metric_name: str, value: float, tags: Optional[Dict[str, str]] = None):
    """Set a gauge"""
    get_metrics_service().gauge(metric_name, value, tags)


def timing(metric_name: str, duration_ms: float, tags: Optional[Dict[str, str]] = None):
    """Record a timing"""
    get_metrics_service().timing(metric_name, duration_ms, tags)


def timer(metric_name: str, tags: Optional[Dict[str, str]] = None):
    """Get a timer context manager"""
    return get_metrics_service().timer(metric_name, tags)

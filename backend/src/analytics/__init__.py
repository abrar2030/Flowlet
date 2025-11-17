"""
Advanced Analytics Module for Flowlet
=====================================

This module provides comprehensive business intelligence and reporting capabilities
for the Flowlet embedded finance platform, designed to meet financial industry standards.

Features:
- Real-time transaction analytics
- Customer behavior analysis
- Risk assessment metrics
- Regulatory reporting
- Performance dashboards
- Predictive analytics
- Data visualization
"""

from .dashboard_service import DashboardService
from .data_models import *
from .data_warehouse import DataWarehouse
from .metrics_calculator import MetricsCalculator
from .real_time_analytics import RealTimeAnalytics
from .reporting_engine import ReportingEngine

__version__ = "1.0.0"
__author__ = "Flowlet Analytics Team"

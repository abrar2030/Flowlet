"""
Global Compliance Module
=======================

Multi-jurisdiction compliance framework for financial services.
Supports EU, APAC, and other regulatory requirements with automated monitoring and reporting.
"""

from .compliance_engine import ComplianceEngine
from .regulatory_framework import RegulatoryFramework
from .aml_engine import AMLEngine
from .kyc_service import KYCService
from .data_protection import DataProtectionService
from .reporting_service import ComplianceReportingService
from .audit_service import ComplianceAuditService

__all__ = [
    'ComplianceEngine',
    'RegulatoryFramework', 
    'AMLEngine',
    'KYCService',
    'DataProtectionService',
    'ComplianceReportingService',
    'ComplianceAuditService'
]

__version__ = '1.0.0'


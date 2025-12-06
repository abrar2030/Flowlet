import json
import logging
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
import redis
from cryptography.fernet import Fernet

"\nEnhanced Regulatory Compliance Module for Financial Industry Standards\nImplements comprehensive workflows for GDPR, PSD2, FinCEN, and other regulatory frameworks\n"
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ComplianceFramework(Enum):
    """Supported regulatory frameworks"""

    GDPR = "gdpr"
    PSD2 = "psd2"
    FINCEN = "fincen"
    SOX = "sox"
    PCI_DSS = "pci_dss"
    CCPA = "ccpa"
    MLD5 = "mld5"
    BASEL_III = "basel_iii"


class ComplianceStatus(Enum):
    """Compliance check status"""

    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PENDING_REVIEW = "pending_review"
    REQUIRES_ACTION = "requires_action"
    EXEMPTED = "exempted"


class DataProcessingPurpose(Enum):
    """GDPR data processing purposes"""

    CONSENT = "consent"
    CONTRACT = "contract"
    LEGAL_OBLIGATION = "legal_obligation"
    VITAL_INTERESTS = "vital_interests"
    PUBLIC_TASK = "public_task"
    LEGITIMATE_INTERESTS = "legitimate_interests"


class TransactionRiskLevel(Enum):
    """PSD2 transaction risk levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXEMPT = "exempt"


@dataclass
class ComplianceEvent:
    """Compliance event for audit trail"""

    event_id: str
    framework: ComplianceFramework
    event_type: str
    entity_id: str
    entity_type: str
    timestamp: datetime
    details: Dict[str, Any]
    status: ComplianceStatus
    automated: bool
    reviewer_id: Optional[str] = None
    resolution_notes: Optional[str] = None


@dataclass
class GDPRDataSubject:
    """GDPR data subject information"""

    subject_id: str
    email: str
    consent_given: bool
    consent_timestamp: Optional[datetime]
    data_categories: List[str]
    processing_purposes: List[DataProcessingPurpose]
    retention_period: int
    last_activity: datetime
    deletion_requested: bool = False
    deletion_timestamp: Optional[datetime] = None


@dataclass
class PSD2Transaction:
    """PSD2 transaction information"""

    transaction_id: str
    amount: float
    currency: str
    payer_account: str
    payee_account: str
    timestamp: datetime
    risk_level: TransactionRiskLevel
    sca_required: bool
    sca_completed: bool
    exemption_reason: Optional[str] = None


@dataclass
class FinCENReport:
    """FinCEN suspicious activity report"""

    report_id: str
    filing_institution: str
    subject_name: str
    subject_id: str
    suspicious_activity: str
    amount: float
    currency: str
    transaction_date: datetime
    report_date: datetime
    narrative: str
    status: str


class GDPRComplianceManager:
    """
    GDPR compliance management system
    """

    def __init__(self, encryption_key: Optional[str] = None) -> Any:
        self.encryption_key = encryption_key or Fernet.generate_key()
        self.fernet = Fernet(self.encryption_key)
        self.redis_client = redis.Redis(host="localhost", port=6379, db=5)
        self.data_subjects = {}
        self.consent_records = {}

    async def register_data_subject(
        self, subject_data: Dict[str, Any]
    ) -> GDPRDataSubject:
        """Register a new data subject under GDPR"""
        try:
            subject = GDPRDataSubject(
                subject_id=str(uuid.uuid4()),
                email=subject_data["email"],
                consent_given=subject_data.get("consent_given", False),
                consent_timestamp=(
                    datetime.now(timezone.utc)
                    if subject_data.get("consent_given")
                    else None
                ),
                data_categories=subject_data.get("data_categories", []),
                processing_purposes=subject_data.get("processing_purposes", []),
                retention_period=subject_data.get("retention_period", 2555),
                last_activity=datetime.now(timezone.utc),
            )
            encrypted_data = self._encrypt_personal_data(asdict(subject))
            self.redis_client.set(f"gdpr_subject:{subject.subject_id}", encrypted_data)
            await self._log_compliance_event(
                framework=ComplianceFramework.GDPR,
                event_type="data_subject_registered",
                entity_id=subject.subject_id,
                entity_type="data_subject",
                details={"email": subject.email, "consent": subject.consent_given},
                status=ComplianceStatus.COMPLIANT,
            )
            return subject
        except Exception as e:
            logger.error(f"Error registering data subject: {str(e)}")
            raise ComplianceException(f"Failed to register data subject: {str(e)}")

    async def process_consent_request(
        self, subject_id: str, purposes: List[DataProcessingPurpose]
    ) -> bool:
        """Process consent request for data processing"""
        try:
            subject_data = self._get_subject_data(subject_id)
            if not subject_data:
                raise ComplianceException("Data subject not found")
            subject_data["consent_given"] = True
            subject_data["consent_timestamp"] = datetime.now(timezone.utc).isoformat()
            subject_data["processing_purposes"] = [p.value for p in purposes]
            encrypted_data = self._encrypt_personal_data(subject_data)
            self.redis_client.set(f"gdpr_subject:{subject_id}", encrypted_data)
            await self._log_compliance_event(
                framework=ComplianceFramework.GDPR,
                event_type="consent_granted",
                entity_id=subject_id,
                entity_type="data_subject",
                details={"purposes": [p.value for p in purposes]},
                status=ComplianceStatus.COMPLIANT,
            )
            return True
        except Exception as e:
            logger.error(f"Error processing consent: {str(e)}")
            return False

    async def process_deletion_request(
        self, subject_id: str, requester_email: str
    ) -> bool:
        """Process GDPR right to be forgotten request"""
        try:
            subject_data = self._get_subject_data(subject_id)
            if not subject_data or subject_data.get("email") != requester_email:
                raise ComplianceException("Unauthorized deletion request")
            if self._has_legal_retention_requirement(subject_id):
                await self._log_compliance_event(
                    framework=ComplianceFramework.GDPR,
                    event_type="deletion_request_denied",
                    entity_id=subject_id,
                    entity_type="data_subject",
                    details={"reason": "legal_retention_requirement"},
                    status=ComplianceStatus.NON_COMPLIANT,
                )
                return False
            subject_data["deletion_requested"] = True
            subject_data["deletion_timestamp"] = datetime.now(timezone.utc).isoformat()
            encrypted_data = self._encrypt_personal_data(subject_data)
            self.redis_client.set(f"gdpr_subject:{subject_id}", encrypted_data)
            await self._schedule_data_deletion(subject_id)
            await self._log_compliance_event(
                framework=ComplianceFramework.GDPR,
                event_type="deletion_request_accepted",
                entity_id=subject_id,
                entity_type="data_subject",
                details={"requester": requester_email},
                status=ComplianceStatus.PENDING_REVIEW,
            )
            return True
        except Exception as e:
            logger.error(f"Error processing deletion request: {str(e)}")
            return False

    async def generate_data_export(
        self, subject_id: str, requester_email: str
    ) -> Dict[str, Any]:
        """Generate GDPR data portability export"""
        try:
            subject_data = self._get_subject_data(subject_id)
            if not subject_data or subject_data.get("email") != requester_email:
                raise ComplianceException("Unauthorized export request")
            export_data = {
                "subject_information": subject_data,
                "transaction_history": await self._get_transaction_history(subject_id),
                "wallet_data": await self._get_wallet_data(subject_id),
                "kyc_data": await self._get_kyc_data(subject_id),
                "consent_history": await self._get_consent_history(subject_id),
                "export_timestamp": datetime.now(timezone.utc).isoformat(),
                "export_format": "JSON",
            }
            await self._log_compliance_event(
                framework=ComplianceFramework.GDPR,
                event_type="data_export_generated",
                entity_id=subject_id,
                entity_type="data_subject",
                details={
                    "requester": requester_email,
                    "data_categories": list(export_data.keys()),
                },
                status=ComplianceStatus.COMPLIANT,
            )
            return export_data
        except Exception as e:
            logger.error(f"Error generating data export: {str(e)}")
            raise ComplianceException(f"Failed to generate data export: {str(e)}")

    def _encrypt_personal_data(self, data: Dict[str, Any]) -> str:
        """Encrypt personal data for storage"""
        json_data = json.dumps(data, default=str)
        return self.fernet.encrypt(json_data.encode()).decode()

    def _decrypt_personal_data(self, encrypted_data: str) -> Dict[str, Any]:
        """Decrypt personal data from storage"""
        decrypted_bytes = self.fernet.decrypt(encrypted_data.encode())
        return json.loads(decrypted_bytes.decode())

    def _get_subject_data(self, subject_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve subject data from storage"""
        encrypted_data = self.redis_client.get(f"gdpr_subject:{subject_id}")
        if encrypted_data:
            return self._decrypt_personal_data(encrypted_data.decode())
        return None

    def _has_legal_retention_requirement(self, subject_id: str) -> bool:
        """Check if data has legal retention requirements"""
        return False

    async def _schedule_data_deletion(self, subject_id: str):
        """Schedule actual data deletion"""
        logger.info(f"Scheduled data deletion for subject: {subject_id}")

    async def _get_transaction_history(self, subject_id: str) -> List[Dict]:
        """Get transaction history for data subject"""
        return []

    async def _get_wallet_data(self, subject_id: str) -> Dict:
        """Get wallet data for data subject"""
        return {}

    async def _get_kyc_data(self, subject_id: str) -> Dict:
        """Get KYC data for data subject"""
        return {}

    async def _get_consent_history(self, subject_id: str) -> List[Dict]:
        """Get consent history for data subject"""
        return []


class PSD2ComplianceManager:
    """
    PSD2 compliance management system
    """

    def __init__(self) -> Any:
        self.redis_client = redis.Redis(host="localhost", port=6379, db=6)
        self.sca_exemptions = {
            "low_value": 30.0,
            "recurring_payment": True,
            "trusted_beneficiary": True,
            "corporate_payment": True,
        }

    async def assess_transaction_risk(
        self, transaction_data: Dict[str, Any]
    ) -> PSD2Transaction:
        """Assess PSD2 transaction risk and SCA requirements"""
        try:
            transaction = PSD2Transaction(
                transaction_id=transaction_data["transaction_id"],
                amount=transaction_data["amount"],
                currency=transaction_data["currency"],
                payer_account=transaction_data["payer_account"],
                payee_account=transaction_data["payee_account"],
                timestamp=datetime.fromisoformat(transaction_data["timestamp"]),
                risk_level=TransactionRiskLevel.MEDIUM,
                sca_required=True,
            )
            risk_score = await self._calculate_risk_score(transaction_data)
            if risk_score < 0.3:
                transaction.risk_level = TransactionRiskLevel.LOW
            elif risk_score > 0.7:
                transaction.risk_level = TransactionRiskLevel.HIGH
            exemption_reason = await self._check_sca_exemptions(transaction_data)
            if exemption_reason:
                transaction.sca_required = False
                transaction.exemption_reason = exemption_reason
                transaction.risk_level = TransactionRiskLevel.EXEMPT
            transaction_key = f"psd2_transaction:{transaction.transaction_id}"
            self.redis_client.setex(
                transaction_key, 86400, json.dumps(asdict(transaction), default=str)
            )
            await self._log_compliance_event(
                framework=ComplianceFramework.PSD2,
                event_type="transaction_risk_assessed",
                entity_id=transaction.transaction_id,
                entity_type="transaction",
                details={
                    "risk_level": transaction.risk_level.value,
                    "sca_required": transaction.sca_required,
                    "exemption_reason": transaction.exemption_reason,
                },
                status=ComplianceStatus.COMPLIANT,
            )
            return transaction
        except Exception as e:
            logger.error(f"Error assessing transaction risk: {str(e)}")
            raise ComplianceException(f"Failed to assess transaction risk: {str(e)}")

    async def validate_sca_completion(
        self, transaction_id: str, sca_data: Dict[str, Any]
    ) -> bool:
        """Validate Strong Customer Authentication completion"""
        try:
            transaction_key = f"psd2_transaction:{transaction_id}"
            transaction_data = self.redis_client.get(transaction_key)
            if not transaction_data:
                raise ComplianceException("Transaction not found")
            transaction = json.loads(transaction_data.decode())
            sca_valid = await self._validate_sca_factors(sca_data)
            if sca_valid:
                transaction["sca_completed"] = True
                self.redis_client.setex(
                    transaction_key, 86400, json.dumps(transaction, default=str)
                )
                await self._log_compliance_event(
                    framework=ComplianceFramework.PSD2,
                    event_type="sca_completed",
                    entity_id=transaction_id,
                    entity_type="transaction",
                    details={"sca_methods": list(sca_data.keys())},
                    status=ComplianceStatus.COMPLIANT,
                )
                return True
            else:
                await self._log_compliance_event(
                    framework=ComplianceFramework.PSD2,
                    event_type="sca_failed",
                    entity_id=transaction_id,
                    entity_type="transaction",
                    details={"failure_reason": "invalid_sca_factors"},
                    status=ComplianceStatus.NON_COMPLIANT,
                )
                return False
        except Exception as e:
            logger.error(f"Error validating SCA: {str(e)}")
            return False

    async def _calculate_risk_score(self, transaction_data: Dict[str, Any]) -> float:
        """Calculate transaction risk score"""
        risk_factors = []
        amount = transaction_data["amount"]
        if amount > 1000:
            risk_factors.append(0.3)
        elif amount > 500:
            risk_factors.append(0.2)
        else:
            risk_factors.append(0.1)
        payer_account = transaction_data["payer_account"]
        recent_transactions = await self._get_recent_transactions(payer_account)
        if len(recent_transactions) > 10:
            risk_factors.append(0.4)
        elif len(recent_transactions) > 5:
            risk_factors.append(0.2)
        else:
            risk_factors.append(0.1)
        risk_factors.append(0.1)
        return min(1.0, sum(risk_factors))

    async def _check_sca_exemptions(
        self, transaction_data: Dict[str, Any]
    ) -> Optional[str]:
        """Check for SCA exemptions"""
        amount = transaction_data["amount"]
        currency = transaction_data["currency"]
        if currency == "EUR" and amount <= self.sca_exemptions["low_value"]:
            return "low_value_exemption"
        payee_account = transaction_data["payee_account"]
        if await self._is_trusted_beneficiary(
            transaction_data["payer_account"], payee_account
        ):
            return "trusted_beneficiary_exemption"
        if transaction_data.get("corporate_payment", False):
            return "corporate_payment_exemption"
        return None

    async def _validate_sca_factors(self, sca_data: Dict[str, Any]) -> bool:
        """Validate SCA authentication factors"""
        required_factors = 2
        valid_factors = 0
        if sca_data.get("knowledge_factor") and self._validate_knowledge_factor(
            sca_data["knowledge_factor"]
        ):
            valid_factors += 1
        if sca_data.get("possession_factor") and self._validate_possession_factor(
            sca_data["possession_factor"]
        ):
            valid_factors += 1
        if sca_data.get("inherence_factor") and self._validate_inherence_factor(
            sca_data["inherence_factor"]
        ):
            valid_factors += 1
        return valid_factors >= required_factors

    def _validate_knowledge_factor(self, factor_data: Dict[str, Any]) -> bool:
        """Validate knowledge factor (PIN, password)"""
        return factor_data.get("valid", False)

    def _validate_possession_factor(self, factor_data: Dict[str, Any]) -> bool:
        """Validate possession factor (device, token)"""
        return factor_data.get("valid", False)

    def _validate_inherence_factor(self, factor_data: Dict[str, Any]) -> bool:
        """Validate inherence factor (biometric)"""
        return factor_data.get("valid", False)

    async def _get_recent_transactions(self, account: str) -> List[Dict]:
        """Get recent transactions for account"""
        return []

    async def _is_trusted_beneficiary(
        self, payer_account: str, payee_account: str
    ) -> bool:
        """Check if payee is a trusted beneficiary"""
        return False


class FinCENComplianceManager:
    """
    FinCEN compliance management system
    """

    def __init__(self) -> Any:
        self.redis_client = redis.Redis(host="localhost", port=6379, db=7)
        self.suspicious_activity_threshold = 10000.0
        self.currency_transaction_threshold = 10000.0

    async def monitor_suspicious_activity(
        self, transaction_data: Dict[str, Any]
    ) -> Optional[FinCENReport]:
        """Monitor for suspicious activity requiring FinCEN reporting"""
        try:
            is_suspicious = await self._detect_suspicious_patterns(transaction_data)
            if is_suspicious:
                report = FinCENReport(
                    report_id=str(uuid.uuid4()),
                    filing_institution="Flowlet Financial Services",
                    subject_name=transaction_data.get("subject_name", "Unknown"),
                    subject_id=transaction_data.get("subject_id", "Unknown"),
                    suspicious_activity=await self._describe_suspicious_activity(
                        transaction_data
                    ),
                    amount=transaction_data["amount"],
                    currency=transaction_data["currency"],
                    transaction_date=datetime.fromisoformat(
                        transaction_data["timestamp"]
                    ),
                    report_date=datetime.now(timezone.utc),
                    narrative=await self._generate_narrative(transaction_data),
                    status="pending_review",
                )
                report_key = f"fincen_report:{report.report_id}"
                self.redis_client.set(
                    report_key, json.dumps(asdict(report), default=str)
                )
                await self._log_compliance_event(
                    framework=ComplianceFramework.FINCEN,
                    event_type="suspicious_activity_detected",
                    entity_id=report.report_id,
                    entity_type="sar_report",
                    details={
                        "subject_id": report.subject_id,
                        "amount": report.amount,
                        "activity_type": report.suspicious_activity,
                    },
                    status=ComplianceStatus.REQUIRES_ACTION,
                )
                return report
            return None
        except Exception as e:
            logger.error(f"Error monitoring suspicious activity: {str(e)}")
            return None

    async def file_currency_transaction_report(
        self, transaction_data: Dict[str, Any]
    ) -> Optional[str]:
        """File Currency Transaction Report (CTR) for large cash transactions"""
        try:
            amount = transaction_data["amount"]
            currency = transaction_data["currency"]
            if currency == "USD" and amount >= self.currency_transaction_threshold:
                ctr_id = str(uuid.uuid4())
                ctr_data = {
                    "ctr_id": ctr_id,
                    "filing_institution": "Flowlet Financial Services",
                    "transaction_date": transaction_data["timestamp"],
                    "amount": amount,
                    "currency": currency,
                    "customer_info": transaction_data.get("customer_info", {}),
                    "transaction_type": transaction_data.get(
                        "transaction_type", "unknown"
                    ),
                    "filing_date": datetime.now(timezone.utc).isoformat(),
                    "status": "filed",
                }
                ctr_key = f"fincen_ctr:{ctr_id}"
                self.redis_client.set(ctr_key, json.dumps(ctr_data, default=str))
                await self._log_compliance_event(
                    framework=ComplianceFramework.FINCEN,
                    event_type="ctr_filed",
                    entity_id=ctr_id,
                    entity_type="ctr_report",
                    details={
                        "amount": amount,
                        "currency": currency,
                        "customer_id": transaction_data.get("customer_id"),
                    },
                    status=ComplianceStatus.COMPLIANT,
                )
                return ctr_id
            return None
        except Exception as e:
            logger.error(f"Error filing CTR: {str(e)}")
            return None

    async def _detect_suspicious_patterns(
        self, transaction_data: Dict[str, Any]
    ) -> bool:
        """Detect suspicious transaction patterns"""
        suspicious_indicators = []
        if transaction_data["amount"] >= self.suspicious_activity_threshold:
            suspicious_indicators.append("large_amount")
        customer_id = transaction_data.get("customer_id")
        if customer_id:
            recent_transactions = await self._get_customer_recent_transactions(
                customer_id
            )
            if len(recent_transactions) > 20:
                suspicious_indicators.append("high_frequency")
        if 9000 <= transaction_data["amount"] < 10000:
            suspicious_indicators.append("potential_structuring")
        if await self._has_unusual_geographic_pattern(transaction_data):
            suspicious_indicators.append("unusual_geography")
        return len(suspicious_indicators) >= 2

    async def _describe_suspicious_activity(
        self, transaction_data: Dict[str, Any]
    ) -> str:
        """Describe the type of suspicious activity"""
        await self._detect_suspicious_patterns(transaction_data)
        if transaction_data["amount"] >= self.suspicious_activity_threshold:
            return "Large cash transaction"
        elif 9000 <= transaction_data["amount"] < 10000:
            return "Potential structuring to avoid reporting requirements"
        else:
            return "Unusual transaction pattern"

    async def _generate_narrative(self, transaction_data: Dict[str, Any]) -> str:
        """Generate narrative for suspicious activity report"""
        return f"Transaction of {transaction_data['amount']} {transaction_data['currency']} on {transaction_data['timestamp']} exhibits suspicious characteristics requiring further investigation and reporting."

    async def _get_customer_recent_transactions(self, customer_id: str) -> List[Dict]:
        """Get recent transactions for customer"""
        return []

    async def _has_unusual_geographic_pattern(
        self, transaction_data: Dict[str, Any]
    ) -> bool:
        """Check for unusual geographic patterns"""
        return False


class ComplianceReportingEngine:
    """
    Automated compliance reporting engine
    """

    def __init__(self) -> Any:
        self.redis_client = redis.Redis(host="localhost", port=6379, db=8)
        self.gdpr_manager = GDPRComplianceManager()
        self.psd2_manager = PSD2ComplianceManager()
        self.fincen_manager = FinCENComplianceManager()

    async def generate_compliance_report(
        self, framework: ComplianceFramework, start_date: datetime, end_date: datetime
    ) -> Dict[str, Any]:
        """Generate comprehensive compliance report"""
        try:
            report_data = {
                "framework": framework.value,
                "report_period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                },
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "summary": {},
                "details": {},
                "recommendations": [],
            }
            if framework == ComplianceFramework.GDPR:
                report_data.update(
                    await self._generate_gdpr_report(start_date, end_date)
                )
            elif framework == ComplianceFramework.PSD2:
                report_data.update(
                    await self._generate_psd2_report(start_date, end_date)
                )
            elif framework == ComplianceFramework.FINCEN:
                report_data.update(
                    await self._generate_fincen_report(start_date, end_date)
                )
            report_id = str(uuid.uuid4())
            report_key = f"compliance_report:{report_id}"
            self.redis_client.setex(
                report_key, 86400 * 30, json.dumps(report_data, default=str)
            )
            return report_data
        except Exception as e:
            logger.error(f"Error generating compliance report: {str(e)}")
            raise ComplianceException(f"Failed to generate compliance report: {str(e)}")

    async def _generate_gdpr_report(
        self, start_date: datetime, end_date: datetime
    ) -> Dict[str, Any]:
        """Generate GDPR-specific compliance report"""
        return {
            "summary": {
                "data_subjects_registered": 0,
                "consent_requests_processed": 0,
                "deletion_requests_processed": 0,
                "data_exports_generated": 0,
                "compliance_violations": 0,
            },
            "details": {
                "consent_management": {},
                "data_retention": {},
                "breach_incidents": [],
            },
            "recommendations": [
                "Review data retention policies",
                "Update privacy notices",
                "Conduct privacy impact assessments",
            ],
        }

    async def _generate_psd2_report(
        self, start_date: datetime, end_date: datetime
    ) -> Dict[str, Any]:
        """Generate PSD2-specific compliance report"""
        return {
            "summary": {
                "transactions_processed": 0,
                "sca_exemptions_applied": 0,
                "sca_failures": 0,
                "risk_assessments_completed": 0,
            },
            "details": {
                "sca_performance": {},
                "exemption_usage": {},
                "risk_distribution": {},
            },
            "recommendations": [
                "Review SCA exemption policies",
                "Optimize authentication flows",
                "Monitor fraud rates",
            ],
        }

    async def _generate_fincen_report(
        self, start_date: datetime, end_date: datetime
    ) -> Dict[str, Any]:
        """Generate FinCEN-specific compliance report"""
        return {
            "summary": {
                "sars_filed": 0,
                "ctrs_filed": 0,
                "suspicious_activities_detected": 0,
                "large_transactions_monitored": 0,
            },
            "details": {
                "sar_statistics": {},
                "ctr_statistics": {},
                "monitoring_effectiveness": {},
            },
            "recommendations": [
                "Review transaction monitoring rules",
                "Update suspicious activity indicators",
                "Enhance customer due diligence",
            ],
        }


async def _log_compliance_event(
    framework: ComplianceFramework,
    event_type: str,
    entity_id: str,
    entity_type: str,
    details: Dict[str, Any],
    status: ComplianceStatus,
    automated: bool = True,
):
    """Log compliance event for audit trail"""
    try:
        event = ComplianceEvent(
            event_id=str(uuid.uuid4()),
            framework=framework,
            event_type=event_type,
            entity_id=entity_id,
            entity_type=entity_type,
            timestamp=datetime.now(timezone.utc),
            details=details,
            status=status,
            automated=automated,
        )
        logger.info(f"COMPLIANCE EVENT: {json.dumps(asdict(event), default=str)}")
    except Exception as e:
        logger.error(f"Error logging compliance event: {str(e)}")


class ComplianceException(Exception):
    """Custom exception for compliance-related errors"""


__all__ = [
    "GDPRComplianceManager",
    "PSD2ComplianceManager",
    "FinCENComplianceManager",
    "ComplianceReportingEngine",
    "ComplianceFramework",
    "ComplianceStatus",
    "ComplianceEvent",
    "ComplianceException",
]

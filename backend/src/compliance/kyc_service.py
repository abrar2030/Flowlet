import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

"""
KYC Service
===========

Know Your Customer (KYC) service for identity verification and customer onboarding.
Provides comprehensive identity verification, document validation, and risk assessment.
"""


class KYCStatus(Enum):
    """KYC verification status."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    VERIFIED = "verified"
    FAILED = "failed"
    EXPIRED = "expired"
    REJECTED = "rejected"


class VerificationLevel(Enum):
    """Levels of KYC verification."""

    BASIC = "basic"
    STANDARD = "standard"
    ENHANCED = "enhanced"
    PREMIUM = "premium"


class DocumentType(Enum):
    """Types of identity documents."""

    PASSPORT = "passport"
    DRIVERS_LICENSE = "drivers_license"
    NATIONAL_ID = "national_id"
    UTILITY_BILL = "utility_bill"
    BANK_STATEMENT = "bank_statement"
    TAX_DOCUMENT = "tax_document"
    BUSINESS_REGISTRATION = "business_registration"
    PROOF_OF_ADDRESS = "proof_of_address"


class VerificationMethod(Enum):
    """Methods of identity verification."""

    DOCUMENT_UPLOAD = "document_upload"
    BIOMETRIC = "biometric"
    VIDEO_CALL = "video_call"
    THIRD_PARTY_DATA = "third_party_data"
    BANK_VERIFICATION = "bank_verification"
    SMS_VERIFICATION = "sms_verification"
    EMAIL_VERIFICATION = "email_verification"


@dataclass
class DocumentVerification:
    """Document verification result."""

    document_id: str
    document_type: DocumentType
    verification_method: VerificationMethod
    status: KYCStatus
    confidence_score: float
    extracted_data: Dict[str, Any]
    verification_details: Dict[str, Any]
    timestamp: datetime
    expiry_date: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "document_id": self.document_id,
            "document_type": self.document_type.value,
            "verification_method": self.verification_method.value,
            "status": self.status.value,
            "confidence_score": self.confidence_score,
            "extracted_data": self.extracted_data,
            "verification_details": self.verification_details,
            "timestamp": self.timestamp.isoformat(),
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
        }


@dataclass
class BiometricVerification:
    """Biometric verification result."""

    verification_id: str
    biometric_type: str  # face, fingerprint, voice
    status: KYCStatus
    confidence_score: float
    liveness_check: bool
    verification_details: Dict[str, Any]
    timestamp: datetime

    def to_dict(self) -> Dict[str, Any]:
        return {
            "verification_id": self.verification_id,
            "biometric_type": self.biometric_type,
            "status": self.status.value,
            "confidence_score": self.confidence_score,
            "liveness_check": self.liveness_check,
            "verification_details": self.verification_details,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class KYCResult:
    """Comprehensive KYC verification result."""

    customer_id: str
    verification_level: VerificationLevel
    status: KYCStatus
    overall_confidence: float
    documents_verified: List[DocumentVerification]
    biometric_verifications: List[BiometricVerification]
    third_party_checks: List[Dict[str, Any]]
    risk_assessment: Dict[str, Any]
    compliance_flags: List[str]
    verification_timestamp: datetime
    expiry_date: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "customer_id": self.customer_id,
            "verification_level": self.verification_level.value,
            "status": self.status.value,
            "overall_confidence": self.overall_confidence,
            "documents_verified": [doc.to_dict() for doc in self.documents_verified],
            "biometric_verifications": [
                bio.to_dict() for bio in self.biometric_verifications
            ],
            "third_party_checks": self.third_party_checks,
            "risk_assessment": self.risk_assessment,
            "compliance_flags": self.compliance_flags,
            "verification_timestamp": self.verification_timestamp.isoformat(),
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
        }


class KYCService:
    """
    Know Your Customer (KYC) service for identity verification.

    Features:
    - Multi-level identity verification
    - Document verification and OCR
    - Biometric verification
    - Third-party data verification
    - Risk-based verification workflows
    - Compliance monitoring
    - Automated decision making
    - Manual review workflows
    """

    def __init__(self, db_session: Session, config: Dict[str, Any] = None):
        self.db = db_session
        self.config = config or {}
        self.logger = logging.getLogger(__name__)

        # KYC configurations
        self._verification_requirements = {}
        self._document_validators = {}
        self._third_party_providers = {}
        self._risk_rules = {}

        # Verification thresholds
        self._confidence_thresholds = {
            VerificationLevel.BASIC: 0.6,
            VerificationLevel.STANDARD: 0.75,
            VerificationLevel.ENHANCED: 0.85,
            VerificationLevel.PREMIUM: 0.95,
        }

        # Initialize KYC service
        self._initialize_kyc_service()

    def _initialize_kyc_service(self):
        """Initialize the KYC service with default configurations."""

        # Set up verification requirements
        self._setup_verification_requirements()

        # Initialize document validators
        self._initialize_document_validators()

        # Set up third-party providers
        self._setup_third_party_providers()

        # Initialize risk rules
        self._initialize_risk_rules()

        self.logger.info("KYC service initialized successfully")

    def _setup_verification_requirements(self):
        """Set up verification requirements for different levels."""

        self._verification_requirements = {
            VerificationLevel.BASIC: {
                "required_documents": [DocumentType.NATIONAL_ID],
                "optional_documents": [DocumentType.PROOF_OF_ADDRESS],
                "biometric_required": False,
                "third_party_checks": ["email_verification"],
                "manual_review_threshold": 0.4,
            },
            VerificationLevel.STANDARD: {
                "required_documents": [
                    DocumentType.NATIONAL_ID,
                    DocumentType.PROOF_OF_ADDRESS,
                ],
                "optional_documents": [DocumentType.UTILITY_BILL],
                "biometric_required": False,
                "third_party_checks": ["email_verification", "phone_verification"],
                "manual_review_threshold": 0.6,
            },
            VerificationLevel.ENHANCED: {
                "required_documents": [
                    DocumentType.PASSPORT,
                    DocumentType.PROOF_OF_ADDRESS,
                ],
                "optional_documents": [DocumentType.BANK_STATEMENT],
                "biometric_required": True,
                "third_party_checks": [
                    "email_verification",
                    "phone_verification",
                    "address_verification",
                ],
                "manual_review_threshold": 0.75,
            },
            VerificationLevel.PREMIUM: {
                "required_documents": [
                    DocumentType.PASSPORT,
                    DocumentType.PROOF_OF_ADDRESS,
                    DocumentType.BANK_STATEMENT,
                ],
                "optional_documents": [DocumentType.TAX_DOCUMENT],
                "biometric_required": True,
                "third_party_checks": [
                    "email_verification",
                    "phone_verification",
                    "address_verification",
                    "credit_check",
                ],
                "manual_review_threshold": 0.85,
            },
        }

    def _initialize_document_validators(self):
        """Initialize document validation configurations."""

        self._document_validators = {
            DocumentType.PASSPORT: {
                "required_fields": [
                    "document_number",
                    "full_name",
                    "date_of_birth",
                    "nationality",
                    "expiry_date",
                ],
                "ocr_confidence_threshold": 0.8,
                "security_features": [
                    "mrz_validation",
                    "hologram_check",
                    "font_analysis",
                ],
                "validity_checks": ["expiry_date", "issuing_authority"],
            },
            DocumentType.DRIVERS_LICENSE: {
                "required_fields": [
                    "license_number",
                    "full_name",
                    "date_of_birth",
                    "address",
                    "expiry_date",
                ],
                "ocr_confidence_threshold": 0.75,
                "security_features": ["barcode_validation", "hologram_check"],
                "validity_checks": ["expiry_date", "issuing_state"],
            },
            DocumentType.NATIONAL_ID: {
                "required_fields": ["id_number", "full_name", "date_of_birth"],
                "ocr_confidence_threshold": 0.8,
                "security_features": ["chip_validation", "hologram_check"],
                "validity_checks": ["issuing_authority"],
            },
            DocumentType.UTILITY_BILL: {
                "required_fields": ["customer_name", "address", "issue_date"],
                "ocr_confidence_threshold": 0.7,
                "security_features": [],
                "validity_checks": ["issue_date_recent"],
            },
        }

    def _setup_third_party_providers(self):
        """Set up third-party verification providers."""

        self._third_party_providers = {
            "email_verification": {
                "provider": "EmailVerify Pro",
                "endpoint": "https://api.emailverify.com/verify",
                "confidence_threshold": 0.8,
            },
            "phone_verification": {
                "provider": "PhoneCheck Global",
                "endpoint": "https://api.phonecheck.com/verify",
                "confidence_threshold": 0.85,
            },
            "address_verification": {
                "provider": "AddressValidator",
                "endpoint": "https://api.addressvalidator.com/verify",
                "confidence_threshold": 0.75,
            },
            "credit_check": {
                "provider": "CreditBureau API",
                "endpoint": "https://api.creditbureau.com/check",
                "confidence_threshold": 0.9,
            },
        }

    def _initialize_risk_rules(self):
        """Initialize risk assessment rules."""

        self._risk_rules = {
            "document_risk_factors": {
                "expired_document": {
                    "weight": 0.8,
                    "description": "Document has expired",
                },
                "low_quality_image": {
                    "weight": 0.4,
                    "description": "Poor image quality",
                },
                "tampered_document": {
                    "weight": 1.0,
                    "description": "Signs of document tampering",
                },
                "mismatched_data": {
                    "weight": 0.6,
                    "description": "Data mismatch between documents",
                },
            },
            "customer_risk_factors": {
                "high_risk_country": {
                    "weight": 0.5,
                    "description": "Customer from high-risk jurisdiction",
                },
                "pep_status": {
                    "weight": 0.7,
                    "description": "Politically exposed person",
                },
                "sanctions_match": {
                    "weight": 1.0,
                    "description": "Sanctions list match",
                },
                "adverse_media": {
                    "weight": 0.4,
                    "description": "Negative media coverage",
                },
            },
            "behavioral_risk_factors": {
                "multiple_attempts": {
                    "weight": 0.3,
                    "description": "Multiple verification attempts",
                },
                "unusual_timing": {
                    "weight": 0.2,
                    "description": "Verification at unusual hours",
                },
                "vpn_usage": {"weight": 0.3, "description": "Using VPN or proxy"},
                "device_fingerprint_mismatch": {
                    "weight": 0.4,
                    "description": "Device fingerprint inconsistency",
                },
            },
        }

    async def verify_customer(
        self,
        customer_data: Dict[str, Any],
        verification_level: VerificationLevel = VerificationLevel.STANDARD,
    ) -> KYCResult:
        """
        Perform comprehensive KYC verification for a customer.

        Args:
            customer_data: Customer information and documents
            verification_level: Required level of verification

        Returns:
            KYCResult containing verification results
        """

        customer_id = customer_data.get(
            "customer_id", customer_data.get("user_id", "unknown")
        )

        try:
            self.logger.info(
                f"Starting KYC verification for customer {customer_id} at level {verification_level.value}"
            )

            # Get verification requirements
            requirements = self._verification_requirements[verification_level]

            # Verify documents
            document_verifications = await self._verify_documents(
                customer_data, requirements
            )

            # Perform biometric verification if required
            biometric_verifications = []
            if requirements["biometric_required"]:
                biometric_verifications = await self._verify_biometrics(customer_data)

            # Perform third-party checks
            third_party_checks = await self._perform_third_party_checks(
                customer_data, requirements
            )

            # Assess risk
            risk_assessment = await self._assess_customer_risk(
                customer_data, document_verifications
            )

            # Calculate overall confidence
            overall_confidence = self._calculate_overall_confidence(
                document_verifications,
                biometric_verifications,
                third_party_checks,
                risk_assessment,
            )

            # Determine verification status
            status = self._determine_verification_status(
                overall_confidence, verification_level, risk_assessment
            )

            # Check for compliance flags
            compliance_flags = self._check_compliance_flags(
                customer_data, risk_assessment
            )

            # Set expiry date
            expiry_date = datetime.utcnow() + timedelta(days=365)  # 1 year validity

            result = KYCResult(
                customer_id=customer_id,
                verification_level=verification_level,
                status=status,
                overall_confidence=overall_confidence,
                documents_verified=document_verifications,
                biometric_verifications=biometric_verifications,
                third_party_checks=third_party_checks,
                risk_assessment=risk_assessment,
                compliance_flags=compliance_flags,
                verification_timestamp=datetime.utcnow(),
                expiry_date=expiry_date,
            )

            self.logger.info(
                f"KYC verification completed for customer {customer_id}: {status.value}"
            )
            return result

        except Exception as e:
            self.logger.error(
                f"Error in KYC verification for customer {customer_id}: {str(e)}"
            )

            return KYCResult(
                customer_id=customer_id,
                verification_level=verification_level,
                status=KYCStatus.FAILED,
                overall_confidence=0.0,
                documents_verified=[],
                biometric_verifications=[],
                third_party_checks=[],
                risk_assessment={"error": str(e)},
                compliance_flags=["verification_error"],
                verification_timestamp=datetime.utcnow(),
            )

    async def _verify_documents(
        self, customer_data: Dict[str, Any], requirements: Dict[str, Any]
    ) -> List[DocumentVerification]:
        """Verify customer documents."""

        verifications = []
        documents = customer_data.get("documents", [])

        for document in documents:
            try:
                verification = await self._verify_single_document(document)
                verifications.append(verification)
            except Exception as e:
                self.logger.error(
                    f"Error verifying document {document.get('document_id')}: {str(e)}"
                )

                # Create failed verification
                verifications.append(
                    DocumentVerification(
                        document_id=document.get("document_id", "unknown"),
                        document_type=DocumentType(
                            document.get("document_type", "national_id")
                        ),
                        verification_method=VerificationMethod.DOCUMENT_UPLOAD,
                        status=KYCStatus.FAILED,
                        confidence_score=0.0,
                        extracted_data={},
                        verification_details={"error": str(e)},
                        timestamp=datetime.utcnow(),
                    )
                )

        return verifications

    async def _verify_single_document(
        self, document: Dict[str, Any]
    ) -> DocumentVerification:
        """Verify a single document."""

        document_id = document.get("document_id", "unknown")
        document_type = DocumentType(document.get("document_type"))
        document_image = document.get("image_data", "")

        # Get validator configuration
        validator_config = self._document_validators.get(document_type, {})

        # Perform OCR extraction
        extracted_data = await self._extract_document_data(
            document_image, document_type
        )

        # Validate extracted data
        validation_results = await self._validate_document_data(
            extracted_data, validator_config
        )

        # Check security features
        security_check_results = await self._check_security_features(
            document_image, validator_config
        )

        # Calculate confidence score
        confidence_score = self._calculate_document_confidence(
            extracted_data, validation_results, security_check_results
        )

        # Determine status
        threshold = validator_config.get("ocr_confidence_threshold", 0.75)
        status = (
            KYCStatus.VERIFIED if confidence_score >= threshold else KYCStatus.FAILED
        )

        return DocumentVerification(
            document_id=document_id,
            document_type=document_type,
            verification_method=VerificationMethod.DOCUMENT_UPLOAD,
            status=status,
            confidence_score=confidence_score,
            extracted_data=extracted_data,
            verification_details={
                "validation_results": validation_results,
                "security_check_results": security_check_results,
                "ocr_confidence": extracted_data.get("ocr_confidence", 0.0),
            },
            timestamp=datetime.utcnow(),
            expiry_date=self._parse_document_expiry(extracted_data.get("expiry_date")),
        )

    async def _extract_document_data(
        self, image_data: str, document_type: DocumentType
    ) -> Dict[str, Any]:
        """Extract data from document image using OCR."""

        # Mock OCR implementation
        # In practice, this would use actual OCR services like AWS Textract, Google Vision API, etc.

        extracted_data = {
            "ocr_confidence": 0.85,
            "extraction_timestamp": datetime.utcnow().isoformat(),
        }

        if document_type == DocumentType.PASSPORT:
            extracted_data.update(
                {
                    "document_number": "P123456789",
                    "full_name": "John Doe",
                    "date_of_birth": "1990-01-01",
                    "nationality": "US",
                    "expiry_date": "2030-01-01",
                    "issuing_authority": "US Department of State",
                }
            )
        elif document_type == DocumentType.DRIVERS_LICENSE:
            extracted_data.update(
                {
                    "license_number": "DL123456789",
                    "full_name": "John Doe",
                    "date_of_birth": "1990-01-01",
                    "address": "123 Main St, Anytown, US",
                    "expiry_date": "2025-01-01",
                    "issuing_state": "CA",
                }
            )
        elif document_type == DocumentType.NATIONAL_ID:
            extracted_data.update(
                {
                    "id_number": "ID123456789",
                    "full_name": "John Doe",
                    "date_of_birth": "1990-01-01",
                    "issuing_authority": "Department of Motor Vehicles",
                }
            )
        elif document_type == DocumentType.UTILITY_BILL:
            extracted_data.update(
                {
                    "customer_name": "John Doe",
                    "address": "123 Main St, Anytown, US",
                    "issue_date": "2024-01-01",
                    "utility_company": "City Power & Light",
                }
            )

        return extracted_data

    async def _validate_document_data(
        self, extracted_data: Dict[str, Any], validator_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate extracted document data."""

        validation_results = {
            "required_fields_present": True,
            "field_validations": {},
            "overall_validity": True,
        }

        required_fields = validator_config.get("required_fields", [])

        # Check required fields
        for field in required_fields:
            if field not in extracted_data or not extracted_data[field]:
                validation_results["required_fields_present"] = False
                validation_results["field_validations"][field] = "missing"
            else:
                validation_results["field_validations"][field] = "valid"

        # Validate specific fields
        if "expiry_date" in extracted_data:
            expiry_date = self._parse_document_expiry(extracted_data["expiry_date"])
            if expiry_date and expiry_date < datetime.utcnow():
                validation_results["field_validations"]["expiry_date"] = "expired"
                validation_results["overall_validity"] = False

        if "date_of_birth" in extracted_data:
            dob = self._parse_date(extracted_data["date_of_birth"])
            if dob and dob > datetime.utcnow():
                validation_results["field_validations"][
                    "date_of_birth"
                ] = "invalid_future_date"
                validation_results["overall_validity"] = False

        return validation_results

    async def _check_security_features(
        self, image_data: str, validator_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Check document security features."""

        security_results = {
            "features_checked": [],
            "features_passed": [],
            "features_failed": [],
            "overall_security_score": 0.8,  # Mock score
        }

        security_features = validator_config.get("security_features", [])

        for feature in security_features:
            security_results["features_checked"].append(feature)

            # Mock security feature validation
            if feature == "mrz_validation":
                # Machine Readable Zone validation
                security_results["features_passed"].append(feature)
            elif feature == "hologram_check":
                # Hologram presence check
                security_results["features_passed"].append(feature)
            elif feature == "barcode_validation":
                # Barcode validation
                security_results["features_passed"].append(feature)
            else:
                security_results["features_passed"].append(feature)

        return security_results

    async def _verify_biometrics(
        self, customer_data: Dict[str, Any]
    ) -> List[BiometricVerification]:
        """Perform biometric verification."""

        verifications = []
        biometric_data = customer_data.get("biometric_data", [])

        for biometric in biometric_data:
            verification = await self._verify_single_biometric(biometric)
            verifications.append(verification)

        return verifications

    async def _verify_single_biometric(
        self, biometric: Dict[str, Any]
    ) -> BiometricVerification:
        """Verify a single biometric."""

        verification_id = biometric.get(
            "verification_id", f"bio_{int(datetime.utcnow().timestamp())}"
        )
        biometric_type = biometric.get("biometric_type", "face")
        biometric.get("data", "")

        # Mock biometric verification
        # In practice, this would use actual biometric verification services

        confidence_score = 0.92  # Mock confidence
        liveness_check = True  # Mock liveness detection

        status = KYCStatus.VERIFIED if confidence_score >= 0.8 else KYCStatus.FAILED

        return BiometricVerification(
            verification_id=verification_id,
            biometric_type=biometric_type,
            status=status,
            confidence_score=confidence_score,
            liveness_check=liveness_check,
            verification_details={
                "algorithm_version": "2.1",
                "processing_time_ms": 1250,
                "quality_score": 0.88,
            },
            timestamp=datetime.utcnow(),
        )

    async def _perform_third_party_checks(
        self, customer_data: Dict[str, Any], requirements: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Perform third-party verification checks."""

        checks = []
        required_checks = requirements.get("third_party_checks", [])

        for check_type in required_checks:
            try:
                check_result = await self._perform_single_third_party_check(
                    customer_data, check_type
                )
                checks.append(check_result)
            except Exception as e:
                self.logger.error(f"Error in third-party check {check_type}: {str(e)}")
                checks.append(
                    {
                        "check_type": check_type,
                        "status": "failed",
                        "error": str(e),
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                )

        return checks

    async def _perform_single_third_party_check(
        self, customer_data: Dict[str, Any], check_type: str
    ) -> Dict[str, Any]:
        """Perform a single third-party verification check."""

        provider_config = self._third_party_providers.get(check_type, {})

        # Mock third-party API calls
        # In practice, these would make actual HTTP requests to verification services

        if check_type == "email_verification":
            email = customer_data.get("email", "")
            return {
                "check_type": check_type,
                "provider": provider_config.get("provider"),
                "status": "verified",
                "confidence_score": 0.95,
                "details": {
                    "email": email,
                    "deliverable": True,
                    "disposable": False,
                    "role_account": False,
                },
                "timestamp": datetime.utcnow().isoformat(),
            }

        elif check_type == "phone_verification":
            phone = customer_data.get("phone", "")
            return {
                "check_type": check_type,
                "provider": provider_config.get("provider"),
                "status": "verified",
                "confidence_score": 0.88,
                "details": {
                    "phone": phone,
                    "valid": True,
                    "carrier": "Mobile Carrier",
                    "line_type": "mobile",
                },
                "timestamp": datetime.utcnow().isoformat(),
            }

        elif check_type == "address_verification":
            address = customer_data.get("address", "")
            return {
                "check_type": check_type,
                "provider": provider_config.get("provider"),
                "status": "verified",
                "confidence_score": 0.82,
                "details": {
                    "address": address,
                    "valid": True,
                    "standardized_address": "123 Main St, Anytown, CA 12345, US",
                },
                "timestamp": datetime.utcnow().isoformat(),
            }

        elif check_type == "credit_check":
            return {
                "check_type": check_type,
                "provider": provider_config.get("provider"),
                "status": "verified",
                "confidence_score": 0.91,
                "details": {
                    "credit_score_range": "700-750",
                    "identity_confirmed": True,
                    "address_confirmed": True,
                },
                "timestamp": datetime.utcnow().isoformat(),
            }

        else:
            return {
                "check_type": check_type,
                "status": "not_supported",
                "timestamp": datetime.utcnow().isoformat(),
            }

    async def _assess_customer_risk(
        self,
        customer_data: Dict[str, Any],
        document_verifications: List[DocumentVerification],
    ) -> Dict[str, Any]:
        """Assess customer risk based on various factors."""

        risk_factors = []
        risk_score = 0.0

        # Document-based risk factors
        for doc_verification in document_verifications:
            if doc_verification.status == KYCStatus.FAILED:
                risk_factors.append("failed_document_verification")
                risk_score += 0.3

            if doc_verification.confidence_score < 0.7:
                risk_factors.append("low_document_confidence")
                risk_score += 0.2

            if (
                doc_verification.expiry_date
                and doc_verification.expiry_date < datetime.utcnow()
            ):
                risk_factors.append("expired_document")
                risk_score += 0.4

        # Customer-based risk factors
        country_code = customer_data.get("country_code", "")
        high_risk_countries = ["XX", "YY", "ZZ"]  # Mock high-risk countries

        if country_code in high_risk_countries:
            risk_factors.append("high_risk_country")
            risk_score += 0.3

        # Behavioral risk factors
        if customer_data.get("multiple_verification_attempts", 0) > 3:
            risk_factors.append("multiple_attempts")
            risk_score += 0.2

        # Cap risk score at 1.0
        risk_score = min(risk_score, 1.0)

        return {
            "risk_score": risk_score,
            "risk_level": (
                "high" if risk_score > 0.7 else "medium" if risk_score > 0.4 else "low"
            ),
            "risk_factors": risk_factors,
            "assessment_timestamp": datetime.utcnow().isoformat(),
        }

    def _calculate_overall_confidence(
        self,
        document_verifications: List[DocumentVerification],
        biometric_verifications: List[BiometricVerification],
        third_party_checks: List[Dict[str, Any]],
        risk_assessment: Dict[str, Any],
    ) -> float:
        """Calculate overall verification confidence."""

        confidence_components = []

        # Document confidence
        if document_verifications:
            doc_confidence = sum(
                doc.confidence_score for doc in document_verifications
            ) / len(document_verifications)
            confidence_components.append(("documents", doc_confidence, 0.4))

        # Biometric confidence
        if biometric_verifications:
            bio_confidence = sum(
                bio.confidence_score for bio in biometric_verifications
            ) / len(biometric_verifications)
            confidence_components.append(("biometrics", bio_confidence, 0.3))

        # Third-party confidence
        if third_party_checks:
            verified_checks = [
                check
                for check in third_party_checks
                if check.get("status") == "verified"
            ]
            if verified_checks:
                tp_confidence = sum(
                    check.get("confidence_score", 0.5) for check in verified_checks
                ) / len(verified_checks)
                confidence_components.append(("third_party", tp_confidence, 0.2))

        # Risk adjustment
        risk_score = risk_assessment.get("risk_score", 0.0)
        risk_adjustment = 1.0 - (risk_score * 0.5)  # Reduce confidence based on risk
        confidence_components.append(("risk_adjustment", risk_adjustment, 0.1))

        # Calculate weighted average
        if confidence_components:
            total_weight = sum(weight for _, _, weight in confidence_components)
            weighted_sum = sum(
                confidence * weight for _, confidence, weight in confidence_components
            )
            return weighted_sum / total_weight

        return 0.0

    def _determine_verification_status(
        self,
        overall_confidence: float,
        verification_level: VerificationLevel,
        risk_assessment: Dict[str, Any],
    ) -> KYCStatus:
        """Determine overall verification status."""

        threshold = self._confidence_thresholds[verification_level]
        risk_score = risk_assessment.get("risk_score", 0.0)

        # High risk always requires manual review
        if risk_score > 0.8:
            return KYCStatus.PENDING

        # Check confidence threshold
        if overall_confidence >= threshold:
            return KYCStatus.VERIFIED
        elif overall_confidence >= (threshold - 0.1):
            return KYCStatus.PENDING  # Close to threshold, manual review
        else:
            return KYCStatus.FAILED

    def _check_compliance_flags(
        self, customer_data: Dict[str, Any], risk_assessment: Dict[str, Any]
    ) -> List[str]:
        """Check for compliance flags."""

        flags = []

        # Risk-based flags
        risk_score = risk_assessment.get("risk_score", 0.0)
        if risk_score > 0.7:
            flags.append("high_risk_customer")

        # Sanctions screening flag (would integrate with AML engine)
        if customer_data.get("sanctions_match", False):
            flags.append("sanctions_match")

        # PEP flag
        if customer_data.get("pep_status", False):
            flags.append("politically_exposed_person")

        # Document flags
        if any(
            factor in risk_assessment.get("risk_factors", [])
            for factor in ["expired_document", "failed_document_verification"]
        ):
            flags.append("document_issues")

        return flags

    def _parse_document_expiry(self, expiry_date_str: str) -> Optional[datetime]:
        """Parse document expiry date string."""

        if not expiry_date_str:
            return None

        try:
            # Try common date formats
            for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y%m%d"]:
                try:
                    return datetime.strptime(expiry_date_str, fmt)
                except ValueError:
                    continue
        except Exception:
            pass

        return None

    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string."""

        if not date_str:
            return None

        try:
            for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y%m%d"]:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
        except Exception:
            pass

        return None

    def _calculate_document_confidence(
        self,
        extracted_data: Dict[str, Any],
        validation_results: Dict[str, Any],
        security_check_results: Dict[str, Any],
    ) -> float:
        """Calculate document verification confidence score."""

        confidence = 0.0

        # OCR confidence
        ocr_confidence = extracted_data.get("ocr_confidence", 0.0)
        confidence += ocr_confidence * 0.4

        # Validation results
        if validation_results.get("overall_validity", False):
            confidence += 0.3

        # Security features
        security_score = security_check_results.get("overall_security_score", 0.0)
        confidence += security_score * 0.3

        return min(confidence, 1.0)

    async def get_verification_status(self, customer_id: str) -> Optional[KYCResult]:
        """Get current verification status for a customer."""

        # In practice, this would query the database for stored KYC results
        # For now, return None to indicate no existing verification
        return None

    async def update_verification_status(
        self, customer_id: str, status: KYCStatus, notes: str = None
    ) -> bool:
        """Update verification status for a customer."""

        try:
            # In practice, this would update the database
            self.logger.info(
                f"Updated verification status for customer {customer_id} to {status.value}"
            )
            return True
        except Exception as e:
            self.logger.error(f"Error updating verification status: {str(e)}")
            return False

    def get_verification_requirements(
        self, verification_level: VerificationLevel
    ) -> Dict[str, Any]:
        """Get verification requirements for a specific level."""

        return self._verification_requirements.get(verification_level, {})

    def get_kyc_statistics(self) -> Dict[str, Any]:
        """Get KYC service statistics."""

        return {
            "verification_levels": len(self._verification_requirements),
            "document_types_supported": len(self._document_validators),
            "third_party_providers": len(self._third_party_providers),
            "confidence_thresholds": {
                level.value: threshold
                for level, threshold in self._confidence_thresholds.items()
            },
            "last_updated": datetime.utcnow().isoformat(),
        }

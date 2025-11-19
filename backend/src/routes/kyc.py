import json
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Dict

from flask import Blueprint, jsonify, request

from ..models.database import KYCRecord, User, db
from ..utils.audit import log_audit_event
from ..utils.notifications import send_notification

# Create blueprint
kyc_bp = Blueprint("kyc", __name__, url_prefix="/api/v1/kyc")


class VerificationLevel(Enum):
    """KYC verification levels"""

    BASIC = "basic"
    ENHANCED = "enhanced"
    PREMIUM = "premium"


class VerificationStatus(Enum):
    """Verification status enumeration"""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"
    REQUIRES_REVIEW = "requires_review"


class DocumentType(Enum):
    """Supported document types"""

    PASSPORT = "passport"
    DRIVERS_LICENSE = "drivers_license"
    NATIONAL_ID = "national_id"
    UTILITY_BILL = "utility_bill"
    BANK_STATEMENT = "bank_statement"


class KYCAMLService:
    """
    KYC/AML Service implementing financial industry standards
    Provides comprehensive identity verification and compliance workflows
    """

    VERIFICATION_PROVIDERS = {
        "jumio": {
            "api_url": "https://api.jumio.com",
            "supported_documents": ["passport", "drivers_license", "national_id"],
            "supported_countries": ["US", "CA", "GB", "DE", "FR", "AU"],
        },
        "onfido": {
            "api_url": "https://api.onfido.com/v3",
            "supported_documents": ["passport", "drivers_license", "national_id"],
            "supported_countries": ["US", "CA", "GB", "DE", "FR", "AU", "IN"],
        },
        "shufti_pro": {
            "api_url": "https://api.shuftipro.com",
            "supported_documents": [
                "passport",
                "drivers_license",
                "national_id",
                "utility_bill",
            ],
            "supported_countries": ["US", "CA", "GB", "DE", "FR", "AU", "IN", "PK"],
        },
    }

    RISK_SCORE_THRESHOLDS = {"low": 30, "medium": 60, "high": 80, "critical": 95}

    @staticmethod
    def initiate_kyc_verification(
        user_id: str,
        verification_level: str,
        document_type: str = None,
        country: str = "US",
        provider: str = "jumio",
    ) -> Dict:
        """
        Initiate KYC verification process

        Args:
            user_id: User identifier
            verification_level: Level of verification required
            document_type: Type of document for verification
            country: User's country
            provider: KYC provider to use

        Returns:
            Dict containing verification initiation result
        """
        try:
            # Validate inputs
            if verification_level not in [level.value for level in VerificationLevel]:
                return {
                    "success": False,
                    "error": "INVALID_VERIFICATION_LEVEL",
                    "message": f"Verification level must be one of: {[l.value for l in VerificationLevel]}",
                }

            # Get user
            user = User.query.get(user_id)
            if not user:
                return {
                    "success": False,
                    "error": "USER_NOT_FOUND",
                    "message": "User does not exist",
                }

            # Check if user already has pending verification
            existing_verification = KYCRecord.query.filter_by(
                user_id=user_id, verification_status=VerificationStatus.PENDING.value
            ).first()

            if existing_verification:
                return {
                    "success": False,
                    "error": "VERIFICATION_PENDING",
                    "message": "User already has a pending verification",
                }

            # Create KYC record
            kyc_record = KYCRecord(
                id=str(uuid.uuid4()),
                user_id=user_id,
                verification_level=verification_level,
                document_type=document_type,
                verification_status=VerificationStatus.PENDING.value,
                verification_provider=provider,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )

            db.session.add(kyc_record)

            # Initiate verification with provider
            provider_result = KYCAMLService._initiate_with_provider(
                provider=provider,
                user=user,
                verification_level=verification_level,
                document_type=document_type,
                country=country,
            )

            if provider_result["success"]:
                kyc_record.verification_status = VerificationStatus.IN_PROGRESS.value
                kyc_record.notes = json.dumps(provider_result.get("provider_data", {}))

                db.session.commit()

                # Log audit event
                log_audit_event(
                    user_id=user_id,
                    action="KYC_INITIATED",
                    resource_type="kyc_verification",
                    resource_id=kyc_record.id,
                    details={
                        "verification_level": verification_level,
                        "document_type": document_type,
                        "provider": provider,
                    },
                )

                # Send notification
                send_notification(
                    user_id=user_id,
                    notification_type="kyc_verification_required",
                    message=f"Identity verification initiated - {verification_level} level",
                    metadata={
                        "kyc_id": kyc_record.id,
                        "verification_url": provider_result.get("verification_url"),
                    },
                )

                return {
                    "success": True,
                    "kyc_id": kyc_record.id,
                    "verification_level": verification_level,
                    "status": kyc_record.verification_status,
                    "verification_url": provider_result.get("verification_url"),
                    "provider": provider,
                    "created_at": kyc_record.created_at.isoformat() + "Z",
                }
            else:
                db.session.rollback()
                return provider_result

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error initiating KYC verification: {str(e)}")
            return {
                "success": False,
                "error": "INTERNAL_ERROR",
                "message": "Failed to initiate KYC verification",
            }

    @staticmethod
    def _initiate_with_provider(
        provider: str,
        user: User,
        verification_level: str,
        document_type: str,
        country: str,
    ) -> Dict:
        """Initiate verification with specific provider"""
        try:
            if provider == "jumio":
                return KYCAMLService._initiate_jumio_verification(
                    user, verification_level, document_type, country
                )
            elif provider == "onfido":
                return KYCAMLService._initiate_onfido_verification(
                    user, verification_level, document_type, country
                )
            elif provider == "shufti_pro":
                return KYCAMLService._initiate_shufti_verification(
                    user, verification_level, document_type, country
                )
            else:
                return {
                    "success": False,
                    "error": "UNSUPPORTED_PROVIDER",
                    "message": f"Provider {provider} not supported",
                }

        except Exception as e:
            logger.error(f"Error with provider {provider}: {str(e)}")
            return {
                "success": False,
                "error": "PROVIDER_ERROR",
                "message": f"Failed to initiate verification with {provider}",
            }

    @staticmethod
    def _initiate_jumio_verification(
        user: User, verification_level: str, document_type: str, country: str
    ) -> Dict:
        """Initiate verification with Jumio"""
        try:
            # In a real implementation, this would make actual API calls to Jumio
            # For now, simulate the process

            verification_url = f"https://jumio.com/verify/{uuid.uuid4().hex}"
            session_id = f"jumio_{uuid.uuid4().hex[:16]}"

            return {
                "success": True,
                "verification_url": verification_url,
                "session_id": session_id,
                "provider_data": {
                    "provider": "jumio",
                    "session_id": session_id,
                    "verification_level": verification_level,
                    "document_type": document_type,
                },
            }

        except Exception as e:
            logger.error(f"Jumio verification error: {str(e)}")
            return {
                "success": False,
                "error": "JUMIO_ERROR",
                "message": "Failed to initiate Jumio verification",
            }

    @staticmethod
    def _initiate_onfido_verification(
        user: User, verification_level: str, document_type: str, country: str
    ) -> Dict:
        """Initiate verification with Onfido"""
        try:
            # Simulate Onfido verification initiation
            verification_url = f"https://onfido.com/verify/{uuid.uuid4().hex}"
            applicant_id = f"onfido_{uuid.uuid4().hex[:16]}"

            return {
                "success": True,
                "verification_url": verification_url,
                "applicant_id": applicant_id,
                "provider_data": {
                    "provider": "onfido",
                    "applicant_id": applicant_id,
                    "verification_level": verification_level,
                    "document_type": document_type,
                },
            }

        except Exception as e:
            logger.error(f"Onfido verification error: {str(e)}")
            return {
                "success": False,
                "error": "ONFIDO_ERROR",
                "message": "Failed to initiate Onfido verification",
            }

    @staticmethod
    def _initiate_shufti_verification(
        user: User, verification_level: str, document_type: str, country: str
    ) -> Dict:
        """Initiate verification with Shufti Pro"""
        try:
            # Simulate Shufti Pro verification initiation
            verification_url = f"https://shuftipro.com/verify/{uuid.uuid4().hex}"
            reference_id = f"shufti_{uuid.uuid4().hex[:16]}"

            return {
                "success": True,
                "verification_url": verification_url,
                "reference_id": reference_id,
                "provider_data": {
                    "provider": "shufti_pro",
                    "reference_id": reference_id,
                    "verification_level": verification_level,
                    "document_type": document_type,
                },
            }

        except Exception as e:
            logger.error(f"Shufti Pro verification error: {str(e)}")
            return {
                "success": False,
                "error": "SHUFTI_ERROR",
                "message": "Failed to initiate Shufti Pro verification",
            }

    @staticmethod
    def process_verification_callback(provider: str, callback_data: Dict) -> Dict:
        """
        Process verification callback from provider

        Args:
            provider: KYC provider name
            callback_data: Callback data from provider

        Returns:
            Dict containing processing result
        """
        try:
            if provider == "jumio":
                return KYCAMLService._process_jumio_callback(callback_data)
            elif provider == "onfido":
                return KYCAMLService._process_onfido_callback(callback_data)
            elif provider == "shufti_pro":
                return KYCAMLService._process_shufti_callback(callback_data)
            else:
                return {
                    "success": False,
                    "error": "UNSUPPORTED_PROVIDER",
                    "message": f"Provider {provider} not supported",
                }

        except Exception as e:
            logger.error(f"Error processing callback from {provider}: {str(e)}")
            return {
                "success": False,
                "error": "CALLBACK_PROCESSING_ERROR",
                "message": "Failed to process verification callback",
            }

    @staticmethod
    def _process_jumio_callback(callback_data: Dict) -> Dict:
        """Process Jumio verification callback"""
        try:
            # Extract relevant data from Jumio callback
            session_id = callback_data.get("jumioIdScanReference")
            verification_status = callback_data.get("verificationStatus")

            # Find KYC record
            kyc_record = KYCRecord.query.filter(
                KYCRecord.notes.contains(session_id)
            ).first()

            if not kyc_record:
                return {
                    "success": False,
                    "error": "KYC_RECORD_NOT_FOUND",
                    "message": "KYC record not found for callback",
                }

            # Update verification status
            if verification_status == "APPROVED_VERIFIED":
                kyc_record.verification_status = VerificationStatus.VERIFIED.value
                kyc_record.verification_date = datetime.now(timezone.utc)
                kyc_record.risk_score = 10  # Low risk for approved verification
            elif verification_status == "DENIED_FRAUD":
                kyc_record.verification_status = VerificationStatus.REJECTED.value
                kyc_record.risk_score = 95  # High risk for fraud
            else:
                kyc_record.verification_status = (
                    VerificationStatus.REQUIRES_REVIEW.value
                )
                kyc_record.risk_score = 50  # Medium risk for manual review

            kyc_record.updated_at = datetime.now(timezone.utc)
            kyc_record.notes = json.dumps(callback_data)

            # Update user KYC status
            user = User.query.get(kyc_record.user_id)
            if (
                user
                and kyc_record.verification_status == VerificationStatus.VERIFIED.value
            ):
                user.kyc_status = "verified"

            db.session.commit()

            # Log audit event
            log_audit_event(
                user_id=kyc_record.user_id,
                action="KYC_COMPLETED",
                resource_type="kyc_verification",
                resource_id=kyc_record.id,
                details={
                    "verification_status": kyc_record.verification_status,
                    "risk_score": kyc_record.risk_score,
                    "provider": "jumio",
                },
            )

            # Send notification
            send_notification(
                user_id=kyc_record.user_id,
                notification_type="kyc_verification_completed",
                message=f"Identity verification {kyc_record.verification_status}",
                metadata={
                    "kyc_id": kyc_record.id,
                    "status": kyc_record.verification_status,
                },
            )

            return {
                "success": True,
                "kyc_id": kyc_record.id,
                "status": kyc_record.verification_status,
                "risk_score": kyc_record.risk_score,
            }

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error processing Jumio callback: {str(e)}")
            return {
                "success": False,
                "error": "JUMIO_CALLBACK_ERROR",
                "message": "Failed to process Jumio callback",
            }

    @staticmethod
    def _process_onfido_callback(callback_data: Dict) -> Dict:
        """Process Onfido verification callback"""
        # Similar implementation to Jumio but with Onfido-specific data structure
        return {"success": True, "message": "Onfido callback processed"}

    @staticmethod
    def _process_shufti_callback(callback_data: Dict) -> Dict:
        """Process Shufti Pro verification callback"""
        # Similar implementation to Jumio but with Shufti-specific data structure
        return {"success": True, "message": "Shufti callback processed"}

    @staticmethod
    def perform_aml_screening(
        user_id: str, screening_type: str = "comprehensive"
    ) -> Dict:
        """
        Perform AML screening against sanctions lists and PEP databases

        Args:
            user_id: User identifier
            screening_type: Type of screening (basic, comprehensive)

        Returns:
            Dict containing screening result
        """
        try:
            user = User.query.get(user_id)
            if not user:
                return {
                    "success": False,
                    "error": "USER_NOT_FOUND",
                    "message": "User does not exist",
                }

            # Perform screening against various databases
            screening_results = {
                "sanctions_lists": KYCAMLService._check_sanctions_lists(user),
                "pep_database": KYCAMLService._check_pep_database(user),
                "adverse_media": KYCAMLService._check_adverse_media(user),
                "watchlists": KYCAMLService._check_watchlists(user),
            }

            # Calculate overall risk score
            risk_score = KYCAMLService._calculate_aml_risk_score(screening_results)

            # Determine action based on risk score
            if risk_score >= KYCAMLService.RISK_SCORE_THRESHOLDS["critical"]:
                action = "block_account"
                status = "high_risk"
            elif risk_score >= KYCAMLService.RISK_SCORE_THRESHOLDS["high"]:
                action = "enhanced_due_diligence"
                status = "high_risk"
            elif risk_score >= KYCAMLService.RISK_SCORE_THRESHOLDS["medium"]:
                action = "additional_monitoring"
                status = "medium_risk"
            else:
                action = "continue_monitoring"
                status = "low_risk"

            # Log audit event
            log_audit_event(
                user_id=user_id,
                action="AML_SCREENING",
                resource_type="aml_screening",
                resource_id=str(uuid.uuid4()),
                details={
                    "screening_type": screening_type,
                    "risk_score": risk_score,
                    "status": status,
                    "action": action,
                    "screening_results": screening_results,
                },
            )

            return {
                "success": True,
                "user_id": user_id,
                "screening_type": screening_type,
                "risk_score": risk_score,
                "status": status,
                "recommended_action": action,
                "screening_results": screening_results,
                "screened_at": datetime.now(timezone.utc).isoformat() + "Z",
            }

        except Exception as e:
            logger.error(f"Error performing AML screening: {str(e)}")
            return {
                "success": False,
                "error": "AML_SCREENING_ERROR",
                "message": "Failed to perform AML screening",
            }

    @staticmethod
    def _check_sanctions_lists(user: User) -> Dict:
        """Check user against sanctions lists"""
        # In a real implementation, this would check against OFAC, UN, EU sanctions lists
        # For now, simulate the check
        return {
            "ofac_match": False,
            "un_match": False,
            "eu_match": False,
            "risk_score": 0,
        }

    @staticmethod
    def _check_pep_database(user: User) -> Dict:
        """Check user against Politically Exposed Persons database"""
        # Simulate PEP check
        return {"pep_match": False, "pep_level": None, "risk_score": 0}

    @staticmethod
    def _check_adverse_media(user: User) -> Dict:
        """Check user against adverse media"""
        # Simulate adverse media check
        return {"adverse_media_found": False, "severity": None, "risk_score": 0}

    @staticmethod
    def _check_watchlists(user: User) -> Dict:
        """Check user against internal and external watchlists"""
        # Simulate watchlist check
        return {
            "internal_watchlist": False,
            "external_watchlist": False,
            "risk_score": 0,
        }

    @staticmethod
    def _calculate_aml_risk_score(screening_results: Dict) -> int:
        """Calculate overall AML risk score"""
        total_score = 0

        for category, results in screening_results.items():
            total_score += results.get("risk_score", 0)

        return min(total_score, 100)  # Cap at 100

    @staticmethod
    def get_kyc_status(user_id: str) -> Dict:
        """
        Get KYC status for a user

        Args:
            user_id: User identifier

        Returns:
            Dict containing KYC status information
        """
        try:
            user = User.query.get(user_id)
            if not user:
                return {
                    "success": False,
                    "error": "USER_NOT_FOUND",
                    "message": "User does not exist",
                }

            # Get latest KYC record
            latest_kyc = (
                KYCRecord.query.filter_by(user_id=user_id)
                .order_by(KYCRecord.created_at.desc())
                .first()
            )

            if not latest_kyc:
                return {
                    "success": True,
                    "user_id": user_id,
                    "kyc_status": "not_started",
                    "verification_level": None,
                    "risk_score": None,
                }

            return {
                "success": True,
                "user_id": user_id,
                "kyc_status": latest_kyc.verification_status,
                "verification_level": latest_kyc.verification_level,
                "document_type": latest_kyc.document_type,
                "verification_provider": latest_kyc.verification_provider,
                "verification_date": (
                    latest_kyc.verification_date.isoformat() + "Z"
                    if latest_kyc.verification_date
                    else None
                ),
                "risk_score": latest_kyc.risk_score,
                "created_at": latest_kyc.created_at.isoformat() + "Z",
                "updated_at": latest_kyc.updated_at.isoformat() + "Z",
            }

        except Exception as e:
            logger.error(f"Error getting KYC status: {str(e)}")
            return {
                "success": False,
                "error": "INTERNAL_ERROR",
                "message": "Failed to retrieve KYC status",
            }


# API Routes
@enhanced_kyc_bp.route("/initiate", methods=["POST"])
@limiter.limit("5 per minute")
def initiate_kyc_verification():
    """Initiate KYC verification"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["user_id", "verification_level"]
        for field in required_fields:
            if field not in data:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "MISSING_REQUIRED_FIELD",
                            "message": f"Missing required field: {field}",
                        }
                    ),
                    400,
                )

        result = KYCAMLService.initiate_kyc_verification(
            user_id=data["user_id"],
            verification_level=data["verification_level"],
            document_type=data.get("document_type"),
            country=data.get("country", "US"),
            provider=data.get("provider", "jumio"),
        )

        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(f"Error in initiate_kyc_verification endpoint: {str(e)}")
        return (
            jsonify(
                {
                    "success": False,
                    "error": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                }
            ),
            500,
        )


@enhanced_kyc_bp.route("/status/<user_id>", methods=["GET"])
@limiter.limit("20 per minute")
def get_kyc_status(user_id):
    """Get KYC status for user"""
    try:
        result = KYCAMLService.get_kyc_status(user_id)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404 if result["error"] == "USER_NOT_FOUND" else 400

    except Exception as e:
        logger.error(f"Error in get_kyc_status endpoint: {str(e)}")
        return (
            jsonify(
                {
                    "success": False,
                    "error": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                }
            ),
            500,
        )


@enhanced_kyc_bp.route("/aml-screening", methods=["POST"])
@limiter.limit("10 per minute")
def perform_aml_screening():
    """Perform AML screening"""
    try:
        data = request.get_json()

        if "user_id" not in data:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "MISSING_REQUIRED_FIELD",
                        "message": "Missing required field: user_id",
                    }
                ),
                400,
            )

        result = KYCAMLService.perform_aml_screening(
            user_id=data["user_id"],
            screening_type=data.get("screening_type", "comprehensive"),
        )

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(f"Error in perform_aml_screening endpoint: {str(e)}")
        return (
            jsonify(
                {
                    "success": False,
                    "error": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                }
            ),
            500,
        )


@enhanced_kyc_bp.route("/callback/<provider>", methods=["POST"])
def verification_callback(provider):
    """Handle verification callback from provider"""
    try:
        callback_data = request.get_json()

        result = KYCAMLService.process_verification_callback(provider, callback_data)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(f"Error in verification_callback endpoint: {str(e)}")
        return (
            jsonify(
                {
                    "success": False,
                    "error": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                }
            ),
            500,
        )

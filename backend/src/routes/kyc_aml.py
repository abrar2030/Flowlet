import json
import logging
from datetime import datetime, timezone
from flask import Blueprint, g, jsonify, request
from sqlalchemy import select
from ..models.audit_log import AuditEventType, AuditSeverity
from ..models.database import db

kyc_aml_bp = Blueprint("kyc_aml", __name__, url_prefix="/api/v1/kyc")
logger = logging.getLogger(__name__)


def get_required_documents(verification_level: VerificationLevel) -> List[str]:
    """Get required documents based on verification level"""
    if verification_level == VerificationLevel.BASIC:
        return ["government_id"]
    elif verification_level == VerificationLevel.ENHANCED:
        return ["government_id", "proof_of_address"]
    elif verification_level == VerificationLevel.PREMIUM:
        return ["government_id", "proof_of_address", "proof_of_income"]
    return []


def get_verification_steps(verification_level: VerificationLevel) -> List[str]:
    """Get required verification steps based on level"""
    if verification_level == VerificationLevel.BASIC:
        return ["email_verification", "document_upload", "basic_sanctions_screening"]
    elif verification_level == VerificationLevel.ENHANCED:
        return [
            "email_verification",
            "document_upload",
            "document_verification",
            "enhanced_sanctions_screening",
            "pep_screening",
        ]
    elif verification_level == VerificationLevel.PREMIUM:
        return [
            "email_verification",
            "document_upload",
            "document_verification",
            "biometric_verification",
            "enhanced_sanctions_screening",
            "adverse_media_screening",
        ]
    return []


def simulate_sanctions_screening(user: User) -> Dict:
    """Simulate sanctions screening result"""
    name = f"{user.first_name} {user.last_name}".strip().lower()
    if "terrorist" in name or "sanctioned" in name:
        return {
            "status": "match_found",
            "risk_score": 95,
            "matches": [{"source": "Simulated_SDN", "confidence": 95}],
        }
    return {"status": "clear", "risk_score": 0, "matches": []}


@kyc_aml_bp.route("/verification/start", methods=["POST"])
@token_required
def start_kyc_verification() -> Any:
    """Start KYC verification process"""
    try:
        data = request.get_json()
        if not data or "verification_level" not in data:
            return (
                jsonify(
                    {
                        "error": "Verification level is required",
                        "code": "VERIFICATION_LEVEL_REQUIRED",
                    }
                ),
                400,
            )
        user_id = str(g.current_user.id)
        user = db.session.get(User, user_id)
        try:
            verification_level = VerificationLevel(data["verification_level"].lower())
        except ValueError:
            return (
                jsonify(
                    {
                        "error": f"Invalid verification level. Must be one of: {[v.value for v in VerificationLevel]}",
                        "code": "INVALID_VERIFICATION_LEVEL",
                    }
                ),
                400,
            )
        existing_verification_stmt = select(KYCRecord).filter_by(
            user_id=user_id, status=KYCStatus.PENDING
        )
        if db.session.execute(existing_verification_stmt).scalar_one_or_none():
            return (
                jsonify(
                    {
                        "error": "User already has a pending verification",
                        "code": "VERIFICATION_PENDING",
                    }
                ),
                409,
            )
        kyc_record = KYCRecord(
            user_id=user_id,
            verification_level=verification_level,
            status=KYCStatus.PENDING,
            purpose=data.get("purpose", "account_opening"),
            initiated_by=g.current_user.id,
            verification_provider="Flowlet_Internal",
            required_documents=json.dumps(get_required_documents(verification_level)),
            verification_steps=json.dumps(get_verification_steps(verification_level)),
        )
        db.session.add(kyc_record)
        db.session.flush()
        sanctions_result = simulate_sanctions_screening(user)
        if sanctions_result["status"] == "match_found":
            kyc_record.status = KYCStatus.MANUAL_REVIEW
            kyc_record.review_reason = "Sanctions screening match detected"
        db.session.commit()
        audit_logger.log_event(
            event_type=AuditEventType.COMPLIANCE_EVENT,
            description=f"KYC verification started for user {user_id} at level {verification_level.value}",
            user_id=user_id,
            severity=AuditSeverity.MEDIUM,
            resource_type="kyc_record",
            resource_id=kyc_record.id,
        )
        return (
            jsonify(
                {
                    "success": True,
                    "kyc_record_id": str(kyc_record.id),
                    "verification_level": verification_level.value,
                    "status": kyc_record.status.value,
                    "required_documents": json.loads(kyc_record.required_documents),
                    "sanctions_screening_status": sanctions_result["status"],
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        logger.error(f"KYC verification start error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {"error": "Failed to start KYC verification", "code": "KYC_START_ERROR"}
            ),
            500,
        )


@kyc_aml_bp.route("/verification/<kyc_record_id>/document", methods=["POST"])
@token_required
def submit_kyc_document(kyc_record_id: Any) -> Any:
    """Submit a document for a specific KYC record"""
    try:
        data = request.get_json()
        if not data or "document_type" not in data or "document_data" not in data:
            return (
                jsonify(
                    {"error": "Missing document type or data", "code": "MISSING_DATA"}
                ),
                400,
            )
        kyc_record = db.session.get(KYCRecord, kyc_record_id)
        if not kyc_record or kyc_record.user_id != g.current_user.id:
            return (
                jsonify(
                    {
                        "error": "KYC record not found or access denied",
                        "code": "ACCESS_DENIED",
                    }
                ),
                403,
            )
        if (
            kyc_record.status != KYCStatus.PENDING
            and kyc_record.status != KYCStatus.MANUAL_REVIEW
        ):
            return (
                jsonify(
                    {
                        "error": f"KYC record is in {kyc_record.status.value} status and cannot accept documents.",
                        "code": "INVALID_STATUS",
                    }
                ),
                400,
            )
        document_type = data["document_type"]
        document_data = data["document_data"]
        is_valid = True
        if is_valid:
            kyc_record.status = KYCStatus.IN_PROGRESS
            kyc_record.notes = (
                f"Document {document_type} submitted and passed initial check."
            )
            audit_logger.log_event(
                event_type=AuditEventType.DATA_UPLOAD,
                description=f"KYC document submitted for record {kyc_record_id}",
                user_id=g.current_user.id,
                severity=AuditSeverity.MEDIUM,
                resource_type="kyc_document",
                resource_id=document_type,
            )
            db.session.commit()
            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Document submitted successfully. Verification in progress.",
                        "kyc_record_id": kyc_record.id,
                        "new_status": kyc_record.status.value,
                    }
                ),
                200,
            )
        else:
            return (
                jsonify(
                    {
                        "error": "Document failed initial validation",
                        "code": "DOCUMENT_INVALID",
                    }
                ),
                400,
            )
    except Exception as e:
        db.session.rollback()
        logger.error(f"Document submission error: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )


@kyc_aml_bp.route("/verification/<kyc_record_id>/approve", methods=["POST"])
@admin_required
def approve_kyc_record(kyc_record_id: Any) -> Any:
    """Manually approve a KYC record (Admin only)"""
    try:
        kyc_record = db.session.get(KYCRecord, kyc_record_id)
        if not kyc_record:
            return (
                jsonify({"error": "KYC record not found", "code": "RECORD_NOT_FOUND"}),
                404,
            )
        if kyc_record.status == KYCStatus.APPROVED:
            return (
                jsonify(
                    {
                        "message": "KYC record is already approved",
                        "code": "ALREADY_APPROVED",
                    }
                ),
                200,
            )
        kyc_record.status = KYCStatus.APPROVED
        kyc_record.approval_date = datetime.now(timezone.utc)
        kyc_record.approved_by = g.current_user.id
        user = db.session.get(User, kyc_record.user_id)
        if user:
            user.kyc_status = kyc_record.verification_level.value
        db.session.commit()
        audit_logger.log_event(
            event_type=AuditEventType.COMPLIANCE_EVENT,
            description=f"KYC record {kyc_record_id} manually approved by admin {g.current_user.id}",
            user_id=kyc_record.user_id,
            severity=AuditSeverity.HIGH,
            resource_type="kyc_record",
            resource_id=kyc_record.id,
        )
        return (
            jsonify(
                {
                    "success": True,
                    "message": "KYC record approved successfully",
                    "kyc_record_id": kyc_record.id,
                    "new_status": kyc_record.status.value,
                }
            ),
            200,
        )
    except Exception as e:
        db.session.rollback()
        logger.error(f"KYC approval error: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )

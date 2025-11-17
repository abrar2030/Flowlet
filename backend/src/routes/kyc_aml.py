"""
Enhanced KYC/AML Compliance System with Financial-Grade Features
"""

import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from functools import wraps

from flask import Blueprint, g, jsonify, request
from src.models.account import Account
from src.models.aml import (AMLRecord, SanctionsCheck, SuspiciousActivity,
                            TransactionMonitoring)
from src.models.database import User, db
from src.models.kyc import (DocumentType, KYCRecord, KYCStatus, RiskLevel,
                            VerificationLevel)
from src.routes.auth import admin_required, token_required
from src.security.audit_logger import AuditLogger
from src.security.document_verifier import DocumentVerifier
from src.security.input_validator import InputValidator
from src.security.sanctions_screener import SanctionsScreener

# Create blueprint
kyc_aml_bp = Blueprint("kyc_aml", __name__, url_prefix="/api/v1/kyc")

# Configure logging
logger = logging.getLogger(__name__)

# Initialize security components
audit_logger = AuditLogger()
input_validator = InputValidator()
document_verifier = DocumentVerifier()
sanctions_screener = SanctionsScreener()


def compliance_access_required(f):
    """Decorator to ensure user has access to compliance data"""

    @wraps(f)
    @token_required
    def decorated(user_id, *args, **kwargs):
        current_user = g.current_user

        # Check if user is accessing their own data or is admin/compliance officer
        if (
            str(current_user.id) != user_id
            and not current_user.is_admin
            and not current_user.is_compliance_officer
        ):
            audit_logger.log_security_event(
                event_type="unauthorized_compliance_access",
                details={
                    "user_id": current_user.id,
                    "target_user_id": user_id,
                    "ip": request.remote_addr,
                },
            )
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        return f(user_id, *args, **kwargs)

    return decorated


@kyc_aml_bp.route("/verification/start", methods=["POST"])
@token_required
def start_kyc_verification():
    """
    Start KYC verification process

    Expected JSON payload:
    {
        "user_id": "string" (optional, defaults to current user),
        "verification_level": "basic|enhanced|premium",
        "purpose": "account_opening|transaction_limit_increase|compliance_review"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return (
                jsonify(
                    {
                        "error": "Request body must contain valid JSON",
                        "code": "INVALID_JSON",
                    }
                ),
                400,
            )

        # Determine target user
        user_id = data.get("user_id", str(g.current_user.id))

        # Check access permissions
        if str(g.current_user.id) != user_id and not g.current_user.is_admin:
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found", "code": "USER_NOT_FOUND"}), 404

        # Validate verification level
        if "verification_level" not in data:
            return (
                jsonify(
                    {
                        "error": "Verification level is required",
                        "code": "VERIFICATION_LEVEL_REQUIRED",
                    }
                ),
                400,
            )

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

        # Check if there's already a pending verification
        existing_verification = KYCRecord.query.filter_by(
            user_id=user_id, status=KYCStatus.PENDING
        ).first()

        if existing_verification:
            return (
                jsonify(
                    {
                        "error": "User already has a pending verification",
                        "code": "VERIFICATION_PENDING",
                        "existing_verification_id": str(existing_verification.id),
                    }
                ),
                409,
            )

        # Check if user already has sufficient verification level
        current_kyc = (
            KYCRecord.query.filter_by(user_id=user_id, status=KYCStatus.APPROVED)
            .order_by(KYCRecord.created_at.desc())
            .first()
        )

        if (
            current_kyc
            and current_kyc.verification_level.value >= verification_level.value
        ):
            return (
                jsonify(
                    {
                        "error": "User already has sufficient verification level",
                        "code": "SUFFICIENT_VERIFICATION",
                        "current_level": current_kyc.verification_level.value,
                    }
                ),
                400,
            )

        # Create new KYC record
        kyc_record = KYCRecord(
            user_id=user_id,
            verification_level=verification_level,
            status=KYCStatus.PENDING,
            purpose=data.get("purpose", "account_opening"),
            initiated_by=g.current_user.id,
            verification_provider="Flowlet_Enhanced_KYC",
            required_documents=json.dumps(get_required_documents(verification_level)),
            verification_steps=json.dumps(get_verification_steps(verification_level)),
        )

        db.session.add(kyc_record)
        db.session.flush()  # Get the record ID

        # Perform initial sanctions screening
        sanctions_result = sanctions_screener.screen_individual(
            first_name=user.first_name,
            last_name=user.last_name,
            date_of_birth=user.date_of_birth,
            country=user.address_country,
        )

        # Create sanctions check record
        sanctions_check = SanctionsCheck(
            kyc_record_id=kyc_record.id,
            user_id=user_id,
            screening_provider="Flowlet_Sanctions_DB",
            screening_result=sanctions_result["status"],
            match_details=json.dumps(sanctions_result.get("matches", [])),
            risk_score=sanctions_result.get("risk_score", 0),
        )

        db.session.add(sanctions_check)

        # If sanctions match found, flag for manual review
        if sanctions_result["status"] == "match_found":
            kyc_record.status = KYCStatus.MANUAL_REVIEW
            kyc_record.review_reason = "Sanctions screening match detected"

        db.session.commit()

        # Log KYC initiation
        audit_logger.log_compliance_event(
            user_id=user_id,
            event_type="kyc_verification_started",
            details={
                "kyc_record_id": str(kyc_record.id),
                "verification_level": verification_level.value,
                "purpose": kyc_record.purpose,
                "initiated_by": g.current_user.id,
                "sanctions_result": sanctions_result["status"],
            },
        )

        return (
            jsonify(
                {
                    "success": True,
                    "kyc_record_id": str(kyc_record.id),
                    "user_id": user_id,
                    "verification_level": verification_level.value,
                    "status": kyc_record.status.value,
                    "required_documents": json.loads(kyc_record.required_documents),
                    "verification_steps": json.loads(kyc_record.verification_steps),
                    "sanctions_screening": {
                        "status": sanctions_result["status"],
                        "risk_score": sanctions_result.get("risk_score", 0),
                    },
                    "estimated_completion_time": get_estimated_completion_time(
                        verification_level
                    ),
                    "created_at": kyc_record.created_at.isoformat(),
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"KYC verification start error: {str(e)}")
        return (
            jsonify(
                {"error": "Failed to start KYC verification", "code": "KYC_START_ERROR"}
            ),
            500,
        )


def get_required_documents(verification_level):
    """Get required documents based on verification level"""
    documents = {
        VerificationLevel.BASIC: ["government_id"],
        VerificationLevel.ENHANCED: ["government_id", "proof_of_address"],
        VerificationLevel.PREMIUM: [
            "government_id",
            "proof_of_address",
            "proof_of_income",
            "bank_statement",
        ],
    }
    return documents.get(verification_level, [])


def get_verification_steps(verification_level):
    """Get required verification steps based on level"""
    steps = {
        VerificationLevel.BASIC: [
            "email_verification",
            "phone_verification",
            "document_upload",
            "basic_sanctions_screening",
        ],
        VerificationLevel.ENHANCED: [
            "email_verification",
            "phone_verification",
            "document_upload",
            "document_verification",
            "address_verification",
            "enhanced_sanctions_screening",
            "pep_screening",
        ],
        VerificationLevel.PREMIUM: [
            "email_verification",
            "phone_verification",
            "document_upload",
            "document_verification",
            "biometric_verification",
            "address_verification",
            "income_verification",
            "enhanced_sanctions_screening",
            "pep_screening",
            "adverse_media_screening",
            "source_of_funds_verification",
        ],
    }
    return steps.get(verification_level, [])


def get_estimated_completion_time(verification_level):
    """Get estimated completion time based on verification level"""
    times = {
        VerificationLevel.BASIC: "1-2 business days",
        VerificationLevel.ENHANCED: "3-5 business days",
        VerificationLevel.PREMIUM: "5-10 business days",
    }
    return times.get(verification_level, "1-2 business days")


@kyc_aml_bp.route("/verification/<kyc_record_id>/document", methods=["POST"])
@token_required
def submit_kyc_document(kyc_record_id):
    """
    Submit document for KYC verification

    Expected JSON payload:
    {
        "document_type": "government_id|proof_of_address|proof_of_income|bank_statement",
        "document_subtype": "passport|drivers_license|national_id|utility_bill|etc",
        "document_number": "string",
        "issuing_country": "string",
        "expiry_date": "YYYY-MM-DD" (optional),
        "document_data": "base64_encoded_image_or_pdf"
    }
    """
    try:
        kyc_record = KYCRecord.query.get(kyc_record_id)
        if not kyc_record:
            return (
                jsonify(
                    {"error": "KYC record not found", "code": "KYC_RECORD_NOT_FOUND"}
                ),
                404,
            )

        # Check access permissions
        if (
            str(g.current_user.id) != str(kyc_record.user_id)
            and not g.current_user.is_admin
        ):
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        if kyc_record.status not in [KYCStatus.PENDING, KYCStatus.DOCUMENTS_REQUIRED]:
            return (
                jsonify(
                    {
                        "error": "KYC record is not accepting documents",
                        "code": "INVALID_KYC_STATUS",
                    }
                ),
                400,
            )

        data = request.get_json()
        if not data:
            return (
                jsonify(
                    {
                        "error": "Request body must contain valid JSON",
                        "code": "INVALID_JSON",
                    }
                ),
                400,
            )

        # Validate required fields
        required_fields = [
            "document_type",
            "document_subtype",
            "document_number",
            "issuing_country",
            "document_data",
        ]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return (
                jsonify(
                    {
                        "error": f'Missing required fields: {", ".join(missing_fields)}',
                        "code": "MISSING_FIELDS",
                    }
                ),
                400,
            )

        # Validate document type
        try:
            document_type = DocumentType(data["document_type"].lower())
        except ValueError:
            return (
                jsonify(
                    {
                        "error": f"Invalid document type. Must be one of: {[d.value for d in DocumentType]}",
                        "code": "INVALID_DOCUMENT_TYPE",
                    }
                ),
                400,
            )

        # Validate expiry date if provided
        expiry_date = None
        if "expiry_date" in data and data["expiry_date"]:
            try:
                expiry_date = datetime.strptime(data["expiry_date"], "%Y-%m-%d").date()
                if expiry_date <= datetime.now().date():
                    return (
                        jsonify(
                            {
                                "error": "Document has expired",
                                "code": "DOCUMENT_EXPIRED",
                            }
                        ),
                        400,
                    )
            except ValueError:
                return (
                    jsonify(
                        {
                            "error": "Invalid expiry date format. Use YYYY-MM-DD",
                            "code": "INVALID_DATE_FORMAT",
                        }
                    ),
                    400,
                )

        # Verify document using AI/ML service
        verification_result = document_verifier.verify_document(
            document_type=document_type,
            document_subtype=data["document_subtype"],
            document_data=data["document_data"],
            user_info={
                "first_name": kyc_record.user.first_name,
                "last_name": kyc_record.user.last_name,
                "date_of_birth": kyc_record.user.date_of_birth,
            },
        )

        # Create document record
        from src.models.kyc import KYCDocument

        document_record = KYCDocument(
            kyc_record_id=kyc_record.id,
            document_type=document_type,
            document_subtype=data["document_subtype"],
            document_number=data["document_number"],
            issuing_country=data["issuing_country"],
            expiry_date=expiry_date,
            verification_status=verification_result["status"],
            verification_confidence=verification_result.get("confidence", 0),
            verification_details=json.dumps(verification_result.get("details", {})),
            extracted_data=json.dumps(verification_result.get("extracted_data", {})),
        )

        db.session.add(document_record)

        # Update KYC record status based on document verification
        if verification_result["status"] == "verified":
            # Check if all required documents are submitted and verified
            required_docs = json.loads(kyc_record.required_documents)
            submitted_docs = [
                doc.document_type.value
                for doc in kyc_record.documents
                if doc.verification_status == "verified"
            ]

            if all(doc_type in submitted_docs for doc_type in required_docs):
                kyc_record.status = KYCStatus.UNDER_REVIEW
                kyc_record.documents_submitted_at = datetime.now(timezone.utc)
        elif verification_result["status"] == "failed":
            kyc_record.status = KYCStatus.DOCUMENTS_REQUIRED
            kyc_record.review_reason = f'Document verification failed: {verification_result.get("reason", "Unknown")}'

        kyc_record.updated_at = datetime.now(timezone.utc)
        db.session.commit()

        # Log document submission
        audit_logger.log_compliance_event(
            user_id=kyc_record.user_id,
            event_type="kyc_document_submitted",
            details={
                "kyc_record_id": str(kyc_record.id),
                "document_type": document_type.value,
                "document_subtype": data["document_subtype"],
                "verification_status": verification_result["status"],
                "confidence": verification_result.get("confidence", 0),
            },
        )

        return (
            jsonify(
                {
                    "success": True,
                    "document_id": str(document_record.id),
                    "kyc_record_id": str(kyc_record.id),
                    "document_type": document_type.value,
                    "verification_status": verification_result["status"],
                    "verification_confidence": verification_result.get("confidence", 0),
                    "kyc_status": kyc_record.status.value,
                    "extracted_data": verification_result.get("extracted_data", {}),
                    "next_steps": get_next_steps(kyc_record),
                    "submitted_at": document_record.created_at.isoformat(),
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Document submission error: {str(e)}")
        return (
            jsonify(
                {
                    "error": "Failed to submit document",
                    "code": "DOCUMENT_SUBMISSION_ERROR",
                }
            ),
            500,
        )


def get_next_steps(kyc_record):
    """Get next steps for KYC completion"""
    if kyc_record.status == KYCStatus.DOCUMENTS_REQUIRED:
        required_docs = json.loads(kyc_record.required_documents)
        submitted_docs = [
            doc.document_type.value
            for doc in kyc_record.documents
            if doc.verification_status == "verified"
        ]
        missing_docs = [doc for doc in required_docs if doc not in submitted_docs]

        if missing_docs:
            return [f'Submit {doc.replace("_", " ")} document' for doc in missing_docs]

    elif kyc_record.status == KYCStatus.UNDER_REVIEW:
        return ["Wait for manual review to complete"]

    elif kyc_record.status == KYCStatus.MANUAL_REVIEW:
        return ["Additional verification required - compliance team will contact you"]

    return ["No further action required"]


@kyc_aml_bp.route("/verification/<kyc_record_id>/complete", methods=["POST"])
@admin_required
def complete_kyc_verification(kyc_record_id):
    """
    Complete KYC verification (Admin/Compliance only)

    Expected JSON payload:
    {
        "decision": "approve|reject|require_additional_info",
        "risk_level": "low|medium|high|very_high",
        "notes": "string",
        "additional_requirements": [] (optional)
    }
    """
    try:
        kyc_record = KYCRecord.query.get(kyc_record_id)
        if not kyc_record:
            return (
                jsonify(
                    {"error": "KYC record not found", "code": "KYC_RECORD_NOT_FOUND"}
                ),
                404,
            )

        if kyc_record.status not in [KYCStatus.UNDER_REVIEW, KYCStatus.MANUAL_REVIEW]:
            return (
                jsonify(
                    {
                        "error": "KYC record is not ready for completion",
                        "code": "INVALID_KYC_STATUS",
                    }
                ),
                400,
            )

        data = request.get_json()
        if not data:
            return (
                jsonify(
                    {
                        "error": "Request body must contain valid JSON",
                        "code": "INVALID_JSON",
                    }
                ),
                400,
            )

        # Validate required fields
        if "decision" not in data:
            return (
                jsonify({"error": "Decision is required", "code": "DECISION_REQUIRED"}),
                400,
            )

        decision = data["decision"].lower()
        if decision not in ["approve", "reject", "require_additional_info"]:
            return (
                jsonify(
                    {
                        "error": "Invalid decision. Must be approve, reject, or require_additional_info",
                        "code": "INVALID_DECISION",
                    }
                ),
                400,
            )

        # Validate risk level
        if "risk_level" in data:
            try:
                risk_level = RiskLevel(data["risk_level"].lower())
            except ValueError:
                return (
                    jsonify(
                        {
                            "error": f"Invalid risk level. Must be one of: {[r.value for r in RiskLevel]}",
                            "code": "INVALID_RISK_LEVEL",
                        }
                    ),
                    400,
                )
        else:
            risk_level = RiskLevel.MEDIUM  # Default

        # Update KYC record based on decision
        if decision == "approve":
            kyc_record.status = KYCStatus.APPROVED
            kyc_record.approved_at = datetime.now(timezone.utc)
            kyc_record.approved_by = g.current_user.id

            # Update user KYC status
            user = kyc_record.user
            user.kyc_status = "verified"
            user.kyc_level = kyc_record.verification_level.value
            user.risk_level = risk_level.value
            user.updated_at = datetime.now(timezone.utc)

        elif decision == "reject":
            kyc_record.status = KYCStatus.REJECTED
            kyc_record.rejected_at = datetime.now(timezone.utc)
            kyc_record.rejected_by = g.current_user.id

            # Update user KYC status
            user = kyc_record.user
            user.kyc_status = "rejected"
            user.updated_at = datetime.now(timezone.utc)

        elif decision == "require_additional_info":
            kyc_record.status = KYCStatus.ADDITIONAL_INFO_REQUIRED
            kyc_record.additional_requirements = json.dumps(
                data.get("additional_requirements", [])
            )

        kyc_record.risk_level = risk_level
        kyc_record.review_notes = data.get("notes", "")
        kyc_record.reviewed_by = g.current_user.id
        kyc_record.reviewed_at = datetime.now(timezone.utc)
        kyc_record.updated_at = datetime.now(timezone.utc)

        # Calculate final risk score
        kyc_record.final_risk_score = calculate_comprehensive_risk_score(kyc_record)

        db.session.commit()

        # Log KYC completion
        audit_logger.log_compliance_event(
            user_id=kyc_record.user_id,
            event_type="kyc_verification_completed",
            details={
                "kyc_record_id": str(kyc_record.id),
                "decision": decision,
                "risk_level": risk_level.value,
                "final_risk_score": kyc_record.final_risk_score,
                "reviewed_by": g.current_user.id,
            },
        )

        # Send notification to user (implement notification service)
        # notification_service.send_kyc_result_notification(kyc_record)

        return (
            jsonify(
                {
                    "success": True,
                    "kyc_record_id": str(kyc_record.id),
                    "user_id": str(kyc_record.user_id),
                    "decision": decision,
                    "status": kyc_record.status.value,
                    "risk_level": risk_level.value,
                    "final_risk_score": kyc_record.final_risk_score,
                    "verification_level": kyc_record.verification_level.value,
                    "completed_at": kyc_record.reviewed_at.isoformat(),
                    "notes": kyc_record.review_notes,
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"KYC completion error: {str(e)}")
        return (
            jsonify(
                {
                    "error": "Failed to complete KYC verification",
                    "code": "KYC_COMPLETION_ERROR",
                }
            ),
            500,
        )


def calculate_comprehensive_risk_score(kyc_record):
    """Calculate comprehensive risk score based on all available data"""
    risk_score = 0

    # Base risk from sanctions screening
    sanctions_checks = SanctionsCheck.query.filter_by(kyc_record_id=kyc_record.id).all()
    for check in sanctions_checks:
        risk_score += check.risk_score

    # Document verification confidence
    for document in kyc_record.documents:
        if document.verification_confidence < 0.8:
            risk_score += 20
        elif document.verification_confidence < 0.9:
            risk_score += 10

    # User profile factors
    user = kyc_record.user

    # Age factor
    if user.date_of_birth:
        age = (datetime.now().date() - user.date_of_birth).days // 365
        if age < 18:
            risk_score += 50
        elif age < 25:
            risk_score += 15
        elif age > 80:
            risk_score += 10

    # Address verification
    if not user.address_country:
        risk_score += 25
    elif user.address_country in [
        "US",
        "CA",
        "GB",
        "AU",
        "DE",
        "FR",
    ]:  # Low-risk countries
        risk_score -= 5

    # Verification level adjustment
    if kyc_record.verification_level == VerificationLevel.PREMIUM:
        risk_score -= 10
    elif kyc_record.verification_level == VerificationLevel.BASIC:
        risk_score += 10

    # Ensure score is between 0 and 100
    return max(0, min(100, risk_score))


@kyc_aml_bp.route("/verification/<kyc_record_id>", methods=["GET"])
@compliance_access_required
def get_kyc_verification_status(kyc_record_id):
    """Get KYC verification status and details"""
    try:
        kyc_record = KYCRecord.query.get(kyc_record_id)
        if not kyc_record:
            return (
                jsonify(
                    {"error": "KYC record not found", "code": "KYC_RECORD_NOT_FOUND"}
                ),
                404,
            )

        # Get documents
        documents = []
        for doc in kyc_record.documents:
            documents.append(
                {
                    "id": str(doc.id),
                    "document_type": doc.document_type.value,
                    "document_subtype": doc.document_subtype,
                    "verification_status": doc.verification_status,
                    "verification_confidence": doc.verification_confidence,
                    "submitted_at": doc.created_at.isoformat(),
                }
            )

        # Get sanctions checks
        sanctions_checks = []
        for check in kyc_record.sanctions_checks:
            sanctions_checks.append(
                {
                    "id": str(check.id),
                    "screening_result": check.screening_result,
                    "risk_score": check.risk_score,
                    "screening_date": check.created_at.isoformat(),
                }
            )

        return (
            jsonify(
                {
                    "success": True,
                    "kyc_record": {
                        "id": str(kyc_record.id),
                        "user_id": str(kyc_record.user_id),
                        "verification_level": kyc_record.verification_level.value,
                        "status": kyc_record.status.value,
                        "risk_level": (
                            kyc_record.risk_level.value
                            if kyc_record.risk_level
                            else None
                        ),
                        "final_risk_score": kyc_record.final_risk_score,
                        "purpose": kyc_record.purpose,
                        "verification_provider": kyc_record.verification_provider,
                        "required_documents": json.loads(kyc_record.required_documents),
                        "verification_steps": json.loads(kyc_record.verification_steps),
                        "review_notes": kyc_record.review_notes,
                        "created_at": kyc_record.created_at.isoformat(),
                        "updated_at": kyc_record.updated_at.isoformat(),
                        "approved_at": (
                            kyc_record.approved_at.isoformat()
                            if kyc_record.approved_at
                            else None
                        ),
                        "rejected_at": (
                            kyc_record.rejected_at.isoformat()
                            if kyc_record.rejected_at
                            else None
                        ),
                    },
                    "documents": documents,
                    "sanctions_checks": sanctions_checks,
                    "next_steps": get_next_steps(kyc_record),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get KYC verification error: {str(e)}")
        return (
            jsonify(
                {
                    "error": "Failed to retrieve KYC verification",
                    "code": "GET_KYC_ERROR",
                }
            ),
            500,
        )


@kyc_aml_bp.route("/user/<user_id>/verifications", methods=["GET"])
@compliance_access_required
def get_user_kyc_history(user_id):
    """Get all KYC verification records for a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found", "code": "USER_NOT_FOUND"}), 404

        # Get query parameters
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)

        # Query KYC records with pagination
        kyc_records = (
            KYCRecord.query.filter_by(user_id=user_id)
            .order_by(KYCRecord.created_at.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )

        verification_list = []
        for record in kyc_records.items:
            verification_data = {
                "id": str(record.id),
                "verification_level": record.verification_level.value,
                "status": record.status.value,
                "risk_level": record.risk_level.value if record.risk_level else None,
                "final_risk_score": record.final_risk_score,
                "purpose": record.purpose,
                "created_at": record.created_at.isoformat(),
                "approved_at": (
                    record.approved_at.isoformat() if record.approved_at else None
                ),
                "rejected_at": (
                    record.rejected_at.isoformat() if record.rejected_at else None
                ),
            }
            verification_list.append(verification_data)

        return (
            jsonify(
                {
                    "success": True,
                    "user_id": user_id,
                    "current_kyc_status": user.kyc_status,
                    "current_kyc_level": user.kyc_level,
                    "current_risk_level": user.risk_level,
                    "verifications": verification_list,
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": kyc_records.total,
                        "pages": kyc_records.pages,
                        "has_next": kyc_records.has_next,
                        "has_prev": kyc_records.has_prev,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get user KYC history error: {str(e)}")
        return (
            jsonify(
                {
                    "error": "Failed to retrieve user KYC history",
                    "code": "GET_KYC_HISTORY_ERROR",
                }
            ),
            500,
        )


@kyc_aml_bp.route("/aml/screening", methods=["POST"])
@admin_required
def perform_aml_screening():
    """
    Perform AML screening on a user

    Expected JSON payload:
    {
        "user_id": "string",
        "screening_type": "sanctions|pep|adverse_media|all",
        "reason": "string"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return (
                jsonify(
                    {
                        "error": "Request body must contain valid JSON",
                        "code": "INVALID_JSON",
                    }
                ),
                400,
            )

        # Validate required fields
        required_fields = ["user_id", "screening_type"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return (
                jsonify(
                    {
                        "error": f'Missing required fields: {", ".join(missing_fields)}',
                        "code": "MISSING_FIELDS",
                    }
                ),
                400,
            )

        user = User.query.get(data["user_id"])
        if not user:
            return jsonify({"error": "User not found", "code": "USER_NOT_FOUND"}), 404

        screening_type = data["screening_type"].lower()
        if screening_type not in ["sanctions", "pep", "adverse_media", "all"]:
            return (
                jsonify(
                    {
                        "error": "Invalid screening type",
                        "code": "INVALID_SCREENING_TYPE",
                    }
                ),
                400,
            )

        # Perform screening
        screening_results = {}

        if screening_type in ["sanctions", "all"]:
            sanctions_result = sanctions_screener.screen_individual(
                first_name=user.first_name,
                last_name=user.last_name,
                date_of_birth=user.date_of_birth,
                country=user.address_country,
            )
            screening_results["sanctions"] = sanctions_result

        if screening_type in ["pep", "all"]:
            pep_result = sanctions_screener.screen_pep(
                first_name=user.first_name,
                last_name=user.last_name,
                country=user.address_country,
            )
            screening_results["pep"] = pep_result

        if screening_type in ["adverse_media", "all"]:
            media_result = sanctions_screener.screen_adverse_media(
                first_name=user.first_name, last_name=user.last_name
            )
            screening_results["adverse_media"] = media_result

        # Create AML record
        aml_record = AMLRecord(
            user_id=user.id,
            screening_type=screening_type,
            screening_results=json.dumps(screening_results),
            screening_reason=data.get("reason", "Routine AML screening"),
            initiated_by=g.current_user.id,
            overall_risk_score=calculate_aml_risk_score(screening_results),
        )

        db.session.add(aml_record)
        db.session.commit()

        # Log AML screening
        audit_logger.log_compliance_event(
            user_id=user.id,
            event_type="aml_screening_performed",
            details={
                "aml_record_id": str(aml_record.id),
                "screening_type": screening_type,
                "overall_risk_score": aml_record.overall_risk_score,
                "initiated_by": g.current_user.id,
            },
        )

        return (
            jsonify(
                {
                    "success": True,
                    "aml_record_id": str(aml_record.id),
                    "user_id": str(user.id),
                    "screening_type": screening_type,
                    "screening_results": screening_results,
                    "overall_risk_score": aml_record.overall_risk_score,
                    "screening_date": aml_record.created_at.isoformat(),
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"AML screening error: {str(e)}")
        return (
            jsonify(
                {
                    "error": "Failed to perform AML screening",
                    "code": "AML_SCREENING_ERROR",
                }
            ),
            500,
        )


def calculate_aml_risk_score(screening_results):
    """Calculate overall AML risk score from screening results"""
    risk_score = 0

    for screening_type, result in screening_results.items():
        if result.get("status") == "match_found":
            if screening_type == "sanctions":
                risk_score += 100  # Maximum risk for sanctions match
            elif screening_type == "pep":
                risk_score += 60  # High risk for PEP match
            elif screening_type == "adverse_media":
                risk_score += 40  # Medium-high risk for adverse media

        # Add risk score from individual screening
        risk_score += result.get("risk_score", 0)

    return min(100, risk_score)


@kyc_aml_bp.route("/aml/suspicious-activity", methods=["POST"])
@admin_required
def report_suspicious_activity():
    """
    Report suspicious activity (SAR filing)

    Expected JSON payload:
    {
        "user_id": "string",
        "activity_type": "unusual_transaction_pattern|structuring|money_laundering|other",
        "description": "string",
        "transaction_ids": ["string"],
        "amount_involved": "decimal",
        "currency": "string",
        "priority": "low|medium|high|critical"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return (
                jsonify(
                    {
                        "error": "Request body must contain valid JSON",
                        "code": "INVALID_JSON",
                    }
                ),
                400,
            )

        # Validate required fields
        required_fields = ["user_id", "activity_type", "description"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return (
                jsonify(
                    {
                        "error": f'Missing required fields: {", ".join(missing_fields)}',
                        "code": "MISSING_FIELDS",
                    }
                ),
                400,
            )

        user = User.query.get(data["user_id"])
        if not user:
            return jsonify({"error": "User not found", "code": "USER_NOT_FOUND"}), 404

        # Create suspicious activity record
        suspicious_activity = SuspiciousActivity(
            user_id=user.id,
            activity_type=data["activity_type"],
            description=data["description"],
            transaction_ids=json.dumps(data.get("transaction_ids", [])),
            amount_involved=Decimal(str(data.get("amount_involved", "0"))),
            currency=data.get("currency", "USD"),
            priority=data.get("priority", "medium"),
            reported_by=g.current_user.id,
            status="reported",
        )

        db.session.add(suspicious_activity)
        db.session.commit()

        # Log suspicious activity report
        audit_logger.log_compliance_event(
            user_id=user.id,
            event_type="suspicious_activity_reported",
            details={
                "sar_id": str(suspicious_activity.id),
                "activity_type": data["activity_type"],
                "priority": data.get("priority", "medium"),
                "amount_involved": float(suspicious_activity.amount_involved),
                "reported_by": g.current_user.id,
            },
        )

        # Send alert to compliance team
        # compliance_alert_service.send_sar_alert(suspicious_activity)

        return (
            jsonify(
                {
                    "success": True,
                    "sar_id": str(suspicious_activity.id),
                    "user_id": str(user.id),
                    "activity_type": data["activity_type"],
                    "status": "reported",
                    "priority": data.get("priority", "medium"),
                    "reported_at": suspicious_activity.created_at.isoformat(),
                    "message": "Suspicious activity report filed successfully",
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Suspicious activity report error: {str(e)}")
        return (
            jsonify(
                {
                    "error": "Failed to report suspicious activity",
                    "code": "SAR_REPORT_ERROR",
                }
            ),
            500,
        )


@kyc_aml_bp.route("/compliance/dashboard", methods=["GET"])
@admin_required
def get_compliance_dashboard():
    """Get compliance dashboard statistics"""
    try:
        # Get date ranges
        today = datetime.now(timezone.utc).date()
        thirty_days_ago = today - timedelta(days=30)

        # KYC statistics
        total_kyc_records = KYCRecord.query.count()
        pending_kyc = KYCRecord.query.filter_by(status=KYCStatus.PENDING).count()
        approved_kyc = KYCRecord.query.filter_by(status=KYCStatus.APPROVED).count()
        rejected_kyc = KYCRecord.query.filter_by(status=KYCStatus.REJECTED).count()
        manual_review_kyc = KYCRecord.query.filter_by(
            status=KYCStatus.MANUAL_REVIEW
        ).count()

        # Recent KYC activity
        recent_kyc = KYCRecord.query.filter(
            KYCRecord.created_at >= thirty_days_ago
        ).count()

        # AML statistics
        total_aml_screenings = AMLRecord.query.count()
        recent_aml_screenings = AMLRecord.query.filter(
            AMLRecord.created_at >= thirty_days_ago
        ).count()

        # Suspicious activity statistics
        total_sars = SuspiciousActivity.query.count()
        pending_sars = SuspiciousActivity.query.filter_by(status="reported").count()
        recent_sars = SuspiciousActivity.query.filter(
            SuspiciousActivity.created_at >= thirty_days_ago
        ).count()

        # High-risk users
        high_risk_users = User.query.filter_by(risk_level="high").count()
        very_high_risk_users = User.query.filter_by(risk_level="very_high").count()

        return (
            jsonify(
                {
                    "success": True,
                    "dashboard": {
                        "kyc_statistics": {
                            "total_records": total_kyc_records,
                            "pending": pending_kyc,
                            "approved": approved_kyc,
                            "rejected": rejected_kyc,
                            "manual_review": manual_review_kyc,
                            "recent_submissions_30d": recent_kyc,
                            "approval_rate": (
                                round((approved_kyc / total_kyc_records * 100), 2)
                                if total_kyc_records > 0
                                else 0
                            ),
                        },
                        "aml_statistics": {
                            "total_screenings": total_aml_screenings,
                            "recent_screenings_30d": recent_aml_screenings,
                        },
                        "suspicious_activity": {
                            "total_reports": total_sars,
                            "pending_reports": pending_sars,
                            "recent_reports_30d": recent_sars,
                        },
                        "risk_profile": {
                            "high_risk_users": high_risk_users,
                            "very_high_risk_users": very_high_risk_users,
                            "total_high_risk": high_risk_users + very_high_risk_users,
                        },
                    },
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Compliance dashboard error: {str(e)}")
        return (
            jsonify(
                {
                    "error": "Failed to retrieve compliance dashboard",
                    "code": "DASHBOARD_ERROR",
                }
            ),
            500,
        )

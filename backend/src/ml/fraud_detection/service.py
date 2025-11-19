"""
Fraud Detection Service
High-level service for managing fraud detection models and processing
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from . import (
    FeatureEngineer,
    FraudAlert,
    FraudDetectionError,
    FraudType,
    RiskLevel,
    TransactionFeatures,
)
from .ensemble_model import EnsembleFraudModel, RealTimeFraudDetector

logger = logging.getLogger(__name__)


class FraudDetectionService:
    """
    High-level fraud detection service
    Manages model lifecycle, training, and real-time detection
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.ensemble_model = None
        self.real_time_detector = None
        self.feature_engineer = FeatureEngineer()
        self.logger = logging.getLogger(__name__)

        # Model management
        self.model_path = config.get("model_path", "/tmp/fraud_model.joblib")
        self.auto_retrain = config.get("auto_retrain", True)
        self.retrain_threshold_days = config.get("retrain_threshold_days", 30)

        # Performance tracking
        self.performance_metrics = {
            "total_predictions": 0,
            "fraud_detected": 0,
            "false_positives": 0,
            "true_positives": 0,
            "last_retrain": None,
        }

        # Alert storage (in production, this would be a database)
        self.alerts_storage = []

        # Initialize model
        self._initialize_model()

    def _initialize_model(self):
        """Initialize the fraud detection model"""
        try:
            # Try to load existing model
            if self._model_exists():
                self.load_model()
            else:
                # Create new model with default configuration
                model_config = self.config.get(
                    "model_config", self._get_default_model_config()
                )
                self.ensemble_model = EnsembleFraudModel(model_config)
                self.logger.info("Created new fraud detection model")

            # Initialize real-time detector
            if self.ensemble_model and self.ensemble_model.is_trained:
                self.real_time_detector = RealTimeFraudDetector(self.ensemble_model)
                self.logger.info("Real-time fraud detector initialized")

        except Exception as e:
            self.logger.error(f"Model initialization failed: {str(e)}")
            raise FraudDetectionError(f"Model initialization failed: {str(e)}")

    def _get_default_model_config(self) -> Dict[str, Any]:
        """Get default model configuration"""
        return {
            "voting_strategy": "weighted",
            "anomaly_weight": 0.3,
            "supervised_weight": 0.7,
            "models": {
                "isolation_forest": {
                    "contamination": 0.1,
                    "n_estimators": 100,
                    "random_state": 42,
                },
                "xgboost": {
                    "n_estimators": 100,
                    "max_depth": 6,
                    "learning_rate": 0.1,
                    "random_state": 42,
                },
                "lightgbm": {
                    "n_estimators": 100,
                    "max_depth": -1,
                    "learning_rate": 0.1,
                    "random_state": 42,
                },
            },
        }

    def _model_exists(self) -> bool:
        """Check if a trained model exists"""
        import os

        return os.path.exists(self.model_path)

    async def train_model(
        self,
        training_data: pd.DataFrame,
        labels: Optional[pd.Series] = None,
        validation_data: Optional[Tuple[pd.DataFrame, pd.Series]] = None,
    ) -> Dict[str, Any]:
        """
        Train the fraud detection model

        Args:
            training_data: Training features
            labels: Training labels (optional for unsupervised models)
            validation_data: Validation data for performance evaluation

        Returns:
            Dict[str, Any]: Training results and metrics
        """
        try:
            self.logger.info("Starting model training")

            # Initialize model if not exists
            if not self.ensemble_model:
                model_config = self.config.get(
                    "model_config", self._get_default_model_config()
                )
                self.ensemble_model = EnsembleFraudModel(model_config)

            # Train the model
            self.ensemble_model.train(training_data, labels)

            # Initialize real-time detector
            self.real_time_detector = RealTimeFraudDetector(self.ensemble_model)

            # Evaluate model performance
            training_results = {
                "training_samples": len(training_data),
                "features": list(training_data.columns),
                "model_version": self.ensemble_model.model_version,
                "training_timestamp": self.ensemble_model.training_timestamp,
                "models_trained": list(self.ensemble_model.models.keys()),
            }

            # Add validation metrics if validation data provided
            if validation_data:
                val_features, val_labels = validation_data
                val_predictions = self.ensemble_model.predict(val_features)

                if val_labels is not None:
                    from sklearn.metrics import classification_report, roc_auc_score

                    auc_score = roc_auc_score(val_labels, val_predictions)
                    training_results["validation_auc"] = auc_score

                    # Binary classification metrics
                    val_pred_binary = (val_predictions > 0.5).astype(int)
                    report = classification_report(
                        val_labels, val_pred_binary, output_dict=True
                    )
                    training_results["classification_report"] = report

            # Save model
            self.save_model()

            # Update performance tracking
            self.performance_metrics["last_retrain"] = datetime.now()

            self.logger.info("Model training completed successfully")
            return training_results

        except Exception as e:
            self.logger.error(f"Model training failed: {str(e)}")
            raise FraudDetectionError(f"Model training failed: {str(e)}")

    async def detect_fraud(
        self,
        transaction_data: Dict[str, Any],
        user_history: Optional[pd.DataFrame] = None,
    ) -> FraudAlert:
        """
        Detect fraud for a single transaction

        Args:
            transaction_data: Transaction data dictionary
            user_history: Historical transactions for the user

        Returns:
            FraudAlert: Fraud detection result
        """
        try:
            if not self.real_time_detector:
                raise FraudDetectionError(
                    "Real-time detector not initialized. Train model first."
                )

            # Detect fraud
            alert = self.real_time_detector.detect_fraud(transaction_data, user_history)

            # Store alert
            self.alerts_storage.append(alert)

            # Update performance metrics
            self.performance_metrics["total_predictions"] += 1
            if alert.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
                self.performance_metrics["fraud_detected"] += 1

            # Log high-risk alerts
            if alert.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
                self.logger.warning(
                    f"High-risk transaction detected: {alert.transaction_id} "
                    f"(Risk: {alert.risk_level.value}, Score: {alert.risk_score:.3f})"
                )

            return alert

        except Exception as e:
            self.logger.error(f"Fraud detection failed: {str(e)}")
            raise FraudDetectionError(f"Fraud detection failed: {str(e)}")

    async def batch_detect_fraud(
        self,
        transactions: List[Dict[str, Any]],
        user_histories: Optional[Dict[str, pd.DataFrame]] = None,
    ) -> List[FraudAlert]:
        """
        Detect fraud for multiple transactions in batch

        Args:
            transactions: List of transaction data dictionaries
            user_histories: Dictionary mapping user_id to historical transactions

        Returns:
            List[FraudAlert]: List of fraud detection results
        """
        try:
            alerts = []

            for transaction in transactions:
                user_id = transaction.get("user_id")
                user_history = user_histories.get(user_id) if user_histories else None

                alert = await self.detect_fraud(transaction, user_history)
                alerts.append(alert)

            self.logger.info(
                f"Batch fraud detection completed for {len(transactions)} transactions"
            )
            return alerts

        except Exception as e:
            self.logger.error(f"Batch fraud detection failed: {str(e)}")
            raise FraudDetectionError(f"Batch fraud detection failed: {str(e)}")

    def get_model_status(self) -> Dict[str, Any]:
        """
        Get current model status and performance metrics

        Returns:
            Dict[str, Any]: Model status information
        """
        status = {
            "model_initialized": self.ensemble_model is not None,
            "model_trained": (
                self.ensemble_model.is_trained if self.ensemble_model else False
            ),
            "real_time_detector_ready": self.real_time_detector is not None,
            "performance_metrics": self.performance_metrics.copy(),
        }

        if self.ensemble_model:
            status.update(
                {
                    "model_version": self.ensemble_model.model_version,
                    "training_timestamp": self.ensemble_model.training_timestamp,
                    "feature_columns": self.ensemble_model.feature_columns,
                    "individual_models": self.ensemble_model.get_model_status(),
                }
            )

        return status

    def get_recent_alerts(
        self, hours: int = 24, risk_levels: Optional[List[RiskLevel]] = None
    ) -> List[FraudAlert]:
        """
        Get recent fraud alerts

        Args:
            hours: Number of hours to look back
            risk_levels: Filter by specific risk levels

        Returns:
            List[FraudAlert]: Recent alerts
        """
        cutoff_time = datetime.now() - timedelta(hours=hours)

        recent_alerts = [
            alert for alert in self.alerts_storage if alert.timestamp >= cutoff_time
        ]

        if risk_levels:
            recent_alerts = [
                alert for alert in recent_alerts if alert.risk_level in risk_levels
            ]

        return recent_alerts

    def get_fraud_statistics(self, hours: int = 24) -> Dict[str, Any]:
        """
        Get fraud detection statistics

        Args:
            hours: Number of hours to analyze

        Returns:
            Dict[str, Any]: Fraud statistics
        """
        recent_alerts = self.get_recent_alerts(hours)

        if not recent_alerts:
            return {
                "total_transactions": 0,
                "fraud_detected": 0,
                "fraud_rate": 0.0,
                "risk_distribution": {},
                "fraud_types": {},
            }

        # Calculate statistics
        total_transactions = len(recent_alerts)
        high_risk_alerts = [
            alert
            for alert in recent_alerts
            if alert.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
        ]
        fraud_detected = len(high_risk_alerts)
        fraud_rate = (
            fraud_detected / total_transactions if total_transactions > 0 else 0
        )

        # Risk level distribution
        risk_distribution = {}
        for level in RiskLevel:
            count = sum(1 for alert in recent_alerts if alert.risk_level == level)
            risk_distribution[level.value] = count

        # Fraud type distribution
        fraud_types = {}
        for alert in recent_alerts:
            for fraud_type in alert.fraud_types:
                fraud_types[fraud_type.value] = fraud_types.get(fraud_type.value, 0) + 1

        return {
            "total_transactions": total_transactions,
            "fraud_detected": fraud_detected,
            "fraud_rate": fraud_rate,
            "risk_distribution": risk_distribution,
            "fraud_types": fraud_types,
            "average_risk_score": np.mean(
                [alert.risk_score for alert in recent_alerts]
            ),
        }

    def save_model(self):
        """Save the trained model to disk"""
        if self.ensemble_model and self.ensemble_model.is_trained:
            self.ensemble_model.save_model(self.model_path)
            self.logger.info(f"Model saved to {self.model_path}")

    def load_model(self):
        """Load a trained model from disk"""
        try:
            model_config = self.config.get(
                "model_config", self._get_default_model_config()
            )
            self.ensemble_model = EnsembleFraudModel(model_config)
            self.ensemble_model.load_model(self.model_path)

            if self.ensemble_model.is_trained:
                self.real_time_detector = RealTimeFraudDetector(self.ensemble_model)
                self.logger.info(f"Model loaded from {self.model_path}")
            else:
                self.logger.warning("Loaded model is not trained")

        except Exception as e:
            self.logger.error(f"Failed to load model: {str(e)}")
            raise FraudDetectionError(f"Failed to load model: {str(e)}")

    async def update_model_feedback(
        self, transaction_id: str, is_fraud: bool, feedback_type: str = "manual_review"
    ):
        """
        Update model with feedback on predictions

        Args:
            transaction_id: Transaction ID
            is_fraud: True if transaction was actually fraud
            feedback_type: Type of feedback (manual_review, customer_report, etc.)
        """
        try:
            # Find the alert for this transaction
            alert = None
            for stored_alert in self.alerts_storage:
                if stored_alert.transaction_id == transaction_id:
                    alert = stored_alert
                    break

            if not alert:
                self.logger.warning(f"Alert not found for transaction {transaction_id}")
                return

            # Update performance metrics
            if is_fraud and alert.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
                self.performance_metrics["true_positives"] += 1
            elif not is_fraud and alert.risk_level in [
                RiskLevel.HIGH,
                RiskLevel.CRITICAL,
            ]:
                self.performance_metrics["false_positives"] += 1

            # Store feedback for future model retraining
            feedback_data = {
                "transaction_id": transaction_id,
                "predicted_risk_score": alert.risk_score,
                "predicted_risk_level": alert.risk_level.value,
                "actual_fraud": is_fraud,
                "feedback_type": feedback_type,
                "feedback_timestamp": datetime.now(),
                "features": alert.metadata.get("feature_values", {}),
            }

            # In production, this would be stored in a database
            if not hasattr(self, "feedback_storage"):
                self.feedback_storage = []
            self.feedback_storage.append(feedback_data)

            self.logger.info(
                f"Feedback recorded for transaction {transaction_id}: fraud={is_fraud}"
            )

        except Exception as e:
            self.logger.error(f"Failed to update model feedback: {str(e)}")

    async def check_retrain_needed(self) -> bool:
        """
        Check if model retraining is needed

        Returns:
            bool: True if retraining is recommended
        """
        if not self.auto_retrain:
            return False

        # Check if enough time has passed since last training
        if self.performance_metrics["last_retrain"]:
            days_since_retrain = (
                datetime.now() - self.performance_metrics["last_retrain"]
            ).days
            if days_since_retrain >= self.retrain_threshold_days:
                return True

        # Check if performance has degraded (if we have feedback data)
        if hasattr(self, "feedback_storage") and len(self.feedback_storage) > 100:
            recent_feedback = self.feedback_storage[-100:]  # Last 100 feedback items

            # Calculate false positive rate
            false_positives = sum(
                1
                for fb in recent_feedback
                if not fb["actual_fraud"] and fb["predicted_risk_score"] > 0.6
            )
            false_positive_rate = false_positives / len(recent_feedback)

            # Retrain if false positive rate is too high
            if false_positive_rate > 0.2:  # 20% threshold
                self.logger.info(
                    f"High false positive rate detected: {false_positive_rate:.2%}"
                )
                return True

        return False


# Global fraud detection service instance
fraud_service = None


def get_fraud_service(config: Optional[Dict[str, Any]] = None) -> FraudDetectionService:
    """
    Get or create the global fraud detection service instance

    Args:
        config: Service configuration

    Returns:
        FraudDetectionService: Service instance
    """
    global fraud_service

    if fraud_service is None:
        if config is None:
            config = {
                "model_path": "/tmp/fraud_model.joblib",
                "auto_retrain": True,
                "retrain_threshold_days": 30,
            }
        fraud_service = FraudDetectionService(config)

    return fraud_service

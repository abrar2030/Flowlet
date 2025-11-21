import logging
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score

from . import (
    AutoencoderModel,
    FraudAlert,
    FraudDetectionError,
    FraudModelBase,
    FraudType,
    IsolationForestModel,
    ModelNotTrainedError,
    OneClassSVMModel,
    RiskLevel,
)

logger = logging.getLogger(__name__)


class EnsembleFraudModel(FraudModelBase):
    """
    Ensemble model combining multiple fraud detection approaches
    Uses weighted voting to combine predictions from different models
    """

    def __init__(self, model_config: Dict[str, Any]):
        super().__init__(model_config)
        self.models = {}
        self.model_weights = {}
        self.model_configs = model_config.get("models", {})
        self.voting_strategy = model_config.get(
            "voting_strategy", "weighted"
        )  # 'weighted', 'average', 'max'
        self.anomaly_weight = model_config.get("anomaly_weight", 0.3)
        self.supervised_weight = model_config.get("supervised_weight", 0.7)

        # Initialize individual models
        self._initialize_models()

    def _initialize_models(self):
        """Initialize individual models based on configuration"""

        # Anomaly detection models
        if "isolation_forest" in self.model_configs:
            self.models["isolation_forest"] = IsolationForestModel(
                self.model_configs["isolation_forest"]
            )

        if "one_class_svm" in self.model_configs:
            self.models["one_class_svm"] = OneClassSVMModel(
                self.model_configs["one_class_svm"]
            )

        if "autoencoder" in self.model_configs:
            self.models["autoencoder"] = AutoencoderModel(
                self.model_configs["autoencoder"]
            )

        # Supervised models
        if "random_forest" in self.model_configs:
            self.models["random_forest"] = RandomForestFraudModel(
                self.model_configs["random_forest"]
            )

        if "xgboost" in self.model_configs:
            self.models["xgboost"] = XGBoostFraudModel(self.model_configs["xgboost"])

        if "lightgbm" in self.model_configs:
            self.models["lightgbm"] = LightGBMFraudModel(self.model_configs["lightgbm"])

        if "neural_network" in self.model_configs:
            self.models["neural_network"] = NeuralNetworkFraudModel(
                self.model_configs["neural_network"]
            )

        self.logger.info(
            f"Initialized {len(self.models)} models: {list(self.models.keys())}"
        )

    def train(
        self, training_data: pd.DataFrame, labels: Optional[pd.Series] = None
    ) -> None:
        """
        Train all models in the ensemble

        Args:
            training_data: Training features
            labels: Training labels (required for supervised models)
        """
        try:
            self.logger.info("Training ensemble fraud detection model")

            # Store feature columns
            self.feature_columns = list(training_data.columns)

            # Separate anomaly detection and supervised models
            anomaly_models = ["isolation_forest", "one_class_svm", "autoencoder"]
            supervised_models = [
                "random_forest",
                "xgboost",
                "lightgbm",
                "neural_network",
            ]

            # Train anomaly detection models (unsupervised)
            for model_name in anomaly_models:
                if model_name in self.models:
                    self.logger.info(f"Training {model_name}")
                    self.models[model_name].train(training_data)

            # Train supervised models (require labels)
            if labels is not None:
                for model_name in supervised_models:
                    if model_name in self.models:
                        self.logger.info(f"Training {model_name}")
                        self.models[model_name].train(training_data, labels)

                # Calculate model weights based on validation performance
                self._calculate_model_weights(training_data, labels)
            else:
                # Equal weights for anomaly detection models only
                anomaly_model_count = sum(
                    1 for name in anomaly_models if name in self.models
                )
                if anomaly_model_count > 0:
                    weight_per_model = 1.0 / anomaly_model_count
                    for model_name in anomaly_models:
                        if model_name in self.models:
                            self.model_weights[model_name] = weight_per_model

            self.is_trained = True
            self.training_timestamp = pd.Timestamp.now()

            self.logger.info("Ensemble model training completed")
            self.logger.info(f"Model weights: {self.model_weights}")

        except Exception as e:
            self.logger.error(f"Training failed: {str(e)}")
            raise FraudDetectionError(f"Training failed: {str(e)}")

    def _calculate_model_weights(self, training_data: pd.DataFrame, labels: pd.Series):
        """
        Calculate model weights based on validation performance
        """
        from sklearn.model_selection import train_test_split

        # Split data for validation
        X_train, X_val, y_train, y_val = train_test_split(
            training_data, labels, test_size=0.2, random_state=42, stratify=labels
        )

        model_scores = {}

        # Evaluate each model
        for model_name, model in self.models.items():
            try:
                # Get predictions on validation set
                if hasattr(model, "predict") and model.is_trained:
                    val_predictions = model.predict(X_val)

                    # Calculate AUC score
                    if len(np.unique(y_val)) > 1:  # Ensure both classes are present
                        auc_score = roc_auc_score(y_val, val_predictions)
                        model_scores[model_name] = auc_score
                    else:
                        model_scores[model_name] = 0.5  # Random performance
                else:
                    model_scores[model_name] = 0.5

            except Exception as e:
                self.logger.warning(f"Could not evaluate {model_name}: {str(e)}")
                model_scores[model_name] = 0.5

        # Calculate weights based on performance
        if self.voting_strategy == "weighted":
            # Normalize scores to weights
            total_score = sum(model_scores.values())
            if total_score > 0:
                for model_name, score in model_scores.items():
                    self.model_weights[model_name] = score / total_score
            else:
                # Equal weights if all models perform poorly
                num_models = len(model_scores)
                for model_name in model_scores:
                    self.model_weights[model_name] = 1.0 / num_models
        else:
            # Equal weights for average voting
            num_models = len(model_scores)
            for model_name in model_scores:
                self.model_weights[model_name] = 1.0 / num_models

    def predict(self, features: pd.DataFrame) -> np.ndarray:
        """
        Predict fraud scores using ensemble voting

        Args:
            features: Feature matrix

        Returns:
            np.ndarray: Ensemble fraud scores
        """
        if not self.is_trained:
            raise ModelNotTrainedError("Model must be trained before prediction")

        try:
            # Get predictions from all models
            model_predictions = {}

            for model_name, model in self.models.items():
                if model.is_trained:
                    predictions = model.predict(features)
                    model_predictions[model_name] = predictions

            if not model_predictions:
                raise FraudDetectionError("No trained models available for prediction")

            # Combine predictions using voting strategy
            if self.voting_strategy == "weighted":
                ensemble_scores = self._weighted_voting(model_predictions)
            elif self.voting_strategy == "average":
                ensemble_scores = self._average_voting(model_predictions)
            elif self.voting_strategy == "max":
                ensemble_scores = self._max_voting(model_predictions)
            else:
                raise FraudDetectionError(
                    f"Unknown voting strategy: {self.voting_strategy}"
                )

            return ensemble_scores

        except Exception as e:
            self.logger.error(f"Prediction failed: {str(e)}")
            raise FraudDetectionError(f"Prediction failed: {str(e)}")

    def _weighted_voting(self, model_predictions: Dict[str, np.ndarray]) -> np.ndarray:
        """Combine predictions using weighted voting"""

        num_samples = len(next(iter(model_predictions.values())))
        ensemble_scores = np.zeros(num_samples)
        total_weight = 0

        for model_name, predictions in model_predictions.items():
            weight = self.model_weights.get(model_name, 0)
            ensemble_scores += weight * predictions
            total_weight += weight

        if total_weight > 0:
            ensemble_scores /= total_weight

        return ensemble_scores

    def _average_voting(self, model_predictions: Dict[str, np.ndarray]) -> np.ndarray:
        """Combine predictions using simple averaging"""

        predictions_array = np.array(list(model_predictions.values()))
        ensemble_scores = np.mean(predictions_array, axis=0)

        return ensemble_scores

    def _max_voting(self, model_predictions: Dict[str, np.ndarray]) -> np.ndarray:
        """Combine predictions using maximum voting"""

        predictions_array = np.array(list(model_predictions.values()))
        ensemble_scores = np.max(predictions_array, axis=0)

        return ensemble_scores

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get aggregated feature importance from all models
        """
        if not self.is_trained:
            raise ModelNotTrainedError(
                "Model must be trained before getting feature importance"
            )

        aggregated_importance = {}

        # Initialize with zeros
        for feature in self.feature_columns:
            aggregated_importance[feature] = 0.0

        total_weight = 0

        # Aggregate importance from all models
        for model_name, model in self.models.items():
            if model.is_trained:
                try:
                    model_importance = model.get_feature_importance()
                    weight = self.model_weights.get(model_name, 1.0)

                    for feature, importance in model_importance.items():
                        if feature in aggregated_importance:
                            aggregated_importance[feature] += weight * importance

                    total_weight += weight

                except Exception as e:
                    self.logger.warning(
                        f"Could not get feature importance from {model_name}: {str(e)}"
                    )

        # Normalize by total weight
        if total_weight > 0:
            for feature in aggregated_importance:
                aggregated_importance[feature] /= total_weight

        return aggregated_importance

    def get_model_predictions(self, features: pd.DataFrame) -> Dict[str, np.ndarray]:
        """
        Get individual predictions from all models

        Args:
            features: Feature matrix

        Returns:
            Dict[str, np.ndarray]: Predictions from each model
        """
        model_predictions = {}

        for model_name, model in self.models.items():
            if model.is_trained:
                try:
                    predictions = model.predict(features)
                    model_predictions[model_name] = predictions
                except Exception as e:
                    self.logger.warning(f"Prediction failed for {model_name}: {str(e)}")

        return model_predictions

    def get_model_status(self) -> Dict[str, Dict[str, Any]]:
        """
        Get status of all models in the ensemble

        Returns:
            Dict[str, Dict[str, Any]]: Status information for each model
        """
        status = {}

        for model_name, model in self.models.items():
            status[model_name] = {
                "is_trained": model.is_trained,
                "model_version": model.model_version,
                "training_timestamp": model.training_timestamp,
                "weight": self.model_weights.get(model_name, 0.0),
            }

        return status


class RealTimeFraudDetector:
    """
    Real-time fraud detection system using ensemble models
    Provides high-level interface for fraud detection with explanations
    """

    def __init__(self, ensemble_model: EnsembleFraudModel):
        self.ensemble_model = ensemble_model
        self.logger = logging.getLogger(__name__)

        # Risk thresholds
        self.risk_thresholds = {
            RiskLevel.LOW: 0.3,
            RiskLevel.MEDIUM: 0.6,
            RiskLevel.HIGH: 0.8,
            RiskLevel.CRITICAL: 0.9,
        }

        # Fraud type detection rules
        self.fraud_type_rules = {
            FraudType.ACCOUNT_TAKEOVER: self._detect_account_takeover,
            FraudType.PAYMENT_FRAUD: self._detect_payment_fraud,
            FraudType.CARD_FRAUD: self._detect_card_fraud,
            FraudType.VELOCITY_FRAUD: self._detect_velocity_fraud,
        }

    def detect_fraud(
        self,
        transaction_features: Dict[str, Any],
        user_history: Optional[pd.DataFrame] = None,
    ) -> FraudAlert:
        """
        Detect fraud in real-time for a single transaction

        Args:
            transaction_features: Transaction feature dictionary
            user_history: Historical transactions for the user

        Returns:
            FraudAlert: Fraud detection result with explanation
        """
        try:
            from . import FeatureEngineer, FraudExplainer

            # Extract features
            feature_engineer = FeatureEngineer()
            features = feature_engineer.extract_transaction_features(
                transaction_features, user_history
            )

            # Convert to DataFrame for model prediction
            features_df = feature_engineer.features_to_dataframe(features)

            # Get fraud score from ensemble model
            fraud_scores = self.ensemble_model.predict(features_df)
            fraud_score = float(fraud_scores[0])

            # Determine risk level
            risk_level = self.ensemble_model.calculate_risk_level(fraud_score)

            # Detect specific fraud types
            detected_fraud_types = self._detect_fraud_types(features, fraud_score)

            # Get feature importance for explanation
            feature_importance = self.ensemble_model.get_feature_importance()

            # Generate explanation
            explainer = FraudExplainer()
            explanation = explainer.explain_prediction(
                features, fraud_score, feature_importance
            )

            # Generate recommended actions
            recommended_actions = self._generate_recommendations(
                risk_level, detected_fraud_types
            )

            # Create fraud alert
            alert = FraudAlert(
                alert_id=f"ALERT-{features.transaction_id}",
                transaction_id=features.transaction_id,
                user_id=features.user_id,
                risk_score=fraud_score,
                risk_level=risk_level,
                fraud_types=detected_fraud_types,
                confidence=min(
                    fraud_score * 1.2, 1.0
                ),  # Adjust confidence based on score
                timestamp=features.timestamp,
                features_used=list(feature_importance.keys()),
                model_version=self.ensemble_model.model_version,
                explanation=explanation,
                recommended_actions=recommended_actions,
                metadata={
                    "model_predictions": self.ensemble_model.get_model_predictions(
                        features_df
                    ),
                    "feature_values": features.__dict__,
                },
            )

            return alert

        except Exception as e:
            self.logger.error(f"Fraud detection failed: {str(e)}")
            raise FraudDetectionError(f"Fraud detection failed: {str(e)}")

    def _detect_fraud_types(
        self, features: "TransactionFeatures", fraud_score: float
    ) -> List[FraudType]:
        """Detect specific types of fraud based on features and score"""

        detected_types = []

        for fraud_type, detection_func in self.fraud_type_rules.items():
            if detection_func(features, fraud_score):
                detected_types.append(fraud_type)

        return detected_types

    def _detect_account_takeover(
        self, features: "TransactionFeatures", fraud_score: float
    ) -> bool:
        """Detect account takeover fraud"""
        return (
            fraud_score > 0.6
            and (features.new_device or features.new_location)
            and features.unusual_time
        )

    def _detect_payment_fraud(
        self, features: "TransactionFeatures", fraud_score: float
    ) -> bool:
        """Detect payment fraud"""
        return (
            fraud_score > 0.5
            and (features.amount_zscore and abs(features.amount_zscore) > 2)
            and features.high_risk_merchant
        )

    def _detect_card_fraud(
        self, features: "TransactionFeatures", fraud_score: float
    ) -> bool:
        """Detect card fraud"""
        return (
            fraud_score > 0.7
            and features.new_location
            and features.payment_method in ["card", "credit_card"]
        )

    def _detect_velocity_fraud(
        self, features: "TransactionFeatures", fraud_score: float
    ) -> bool:
        """Detect velocity-based fraud"""
        return (
            fraud_score > 0.4
            and (features.velocity_1h and features.velocity_1h > 5)
            or (features.velocity_24h and features.velocity_24h > 20)
        )

    def _generate_recommendations(
        self, risk_level: RiskLevel, fraud_types: List[FraudType]
    ) -> List[str]:
        """Generate recommended actions based on risk level and fraud types"""

        recommendations = []

        if risk_level == RiskLevel.CRITICAL:
            recommendations.extend(
                [
                    "Block transaction immediately",
                    "Freeze account pending investigation",
                    "Contact customer for verification",
                    "Escalate to fraud investigation team",
                ]
            )
        elif risk_level == RiskLevel.HIGH:
            recommendations.extend(
                [
                    "Hold transaction for manual review",
                    "Require additional authentication",
                    "Contact customer for verification",
                ]
            )
        elif risk_level == RiskLevel.MEDIUM:
            recommendations.extend(
                [
                    "Flag for monitoring",
                    "Consider step-up authentication",
                    "Monitor subsequent transactions closely",
                ]
            )
        else:
            recommendations.append("Allow transaction with standard monitoring")

        # Add fraud-type specific recommendations
        if FraudType.ACCOUNT_TAKEOVER in fraud_types:
            recommendations.append("Verify device and location with customer")

        if FraudType.VELOCITY_FRAUD in fraud_types:
            recommendations.append("Implement velocity limits")

        if FraudType.CARD_FRAUD in fraud_types:
            recommendations.append("Verify card possession with customer")

        return recommendations

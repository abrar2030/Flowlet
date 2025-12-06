import logging
from typing import Any, Dict, Optional
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.svm import OneClassSVM
from tensorflow import keras
from tensorflow.keras import layers
from . import FraudDetectionError, FraudModelBase, ModelNotTrainedError

"\nAnomaly Detection Models for Fraud Detection\nImplements unsupervised learning models for detecting fraudulent transactions\n"
logger = logging.getLogger(__name__)


class IsolationForestModel(FraudModelBase):
    """
    Isolation Forest model for anomaly detection
    Effective for detecting outliers in high-dimensional data
    """

    def __init__(self, model_config: Dict[str, Any]) -> Any:
        super().__init__(model_config)
        self.scaler = StandardScaler()
        self.contamination = model_config.get("contamination", 0.1)
        self.n_estimators = model_config.get("n_estimators", 100)
        self.max_samples = model_config.get("max_samples", "auto")
        self.random_state = model_config.get("random_state", 42)

    def train(
        self, training_data: pd.DataFrame, labels: Optional[pd.Series] = None
    ) -> None:
        """
        Train Isolation Forest model

        Args:
            training_data: Training dataset (unlabeled)
            labels: Not used for unsupervised learning
        """
        try:
            self.logger.info("Training Isolation Forest model")
            self.feature_columns = list(training_data.columns)
            scaled_data = self.scaler.fit_transform(training_data)
            self.model = IsolationForest(
                contamination=self.contamination,
                n_estimators=self.n_estimators,
                max_samples=self.max_samples,
                random_state=self.random_state,
                n_jobs=-1,
            )
            self.model.fit(scaled_data)
            self.is_trained = True
            self.training_timestamp = pd.Timestamp.now()
            self.logger.info(
                f"Isolation Forest model trained with {len(training_data)} samples"
            )
        except Exception as e:
            self.logger.error(f"Training failed: {str(e)}")
            raise FraudDetectionError(f"Training failed: {str(e)}")

    def predict(self, features: pd.DataFrame) -> np.ndarray:
        """
        Predict anomaly scores

        Args:
            features: Feature matrix

        Returns:
            np.ndarray: Anomaly scores (higher = more anomalous)
        """
        if not self.is_trained:
            raise ModelNotTrainedError("Model must be trained before prediction")
        try:
            features = self.preprocess_features(features)
            scaled_features = self.scaler.transform(features)
            anomaly_scores = self.model.decision_function(scaled_features)
            normalized_scores = 1 / (1 + np.exp(anomaly_scores))
            return normalized_scores
        except Exception as e:
            self.logger.error(f"Prediction failed: {str(e)}")
            raise FraudDetectionError(f"Prediction failed: {str(e)}")

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance (approximated for Isolation Forest)
        """
        if not self.is_trained:
            raise ModelNotTrainedError(
                "Model must be trained before getting feature importance"
            )
        importance_scores = {}
        num_features = len(self.feature_columns)
        for feature in self.feature_columns:
            importance_scores[feature] = 1.0 / num_features
        return importance_scores


class OneClassSVMModel(FraudModelBase):
    """
    One-Class SVM model for anomaly detection
    Effective for finding decision boundaries in feature space
    """

    def __init__(self, model_config: Dict[str, Any]) -> Any:
        super().__init__(model_config)
        self.scaler = StandardScaler()
        self.nu = model_config.get("nu", 0.1)
        self.kernel = model_config.get("kernel", "rbf")
        self.gamma = model_config.get("gamma", "scale")

    def train(
        self, training_data: pd.DataFrame, labels: Optional[pd.Series] = None
    ) -> None:
        """
        Train One-Class SVM model

        Args:
            training_data: Training dataset (unlabeled)
            labels: Not used for unsupervised learning
        """
        try:
            self.logger.info("Training One-Class SVM model")
            self.feature_columns = list(training_data.columns)
            scaled_data = self.scaler.fit_transform(training_data)
            self.model = OneClassSVM(nu=self.nu, kernel=self.kernel, gamma=self.gamma)
            self.model.fit(scaled_data)
            self.is_trained = True
            self.training_timestamp = pd.Timestamp.now()
            self.logger.info(
                f"One-Class SVM model trained with {len(training_data)} samples"
            )
        except Exception as e:
            self.logger.error(f"Training failed: {str(e)}")
            raise FraudDetectionError(f"Training failed: {str(e)}")

    def predict(self, features: pd.DataFrame) -> np.ndarray:
        """
        Predict anomaly scores

        Args:
            features: Feature matrix

        Returns:
            np.ndarray: Anomaly scores (higher = more anomalous)
        """
        if not self.is_trained:
            raise ModelNotTrainedError("Model must be trained before prediction")
        try:
            features = self.preprocess_features(features)
            scaled_features = self.scaler.transform(features)
            decision_scores = self.model.decision_function(scaled_features)
            normalized_scores = 1 / (1 + np.exp(decision_scores))
            return normalized_scores
        except Exception as e:
            self.logger.error(f"Prediction failed: {str(e)}")
            raise FraudDetectionError(f"Prediction failed: {str(e)}")

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance (approximated for One-Class SVM)
        """
        if not self.is_trained:
            raise ModelNotTrainedError(
                "Model must be trained before getting feature importance"
            )
        importance_scores = {}
        num_features = len(self.feature_columns)
        for feature in self.feature_columns:
            importance_scores[feature] = 1.0 / num_features
        return importance_scores


class AutoencoderModel(FraudModelBase):
    """
    Autoencoder neural network for anomaly detection
    Learns to reconstruct normal patterns, high reconstruction error indicates anomaly
    """

    def __init__(self, model_config: Dict[str, Any]) -> Any:
        super().__init__(model_config)
        self.scaler = StandardScaler()
        self.encoding_dim = model_config.get("encoding_dim", 32)
        self.hidden_layers = model_config.get("hidden_layers", [64, 32])
        self.epochs = model_config.get("epochs", 100)
        self.batch_size = model_config.get("batch_size", 32)
        self.learning_rate = model_config.get("learning_rate", 0.001)
        self.validation_split = model_config.get("validation_split", 0.2)

    def train(
        self, training_data: pd.DataFrame, labels: Optional[pd.Series] = None
    ) -> None:
        """
        Train Autoencoder model

        Args:
            training_data: Training dataset (unlabeled)
            labels: Not used for unsupervised learning
        """
        try:
            self.logger.info("Training Autoencoder model")
            self.feature_columns = list(training_data.columns)
            input_dim = len(self.feature_columns)
            scaled_data = self.scaler.fit_transform(training_data)
            self.model = self._build_autoencoder(input_dim)
            self.model.compile(
                optimizer=keras.optimizers.Adam(learning_rate=self.learning_rate),
                loss="mse",
                metrics=["mae"],
            )
            history = self.model.fit(
                scaled_data,
                scaled_data,
                epochs=self.epochs,
                batch_size=self.batch_size,
                validation_split=self.validation_split,
                shuffle=True,
                verbose=0,
                callbacks=[
                    keras.callbacks.EarlyStopping(
                        monitor="val_loss", patience=10, restore_best_weights=True
                    )
                ],
            )
            train_predictions = self.model.predict(scaled_data, verbose=0)
            train_errors = np.mean(np.square(scaled_data - train_predictions), axis=1)
            self.threshold = np.percentile(train_errors, 95)
            self.is_trained = True
            self.training_timestamp = pd.Timestamp.now()
            self.logger.info(
                f"Autoencoder model trained with {len(training_data)} samples"
            )
            self.logger.info(f"Reconstruction threshold: {self.threshold:.4f}")
        except Exception as e:
            self.logger.error(f"Training failed: {str(e)}")
            raise FraudDetectionError(f"Training failed: {str(e)}")

    def _build_autoencoder(self, input_dim: int) -> keras.Model:
        """
        Build autoencoder architecture

        Args:
            input_dim: Input dimension

        Returns:
            keras.Model: Autoencoder model
        """
        input_layer = keras.Input(shape=(input_dim,))
        encoded = input_layer
        for hidden_dim in self.hidden_layers:
            encoded = layers.Dense(hidden_dim, activation="relu")(encoded)
            encoded = layers.Dropout(0.2)(encoded)
        encoded = layers.Dense(self.encoding_dim, activation="relu")(encoded)
        decoded = encoded
        for hidden_dim in reversed(self.hidden_layers):
            decoded = layers.Dense(hidden_dim, activation="relu")(decoded)
            decoded = layers.Dropout(0.2)(decoded)
        decoded = layers.Dense(input_dim, activation="linear")(decoded)
        autoencoder = keras.Model(input_layer, decoded)
        return autoencoder

    def predict(self, features: pd.DataFrame) -> np.ndarray:
        """
        Predict anomaly scores based on reconstruction error

        Args:
            features: Feature matrix

        Returns:
            np.ndarray: Anomaly scores (higher = more anomalous)
        """
        if not self.is_trained:
            raise ModelNotTrainedError("Model must be trained before prediction")
        try:
            features = self.preprocess_features(features)
            scaled_features = self.scaler.transform(features)
            reconstructions = self.model.predict(scaled_features, verbose=0)
            reconstruction_errors = np.mean(
                np.square(scaled_features - reconstructions), axis=1
            )
            normalized_scores = reconstruction_errors / self.threshold
            normalized_scores = np.clip(normalized_scores, 0, 1)
            return normalized_scores
        except Exception as e:
            self.logger.error(f"Prediction failed: {str(e)}")
            raise FraudDetectionError(f"Prediction failed: {str(e)}")

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance based on reconstruction error sensitivity
        """
        if not self.is_trained:
            raise ModelNotTrainedError(
                "Model must be trained before getting feature importance"
            )
        importance_scores = {}
        sample_input = np.zeros((1, len(self.feature_columns)))
        sample_input = tf.constant(sample_input, dtype=tf.float32)
        with tf.GradientTape() as tape:
            tape.watch(sample_input)
            reconstruction = self.model(sample_input)
            loss = tf.reduce_mean(tf.square(sample_input - reconstruction))
        gradients = tape.gradient(loss, sample_input)
        if gradients is not None:
            importance_values = np.abs(gradients.numpy()[0])
            importance_values = importance_values / np.sum(importance_values)
            for i, feature in enumerate(self.feature_columns):
                importance_scores[feature] = float(importance_values[i])
        else:
            num_features = len(self.feature_columns)
            for feature in self.feature_columns:
                importance_scores[feature] = 1.0 / num_features
        return importance_scores

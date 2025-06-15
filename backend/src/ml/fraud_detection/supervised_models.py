"""
Supervised Learning Models for Fraud Detection
Implements supervised ML models for fraud classification
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Tuple
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, roc_auc_score, precision_recall_curve
import xgboost as xgb
import lightgbm as lgb
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import logging

from . import (
    FraudModelBase,
    ModelType,
    FraudDetectionError,
    ModelNotTrainedError
)

logger = logging.getLogger(__name__)


class RandomForestFraudModel(FraudModelBase):
    """
    Random Forest model for fraud classification
    Robust ensemble method with good interpretability
    """
    
    def __init__(self, model_config: Dict[str, Any]):
        super().__init__(model_config)
        self.n_estimators = model_config.get('n_estimators', 100)
        self.max_depth = model_config.get('max_depth', None)
        self.min_samples_split = model_config.get('min_samples_split', 2)
        self.min_samples_leaf = model_config.get('min_samples_leaf', 1)
        self.class_weight = model_config.get('class_weight', 'balanced')
        self.random_state = model_config.get('random_state', 42)
        
    def train(self, training_data: pd.DataFrame, labels: pd.Series) -> None:
        """
        Train Random Forest model
        
        Args:
            training_data: Training features
            labels: Training labels (0=legitimate, 1=fraud)
        """
        try:
            self.logger.info("Training Random Forest model")
            
            # Store feature columns
            self.feature_columns = list(training_data.columns)
            
            # Initialize model
            self.model = RandomForestClassifier(
                n_estimators=self.n_estimators,
                max_depth=self.max_depth,
                min_samples_split=self.min_samples_split,
                min_samples_leaf=self.min_samples_leaf,
                class_weight=self.class_weight,
                random_state=self.random_state,
                n_jobs=-1
            )
            
            # Train model
            self.model.fit(training_data, labels)
            
            # Calculate training metrics
            train_predictions = self.model.predict_proba(training_data)[:, 1]
            train_auc = roc_auc_score(labels, train_predictions)
            
            self.is_trained = True
            self.training_timestamp = pd.Timestamp.now()
            
            self.logger.info(f"Random Forest model trained with {len(training_data)} samples")
            self.logger.info(f"Training AUC: {train_auc:.4f}")
            
        except Exception as e:
            self.logger.error(f"Training failed: {str(e)}")
            raise FraudDetectionError(f"Training failed: {str(e)}")
    
    def predict(self, features: pd.DataFrame) -> np.ndarray:
        """
        Predict fraud probabilities
        
        Args:
            features: Feature matrix
            
        Returns:
            np.ndarray: Fraud probabilities
        """
        if not self.is_trained:
            raise ModelNotTrainedError("Model must be trained before prediction")
        
        try:
            # Preprocess features
            features = self.preprocess_features(features)
            
            # Get fraud probabilities
            fraud_probabilities = self.model.predict_proba(features)[:, 1]
            
            return fraud_probabilities
            
        except Exception as e:
            self.logger.error(f"Prediction failed: {str(e)}")
            raise FraudDetectionError(f"Prediction failed: {str(e)}")
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance from Random Forest
        """
        if not self.is_trained:
            raise ModelNotTrainedError("Model must be trained before getting feature importance")
        
        importance_scores = {}
        feature_importances = self.model.feature_importances_
        
        for i, feature in enumerate(self.feature_columns):
            importance_scores[feature] = float(feature_importances[i])
        
        return importance_scores


class XGBoostFraudModel(FraudModelBase):
    """
    XGBoost model for fraud classification
    High-performance gradient boosting with excellent results on tabular data
    """
    
    def __init__(self, model_config: Dict[str, Any]):
        super().__init__(model_config)
        self.n_estimators = model_config.get('n_estimators', 100)
        self.max_depth = model_config.get('max_depth', 6)
        self.learning_rate = model_config.get('learning_rate', 0.1)
        self.subsample = model_config.get('subsample', 0.8)
        self.colsample_bytree = model_config.get('colsample_bytree', 0.8)
        self.scale_pos_weight = model_config.get('scale_pos_weight', None)
        self.random_state = model_config.get('random_state', 42)
        
    def train(self, training_data: pd.DataFrame, labels: pd.Series) -> None:
        """
        Train XGBoost model
        
        Args:
            training_data: Training features
            labels: Training labels (0=legitimate, 1=fraud)
        """
        try:
            self.logger.info("Training XGBoost model")
            
            # Store feature columns
            self.feature_columns = list(training_data.columns)
            
            # Calculate scale_pos_weight if not provided
            if self.scale_pos_weight is None:
                neg_count = (labels == 0).sum()
                pos_count = (labels == 1).sum()
                self.scale_pos_weight = neg_count / pos_count if pos_count > 0 else 1
            
            # Initialize model
            self.model = xgb.XGBClassifier(
                n_estimators=self.n_estimators,
                max_depth=self.max_depth,
                learning_rate=self.learning_rate,
                subsample=self.subsample,
                colsample_bytree=self.colsample_bytree,
                scale_pos_weight=self.scale_pos_weight,
                random_state=self.random_state,
                eval_metric='auc',
                use_label_encoder=False
            )
            
            # Split data for early stopping
            X_train, X_val, y_train, y_val = train_test_split(
                training_data, labels, test_size=0.2, random_state=self.random_state,
                stratify=labels
            )
            
            # Train model with early stopping
            self.model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                early_stopping_rounds=10,
                verbose=False
            )
            
            # Calculate training metrics
            train_predictions = self.model.predict_proba(training_data)[:, 1]
            train_auc = roc_auc_score(labels, train_predictions)
            
            self.is_trained = True
            self.training_timestamp = pd.Timestamp.now()
            
            self.logger.info(f"XGBoost model trained with {len(training_data)} samples")
            self.logger.info(f"Training AUC: {train_auc:.4f}")
            
        except Exception as e:
            self.logger.error(f"Training failed: {str(e)}")
            raise FraudDetectionError(f"Training failed: {str(e)}")
    
    def predict(self, features: pd.DataFrame) -> np.ndarray:
        """
        Predict fraud probabilities
        
        Args:
            features: Feature matrix
            
        Returns:
            np.ndarray: Fraud probabilities
        """
        if not self.is_trained:
            raise ModelNotTrainedError("Model must be trained before prediction")
        
        try:
            # Preprocess features
            features = self.preprocess_features(features)
            
            # Get fraud probabilities
            fraud_probabilities = self.model.predict_proba(features)[:, 1]
            
            return fraud_probabilities
            
        except Exception as e:
            self.logger.error(f"Prediction failed: {str(e)}")
            raise FraudDetectionError(f"Prediction failed: {str(e)}")
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance from XGBoost
        """
        if not self.is_trained:
            raise ModelNotTrainedError("Model must be trained before getting feature importance")
        
        importance_scores = {}
        feature_importances = self.model.feature_importances_
        
        for i, feature in enumerate(self.feature_columns):
            importance_scores[feature] = float(feature_importances[i])
        
        return importance_scores


class LightGBMFraudModel(FraudModelBase):
    """
    LightGBM model for fraud classification
    Fast gradient boosting with excellent performance and memory efficiency
    """
    
    def __init__(self, model_config: Dict[str, Any]):
        super().__init__(model_config)
        self.n_estimators = model_config.get('n_estimators', 100)
        self.max_depth = model_config.get('max_depth', -1)
        self.learning_rate = model_config.get('learning_rate', 0.1)
        self.num_leaves = model_config.get('num_leaves', 31)
        self.feature_fraction = model_config.get('feature_fraction', 0.8)
        self.bagging_fraction = model_config.get('bagging_fraction', 0.8)
        self.class_weight = model_config.get('class_weight', 'balanced')
        self.random_state = model_config.get('random_state', 42)
        
    def train(self, training_data: pd.DataFrame, labels: pd.Series) -> None:
        """
        Train LightGBM model
        
        Args:
            training_data: Training features
            labels: Training labels (0=legitimate, 1=fraud)
        """
        try:
            self.logger.info("Training LightGBM model")
            
            # Store feature columns
            self.feature_columns = list(training_data.columns)
            
            # Initialize model
            self.model = lgb.LGBMClassifier(
                n_estimators=self.n_estimators,
                max_depth=self.max_depth,
                learning_rate=self.learning_rate,
                num_leaves=self.num_leaves,
                feature_fraction=self.feature_fraction,
                bagging_fraction=self.bagging_fraction,
                class_weight=self.class_weight,
                random_state=self.random_state,
                verbose=-1
            )
            
            # Split data for early stopping
            X_train, X_val, y_train, y_val = train_test_split(
                training_data, labels, test_size=0.2, random_state=self.random_state,
                stratify=labels
            )
            
            # Train model with early stopping
            self.model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                callbacks=[lgb.early_stopping(10), lgb.log_evaluation(0)]
            )
            
            # Calculate training metrics
            train_predictions = self.model.predict_proba(training_data)[:, 1]
            train_auc = roc_auc_score(labels, train_predictions)
            
            self.is_trained = True
            self.training_timestamp = pd.Timestamp.now()
            
            self.logger.info(f"LightGBM model trained with {len(training_data)} samples")
            self.logger.info(f"Training AUC: {train_auc:.4f}")
            
        except Exception as e:
            self.logger.error(f"Training failed: {str(e)}")
            raise FraudDetectionError(f"Training failed: {str(e)}")
    
    def predict(self, features: pd.DataFrame) -> np.ndarray:
        """
        Predict fraud probabilities
        
        Args:
            features: Feature matrix
            
        Returns:
            np.ndarray: Fraud probabilities
        """
        if not self.is_trained:
            raise ModelNotTrainedError("Model must be trained before prediction")
        
        try:
            # Preprocess features
            features = self.preprocess_features(features)
            
            # Get fraud probabilities
            fraud_probabilities = self.model.predict_proba(features)[:, 1]
            
            return fraud_probabilities
            
        except Exception as e:
            self.logger.error(f"Prediction failed: {str(e)}")
            raise FraudDetectionError(f"Prediction failed: {str(e)}")
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance from LightGBM
        """
        if not self.is_trained:
            raise ModelNotTrainedError("Model must be trained before getting feature importance")
        
        importance_scores = {}
        feature_importances = self.model.feature_importances_
        
        for i, feature in enumerate(self.feature_columns):
            importance_scores[feature] = float(feature_importances[i])
        
        return importance_scores


class NeuralNetworkFraudModel(FraudModelBase):
    """
    Deep Neural Network model for fraud classification
    Flexible architecture for complex pattern recognition
    """
    
    def __init__(self, model_config: Dict[str, Any]):
        super().__init__(model_config)
        self.scaler = StandardScaler()
        self.hidden_layers = model_config.get('hidden_layers', [128, 64, 32])
        self.dropout_rate = model_config.get('dropout_rate', 0.3)
        self.learning_rate = model_config.get('learning_rate', 0.001)
        self.epochs = model_config.get('epochs', 100)
        self.batch_size = model_config.get('batch_size', 32)
        self.validation_split = model_config.get('validation_split', 0.2)
        
    def train(self, training_data: pd.DataFrame, labels: pd.Series) -> None:
        """
        Train Neural Network model
        
        Args:
            training_data: Training features
            labels: Training labels (0=legitimate, 1=fraud)
        """
        try:
            self.logger.info("Training Neural Network model")
            
            # Store feature columns
            self.feature_columns = list(training_data.columns)
            input_dim = len(self.feature_columns)
            
            # Scale features
            scaled_data = self.scaler.fit_transform(training_data)
            
            # Calculate class weights for imbalanced data
            neg_count = (labels == 0).sum()
            pos_count = (labels == 1).sum()
            total_count = len(labels)
            
            class_weight = {
                0: total_count / (2 * neg_count),
                1: total_count / (2 * pos_count)
            }
            
            # Build model
            self.model = self._build_neural_network(input_dim)
            
            # Compile model
            self.model.compile(
                optimizer=keras.optimizers.Adam(learning_rate=self.learning_rate),
                loss='binary_crossentropy',
                metrics=['accuracy', 'precision', 'recall']
            )
            
            # Train model
            history = self.model.fit(
                scaled_data, labels,
                epochs=self.epochs,
                batch_size=self.batch_size,
                validation_split=self.validation_split,
                class_weight=class_weight,
                shuffle=True,
                verbose=0,
                callbacks=[
                    keras.callbacks.EarlyStopping(
                        monitor='val_loss',
                        patience=10,
                        restore_best_weights=True
                    ),
                    keras.callbacks.ReduceLROnPlateau(
                        monitor='val_loss',
                        factor=0.5,
                        patience=5,
                        min_lr=1e-7
                    )
                ]
            )
            
            # Calculate training metrics
            train_predictions = self.model.predict(scaled_data, verbose=0).flatten()
            train_auc = roc_auc_score(labels, train_predictions)
            
            self.is_trained = True
            self.training_timestamp = pd.Timestamp.now()
            
            self.logger.info(f"Neural Network model trained with {len(training_data)} samples")
            self.logger.info(f"Training AUC: {train_auc:.4f}")
            
        except Exception as e:
            self.logger.error(f"Training failed: {str(e)}")
            raise FraudDetectionError(f"Training failed: {str(e)}")
    
    def _build_neural_network(self, input_dim: int) -> keras.Model:
        """
        Build neural network architecture
        
        Args:
            input_dim: Input dimension
            
        Returns:
            keras.Model: Neural network model
        """
        # Input layer
        input_layer = keras.Input(shape=(input_dim,))
        
        # Hidden layers
        x = input_layer
        for hidden_dim in self.hidden_layers:
            x = layers.Dense(hidden_dim, activation='relu')(x)
            x = layers.BatchNormalization()(x)
            x = layers.Dropout(self.dropout_rate)(x)
        
        # Output layer
        output = layers.Dense(1, activation='sigmoid')(x)
        
        # Create model
        model = keras.Model(input_layer, output)
        
        return model
    
    def predict(self, features: pd.DataFrame) -> np.ndarray:
        """
        Predict fraud probabilities
        
        Args:
            features: Feature matrix
            
        Returns:
            np.ndarray: Fraud probabilities
        """
        if not self.is_trained:
            raise ModelNotTrainedError("Model must be trained before prediction")
        
        try:
            # Preprocess features
            features = self.preprocess_features(features)
            
            # Scale features
            scaled_features = self.scaler.transform(features)
            
            # Get fraud probabilities
            fraud_probabilities = self.model.predict(scaled_features, verbose=0).flatten()
            
            return fraud_probabilities
            
        except Exception as e:
            self.logger.error(f"Prediction failed: {str(e)}")
            raise FraudDetectionError(f"Prediction failed: {str(e)}")
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance using gradient-based method
        """
        if not self.is_trained:
            raise ModelNotTrainedError("Model must be trained before getting feature importance")
        
        importance_scores = {}
        
        # Create a sample input
        sample_input = np.zeros((1, len(self.feature_columns)))
        sample_input = tf.constant(sample_input, dtype=tf.float32)
        
        with tf.GradientTape() as tape:
            tape.watch(sample_input)
            prediction = self.model(sample_input)
        
        # Get gradients
        gradients = tape.gradient(prediction, sample_input)
        
        # Calculate importance as absolute gradient values
        if gradients is not None:
            importance_values = np.abs(gradients.numpy()[0])
            # Normalize to sum to 1
            if np.sum(importance_values) > 0:
                importance_values = importance_values / np.sum(importance_values)
            
            for i, feature in enumerate(self.feature_columns):
                importance_scores[feature] = float(importance_values[i])
        else:
            # Fallback to equal importance
            num_features = len(self.feature_columns)
            for feature in self.feature_columns:
                importance_scores[feature] = 1.0 / num_features
        
        return importance_scores


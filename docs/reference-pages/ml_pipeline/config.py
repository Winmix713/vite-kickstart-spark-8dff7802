"""
Configuration for ML Pipeline
"""

import os
from pathlib import Path

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# Storage paths
STORAGE_BUCKET = "model-artifacts"
EVALUATION_LOG_PATH = "evaluation_log.csv"
LOGS_STORAGE_PREFIX = "training-logs"

# Training Configuration
DEFAULT_LOOKBACK_DAYS = 7
MIN_ERROR_SAMPLES_FOR_RETRAINING = 10
ERROR_CONFIDENCE_THRESHOLD = 0.7
DEFAULT_FINE_TUNE_EPOCHS = 5
DEFAULT_LEARNING_RATE = 0.001

# Paths
ML_PIPELINE_DIR = Path(__file__).parent
PROJECT_ROOT = ML_PIPELINE_DIR.parent
MODELS_DIR = PROJECT_ROOT / "models"
RETRAINED_MODELS_DIR = MODELS_DIR / "retrained"
TEMP_DIR = Path("/tmp")

# Create directories if they don't exist
MODELS_DIR.mkdir(parents=True, exist_ok=True)
RETRAINED_MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Environment
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

"""
Data loader for ML Pipeline - handles evaluation log retrieval and dataset preparation
"""

import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Tuple

import pandas as pd

from .config import (
    DEFAULT_LOOKBACK_DAYS,
    ERROR_CONFIDENCE_THRESHOLD,
    EVALUATION_LOG_PATH,
    STORAGE_BUCKET,
    TEMP_DIR,
)
from .supabase_client import download_file_from_storage

logger = logging.getLogger(__name__)


def load_evaluation_log(lookback_days: int = DEFAULT_LOOKBACK_DAYS) -> Optional[pd.DataFrame]:
    """
    Load evaluation log from Supabase Storage
    
    Args:
        lookback_days: Number of days to look back in evaluation log
        
    Returns:
        DataFrame with evaluation log or None if failed
    """
    try:
        temp_path = TEMP_DIR / f"evaluation_log_{datetime.now().isoformat()}.csv"
        download_file_from_storage(STORAGE_BUCKET, EVALUATION_LOG_PATH, str(temp_path))
        
        df = pd.read_csv(temp_path)
        logger.info(f"Loaded evaluation log with {len(df)} records")
        
        return df
    except Exception as e:
        logger.error(f"Failed to load evaluation log: {str(e)}")
        return None


def filter_errors_for_retraining(
    df: pd.DataFrame,
    lookback_days: int = DEFAULT_LOOKBACK_DAYS,
    confidence_threshold: float = ERROR_CONFIDENCE_THRESHOLD,
) -> pd.DataFrame:
    """
    Filter evaluation log to get high-confidence errors suitable for retraining
    
    Args:
        df: Evaluation log DataFrame
        lookback_days: Number of days to look back
        confidence_threshold: Minimum confidence for errors to be included
        
    Returns:
        Filtered DataFrame with errors
    """
    if df is None or len(df) == 0:
        logger.warning("Empty evaluation log provided")
        return pd.DataFrame()
    
    try:
        # Ensure we have required columns
        required_columns = ["predicted_outcome", "actual_outcome", "confidence"]
        if not all(col in df.columns for col in required_columns):
            missing = [col for col in required_columns if col not in df.columns]
            logger.error(f"Missing required columns: {missing}")
            return pd.DataFrame()
        
        # Convert match_date to datetime if it exists
        if "match_date" in df.columns:
            df["match_date"] = pd.to_datetime(df["match_date"], errors="coerce")
            cutoff_date = datetime.now() - timedelta(days=lookback_days)
            date_filter = df["match_date"] >= cutoff_date
        else:
            # If no match_date, include all
            date_filter = pd.Series([True] * len(df))
        
        # Filter: incorrect predictions with high confidence
        incorrect = df[
            (df["predicted_outcome"] != df["actual_outcome"])
            & (df["confidence"] > confidence_threshold)
            & date_filter
        ]
        
        logger.info(
            f"Filtered {len(incorrect)} errors from {len(df)} records "
            f"(confidence > {confidence_threshold}, lookback {lookback_days} days)"
        )
        
        return incorrect
    except Exception as e:
        logger.error(f"Error filtering evaluation log: {str(e)}")
        return pd.DataFrame()


def create_finetuning_dataset(
    errors_df: pd.DataFrame,
    output_path: str,
) -> Optional[str]:
    """
    Create fine-tuning dataset from filtered errors
    
    Args:
        errors_df: DataFrame with error samples
        output_path: Path to save the dataset
        
    Returns:
        Path to created dataset or None if failed
    """
    if len(errors_df) == 0:
        logger.warning("No error samples to create fine-tuning dataset")
        return None
    
    try:
        # Save as CSV
        errors_df.to_csv(output_path, index=False)
        logger.info(f"Created fine-tuning dataset with {len(errors_df)} samples at {output_path}")
        
        return output_path
    except Exception as e:
        logger.error(f"Failed to create fine-tuning dataset: {str(e)}")
        return None


def generate_dataset_filename() -> str:
    """
    Generate a unique filename for fine-tuning dataset
    
    Returns:
        Filename with timestamp
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"finetune_{timestamp}.csv"


def prepare_retraining_data(
    lookback_days: int = DEFAULT_LOOKBACK_DAYS,
    confidence_threshold: float = ERROR_CONFIDENCE_THRESHOLD,
) -> Tuple[Optional[str], int]:
    """
    Complete pipeline to prepare retraining data
    
    Args:
        lookback_days: Number of days to look back
        confidence_threshold: Minimum confidence for errors
        
    Returns:
        Tuple of (dataset_path, error_count) or (None, 0) if failed
    """
    # Load evaluation log
    eval_log = load_evaluation_log(lookback_days)
    if eval_log is None:
        return None, 0
    
    # Filter errors
    errors = filter_errors_for_retraining(eval_log, lookback_days, confidence_threshold)
    if len(errors) == 0:
        logger.info("No errors found for retraining")
        return None, 0
    
    # Create dataset
    dataset_filename = generate_dataset_filename()
    dataset_path = str(TEMP_DIR / dataset_filename)
    
    result = create_finetuning_dataset(errors, dataset_path)
    if result is None:
        return None, 0
    
    return result, len(errors)

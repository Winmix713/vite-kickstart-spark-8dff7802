#!/usr/bin/env python3
"""
Auto Reinforcement Loop - Automatic model fine-tuning based on prediction errors
"""

import json
import logging
import os
import subprocess
import sys
import traceback
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

from .config import (
    DEFAULT_FINE_TUNE_EPOCHS,
    DEFAULT_LEARNING_RATE,
    DEFAULT_LOOKBACK_DAYS,
    MIN_ERROR_SAMPLES_FOR_RETRAINING,
    RETRAINED_MODELS_DIR,
    TEMP_DIR,
)
from .data_loader import prepare_retraining_data
from .supabase_client import (
    get_pending_retraining_requests,
    get_supabase_client,
    insert_retraining_run,
    insert_system_log,
    update_retraining_request,
    update_retraining_run,
    upload_file_to_storage,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class RetrainingError(Exception):
    """Raised when retraining fails"""
    pass


def parse_training_output(output: str) -> Dict:
    """
    Parse training output to extract metrics
    
    Args:
        output: Training script output
        
    Returns:
        Dictionary with metrics
    """
    try:
        # Try to parse JSON output from the training script
        lines = output.strip().split("\n")
        for line in lines:
            if line.strip().startswith("{"):
                try:
                    data = json.loads(line)
                    if "metrics" in data:
                        return data
                except json.JSONDecodeError:
                    pass
        
        # If no JSON found, return empty metrics
        return {"metrics": {}}
    except Exception as e:
        logger.warning(f"Failed to parse training output: {e}")
        return {"metrics": {}}


def run_training(dataset_path: str, output_dir: str, fine_tune: bool = True, epochs: int = 5) -> Optional[Dict]:
    """
    Run the training script
    
    Args:
        dataset_path: Path to the fine-tuning dataset
        output_dir: Directory to save the trained model
        fine_tune: Whether to fine-tune or train from scratch
        epochs: Number of training epochs
        
    Returns:
        Training output parsed as dictionary or None if failed
    """
    try:
        # Determine the script path
        script_path = Path(__file__).parent / "train_model.py"
        
        # Build command
        cmd = [
            sys.executable,
            str(script_path),
            "--dataset", dataset_path,
            "--output_dir", output_dir,
            "--fine_tune", str(fine_tune),
            "--epochs", str(epochs),
            "--learning_rate", str(DEFAULT_LEARNING_RATE),
        ]
        
        logger.info(f"Running training: {' '.join(cmd)}")
        
        # Run training
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minutes timeout
        )
        
        if result.returncode != 0:
            logger.error(f"Training failed with return code {result.returncode}")
            logger.error(f"STDOUT: {result.stdout}")
            logger.error(f"STDERR: {result.stderr}")
            return None
        
        logger.info("Training completed successfully")
        logger.info(f"STDOUT: {result.stdout}")
        
        # Parse output
        output = parse_training_output(result.stdout)
        return output
        
    except subprocess.TimeoutExpired:
        logger.error("Training script timed out")
        return None
    except Exception as e:
        logger.error(f"Failed to run training: {e}")
        return None


def upload_logs_to_storage(logs_content: str, run_id: str) -> str:
    """
    Upload training logs to Supabase Storage
    
    Args:
        logs_content: Log content to upload
        run_id: Retraining run ID
        
    Returns:
        Storage URL
    """
    try:
        temp_log_file = TEMP_DIR / f"training_log_{run_id}.txt"
        
        with open(temp_log_file, "w") as f:
            f.write(logs_content)
        
        log_path = f"training-logs/{run_id}.txt"
        url = upload_file_to_storage("model-artifacts", log_path, str(temp_log_file))
        
        # Clean up temp file
        temp_log_file.unlink(missing_ok=True)
        
        return url
    except Exception as e:
        logger.warning(f"Failed to upload logs to storage: {e}")
        return ""


def process_manual_requests() -> Optional[str]:
    """
    Process manual retraining requests from the queue
    
    Returns:
        Request ID if a request was processed, None otherwise
    """
    requests = get_pending_retraining_requests()
    
    if not requests:
        logger.info("No pending manual retraining requests")
        return None
    
    # Process the first high-priority request
    request = requests[0]
    request_id = request["id"]
    
    logger.info(f"Processing manual retraining request: {request_id}")
    logger.info(f"Priority: {request['priority']}, Reason: {request.get('reason', 'No reason provided')}")
    
    # Update request status to processing
    try:
        update_retraining_request(request_id, {"status": "processing"})
    except Exception as e:
        logger.error(f"Failed to update request status: {e}")
        return None
    
    return request_id


def run_auto_reinforcement(lookback_days: int = DEFAULT_LOOKBACK_DAYS, source: str = "auto_daily", request_id: Optional[str] = None) -> bool:
    """
    Run the auto reinforcement loop
    
    Args:
        lookback_days: Number of days to look back for errors
        source: Source of the retraining trigger
        request_id: Optional request ID if triggered by manual request
        
    Returns:
        True if successful, False otherwise
    """
    run_id = str(uuid.uuid4())
    
    try:
        logger.info("="*60)
        logger.info("Auto Reinforcement Loop Started")
        logger.info("="*60)
        logger.info(f"Run ID: {run_id}")
        logger.info(f"Source: {source}")
        logger.info(f"Lookback days: {lookback_days}")
        
        # Log auto reinforcement start
        insert_system_log(
            component="auto_reinforcement",
            status="info",
            message=f"Auto reinforcement started: {source}",
            details={
                "run_id": run_id,
                "source": source,
                "lookback_days": lookback_days,
            }
        )
        
        # Create retraining run record
        run_record = {
            "id": run_id,
            "source": source,
            "status": "running",
            "fine_tune_flag": True,
            "started_at": datetime.now().isoformat(),
            "triggered_by": None,  # Will be filled by service role
        }
        
        try:
            insert_retraining_run(run_record)
            logger.info(f"Created retraining run record: {run_id}")
        except Exception as e:
            logger.error(f"Failed to create retraining run record: {e}")
            insert_system_log(
                component="auto_reinforcement",
                status="error",
                message=f"Failed to create retraining run record: {str(e)}",
                details={"run_id": run_id, "error": str(e)}
            )
            return False
        
        # Prepare retraining data
        logger.info("Preparing retraining data...")
        dataset_path, error_count = prepare_retraining_data(lookback_days)
        
        if dataset_path is None or error_count < MIN_ERROR_SAMPLES_FOR_RETRAINING:
            logger.warning(f"Insufficient errors for retraining: {error_count} samples (min: {MIN_ERROR_SAMPLES_FOR_RETRAINING})")
            
            insert_system_log(
                component="auto_reinforcement",
                status="warning",
                message=f"Insufficient error samples for retraining: {error_count}",
                details={
                    "run_id": run_id,
                    "error_count": error_count,
                    "min_required": MIN_ERROR_SAMPLES_FOR_RETRAINING,
                }
            )
            
            # Update run record as completed (no action needed)
            update_retraining_run(run_id, {
                "status": "completed",
                "dataset_size": 0,
                "completed_at": datetime.now().isoformat(),
            })
            
            # If this was a manual request, mark it as completed
            if request_id:
                update_retraining_request(request_id, {
                    "status": "completed",
                    "processed_at": datetime.now().isoformat(),
                    "retraining_run_id": run_id,
                })
            
            return True
        
        logger.info(f"Prepared dataset with {error_count} error samples")
        
        # Log dataset prepared
        insert_system_log(
            component="auto_reinforcement",
            status="info",
            message=f"Dataset prepared: {error_count} error samples",
            details={
                "run_id": run_id,
                "dataset_size": error_count,
                "dataset_path": dataset_path,
            }
        )
        
        # Update run record with dataset size
        update_retraining_run(run_id, {"dataset_size": error_count})
        
        # Create output directory
        output_dir = str(RETRAINED_MODELS_DIR / run_id)
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Run training
        logger.info("Running model fine-tuning...")
        training_output = run_training(
            dataset_path,
            output_dir,
            fine_tune=True,
            epochs=DEFAULT_FINE_TUNE_EPOCHS,
        )
        
        if training_output is None:
            raise RetrainingError("Training script failed")
        
        logger.info(f"Training output: {training_output}")
        
        # Extract metrics
        metrics = training_output.get("metrics", {})
        model_path = training_output.get("model_path", "")
        
        logger.info(f"Training metrics: {metrics}")
        logger.info(f"Model saved to: {model_path}")
        
        # Log training success
        insert_system_log(
            component="auto_reinforcement",
            status="info",
            message="Training completed successfully",
            details={
                "run_id": run_id,
                "metrics": metrics,
                "model_path": model_path,
                "dataset_size": error_count,
            }
        )
        
        # Update run record with completion
        update_retraining_run(run_id, {
            "status": "completed",
            "metrics": metrics,
            "completed_at": datetime.now().isoformat(),
        })
        
        # If this was a manual request, mark it as completed
        if request_id:
            update_retraining_request(request_id, {
                "status": "completed",
                "processed_at": datetime.now().isoformat(),
                "retraining_run_id": run_id,
            })
        
        logger.info("="*60)
        logger.info("Auto Reinforcement Loop Completed Successfully")
        logger.info("="*60)
        
        return True
        
    except Exception as e:
        logger.error(f"Auto reinforcement failed: {e}", exc_info=True)
        
        # Log error with stack trace
        error_details = {
            "run_id": run_id,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc(),
        }
        
        insert_system_log(
            component="auto_reinforcement",
            status="error",
            message=f"Auto reinforcement failed: {str(e)}",
            details=error_details
        )
        
        # Update run record with failure
        try:
            update_retraining_run(run_id, {
                "status": "failed",
                "error_message": str(e),
                "completed_at": datetime.now().isoformat(),
            })
            
            # If this was a manual request, mark it as completed with error
            if request_id:
                update_retraining_request(request_id, {
                    "status": "completed",
                    "processed_at": datetime.now().isoformat(),
                    "retraining_run_id": run_id,
                })
        except Exception as update_error:
            logger.error(f"Failed to update run record with failure: {update_error}")
        
        return False


def main():
    """Main entry point for auto reinforcement"""
    try:
        # First, check if there are any manual retraining requests to process
        manual_request_id = process_manual_requests()
        
        if manual_request_id:
            # Process manual request
            success = run_auto_reinforcement(
                lookback_days=DEFAULT_LOOKBACK_DAYS,
                source="manual",
                request_id=manual_request_id,
            )
        else:
            # Run automatic daily reinforcement
            success = run_auto_reinforcement(
                lookback_days=DEFAULT_LOOKBACK_DAYS,
                source="auto_daily",
            )
        
        sys.exit(0 if success else 1)
        
    except Exception as e:
        logger.error(f"Unexpected error in auto reinforcement: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

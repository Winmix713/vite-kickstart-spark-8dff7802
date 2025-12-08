"""
Supabase client for ML Pipeline
"""

import logging
from typing import Optional

from supabase import create_client

from .config import SUPABASE_SERVICE_KEY, SUPABASE_URL

logger = logging.getLogger(__name__)

_supabase_client: Optional[object] = None


def get_supabase_client():
    """
    Get or create Supabase client singleton
    
    Returns:
        Supabase client instance
    """
    global _supabase_client
    
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required"
            )
        
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        logger.info("Supabase client initialized")
    
    return _supabase_client


def download_file_from_storage(bucket: str, path: str, local_path: str) -> str:
    """
    Download file from Supabase Storage
    
    Args:
        bucket: Storage bucket name
        path: Path to file in bucket
        local_path: Local path to save file
        
    Returns:
        Path to downloaded file
    """
    client = get_supabase_client()
    
    try:
        data = client.storage.from_(bucket).download(path)
        
        with open(local_path, "wb") as f:
            f.write(data)
        
        logger.info(f"Downloaded {path} from {bucket} to {local_path}")
        return local_path
    except Exception as e:
        logger.error(f"Failed to download {path} from {bucket}: {str(e)}")
        raise


def upload_file_to_storage(bucket: str, path: str, file_path: str) -> str:
    """
    Upload file to Supabase Storage
    
    Args:
        bucket: Storage bucket name
        path: Path to store file in bucket
        file_path: Local file path
        
    Returns:
        Storage URL
    """
    client = get_supabase_client()
    
    try:
        with open(file_path, "rb") as f:
            file_data = f.read()
        
        client.storage.from_(bucket).upload(path, file_data)
        logger.info(f"Uploaded {file_path} to {bucket}/{path}")
        
        # Return public URL
        return f"{client.storage.url}/{bucket}/{path}"
    except Exception as e:
        logger.error(f"Failed to upload {file_path} to {bucket}: {str(e)}")
        raise


def insert_retraining_run(run_data: dict) -> dict:
    """
    Insert model retraining run record
    
    Args:
        run_data: Dictionary with run information
        
    Returns:
        Inserted record
    """
    client = get_supabase_client()
    
    try:
        response = client.table("model_retraining_runs").insert(run_data).execute()
        logger.info(f"Inserted retraining run: {run_data.get('id', 'unknown')}")
        return response.data[0] if response.data else {}
    except Exception as e:
        logger.error(f"Failed to insert retraining run: {str(e)}")
        raise


def update_retraining_run(run_id: str, update_data: dict) -> dict:
    """
    Update model retraining run record
    
    Args:
        run_id: ID of the run to update
        update_data: Dictionary with fields to update
        
    Returns:
        Updated record
    """
    client = get_supabase_client()
    
    try:
        response = client.table("model_retraining_runs").update(update_data).eq("id", run_id).execute()
        logger.info(f"Updated retraining run: {run_id}")
        return response.data[0] if response.data else {}
    except Exception as e:
        logger.error(f"Failed to update retraining run {run_id}: {str(e)}")
        raise


def get_latest_retraining_run() -> Optional[dict]:
    """
    Get the latest retraining run
    
    Returns:
        Latest retraining run record or None
    """
    client = get_supabase_client()
    
    try:
        response = (
            client.table("model_retraining_runs")
            .select("*")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Failed to get latest retraining run: {str(e)}")
        return None


def get_pending_retraining_requests() -> list:
    """
    Get all pending retraining requests
    
    Returns:
        List of pending requests
    """
    client = get_supabase_client()
    
    try:
        response = (
            client.table("model_retraining_requests")
            .select("*")
            .eq("status", "pending")
            .order("priority", desc=True)
            .order("created_at", desc=False)
            .execute()
        )
        
        return response.data if response.data else []
    except Exception as e:
        logger.error(f"Failed to get pending retraining requests: {str(e)}")
        return []


def update_retraining_request(request_id: str, update_data: dict) -> dict:
    """
    Update retraining request record
    
    Args:
        request_id: ID of the request to update
        update_data: Dictionary with fields to update
        
    Returns:
        Updated record
    """
    client = get_supabase_client()
    
    try:
        response = client.table("model_retraining_requests").update(update_data).eq("id", request_id).execute()
        logger.info(f"Updated retraining request: {request_id}")
        return response.data[0] if response.data else {}
    except Exception as e:
        logger.error(f"Failed to update retraining request {request_id}: {str(e)}")
        raise


def insert_system_log(component: str, status: str, message: str, details: Optional[dict] = None) -> bool:
    """
    Insert a system log entry. Handles connectivity failures gracefully.
    
    Args:
        component: Source component (e.g., 'train_model', 'auto_reinforcement')
        status: Log status ('info', 'warning', 'error')
        message: Human-readable log message
        details: Optional additional structured data
        
    Returns:
        True if logged successfully, False otherwise
    """
    try:
        client = get_supabase_client()
        
        log_data = {
            "component": component,
            "status": status,
            "message": message,
            "details": details or {},
        }
        
        client.table("system_logs").insert(log_data).execute()
        logger.debug(f"System log inserted: {component} - {status} - {message}")
        return True
    except Exception as e:
        # Gracefully handle logging failures - don't crash the pipeline
        logger.warning(f"Failed to insert system log: {e}")
        return False

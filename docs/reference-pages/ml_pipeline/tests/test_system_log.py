"""Unit tests for system log functionality"""

import unittest
from unittest.mock import MagicMock, patch

from ml_pipeline.supabase_client import insert_system_log


class TestSystemLog(unittest.TestCase):
    """Tests for system log helper"""

    @patch("ml_pipeline.supabase_client.get_supabase_client")
    def test_insert_system_log_success(self, mock_get_client):
        """Test successful system log insertion"""
        # Mock Supabase client
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_insert = MagicMock()
        mock_execute = MagicMock()
        
        mock_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value = mock_execute
        mock_get_client.return_value = mock_client
        
        # Call the function
        result = insert_system_log(
            component="test_component",
            status="info",
            message="Test message",
            details={"key": "value"}
        )
        
        # Assertions
        self.assertTrue(result)
        mock_client.table.assert_called_once_with("system_logs")
        mock_table.insert.assert_called_once()
        
        # Check the data passed to insert
        call_args = mock_table.insert.call_args[0][0]
        self.assertEqual(call_args["component"], "test_component")
        self.assertEqual(call_args["status"], "info")
        self.assertEqual(call_args["message"], "Test message")
        self.assertEqual(call_args["details"], {"key": "value"})

    @patch("ml_pipeline.supabase_client.get_supabase_client")
    def test_insert_system_log_without_details(self, mock_get_client):
        """Test system log insertion without details"""
        # Mock Supabase client
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_insert = MagicMock()
        mock_execute = MagicMock()
        
        mock_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value = mock_execute
        mock_get_client.return_value = mock_client
        
        # Call the function without details
        result = insert_system_log(
            component="test_component",
            status="warning",
            message="Warning message"
        )
        
        # Assertions
        self.assertTrue(result)
        
        # Check the data passed to insert
        call_args = mock_table.insert.call_args[0][0]
        self.assertEqual(call_args["details"], {})

    @patch("ml_pipeline.supabase_client.get_supabase_client")
    def test_insert_system_log_error_handling(self, mock_get_client):
        """Test that system log insertion handles errors gracefully"""
        # Mock Supabase client to raise an exception
        mock_client = MagicMock()
        mock_client.table.side_effect = Exception("Database connection error")
        mock_get_client.return_value = mock_client
        
        # Call the function - should not raise exception
        result = insert_system_log(
            component="test_component",
            status="error",
            message="Error message",
            details={"error": "details"}
        )
        
        # Assertions - should return False but not crash
        self.assertFalse(result)

    @patch("ml_pipeline.supabase_client.get_supabase_client")
    def test_insert_system_log_all_statuses(self, mock_get_client):
        """Test system log with all valid statuses"""
        # Mock Supabase client
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_insert = MagicMock()
        mock_execute = MagicMock()
        
        mock_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value = mock_execute
        mock_get_client.return_value = mock_client
        
        # Test all valid statuses
        for status in ["info", "warning", "error"]:
            result = insert_system_log(
                component="test_component",
                status=status,
                message=f"Test {status} message"
            )
            self.assertTrue(result)


if __name__ == "__main__":
    unittest.main()

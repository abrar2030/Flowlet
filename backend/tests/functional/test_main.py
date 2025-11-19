"""
Test the enhanced main application
"""

import json

import pytest
from src.main import create_app


def test_app_creation():
    """Test that the app can be created."""
    app = create_app("testing")
    assert app is not None
    assert app.config["TESTING"] is True


def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200

    data = json.loads(response.data)
    assert "status" in data
    assert "timestamp" in data
    assert "version" in data
    assert "services" in data


def test_api_info(client):
    """Test the API info endpoint."""
    response = client.get("/api/v1/info")
    assert response.status_code == 200

    data = json.loads(response.data)
    assert "api_name" in data
    assert "version" in data
    assert "endpoints" in data
    assert "security_features" in data


def test_security_headers(client):
    """Test that security headers are present."""
    response = client.get("/api/v1/info")

    # Check for security headers
    assert "X-Content-Type-Options" in response.headers
    assert response.headers["X-Content-Type-Options"] == "nosniff"

    assert "X-Frame-Options" in response.headers
    assert response.headers["X-Frame-Options"] == "DENY"

    assert "X-XSS-Protection" in response.headers
    assert "Strict-Transport-Security" in response.headers
    assert "Content-Security-Policy" in response.headers


def test_404_error_handling(client):
    """Test 404 error handling."""
    response = client.get("/nonexistent-endpoint")
    assert response.status_code == 404

    data = json.loads(response.data)
    assert data["error"] == "Not Found"
    assert data["code"] == "NOT_FOUND"
    assert "timestamp" in data


def test_cors_headers(client):
    """Test CORS headers are present."""
    response = client.options("/api/v1/info")
    assert "Access-Control-Allow-Origin" in response.headers


def test_json_content_type_validation(client):
    """Test that non-JSON requests to POST endpoints are rejected."""
    response = client.post(
        "/api/v1/auth/login", data="not json", content_type="text/plain"
    )
    assert response.status_code == 400

# Test Configuration for Enhanced Flowlet Backend
import pytest
import tempfile
import os
from src.main import create_app
from src.models.enhanced_database import db

@pytest.fixture
def app():
    """Create application for testing"""
    # Create temporary database
    db_fd, db_path = tempfile.mkstemp()
    
    app = create_app('testing')
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'JWT_SECRET_KEY': 'test-secret-key-for-testing-only',
        'REDIS_URL': 'redis://localhost:6379/1',  # Use different DB for testing
        'WTF_CSRF_ENABLED': False
    })
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()
    
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create test runner"""
    return app.test_cli_runner()

@pytest.fixture
def auth_headers(client):
    """Create authentication headers for testing"""
    # Create test user and get token
    user_data = {
        'email': 'test@example.com',
        'password': 'TestPassword123!',
        'first_name': 'Test',
        'last_name': 'User'
    }
    
    # Register user
    client.post('/api/v1/auth/register', json=user_data)
    
    # Login to get token
    login_response = client.post('/api/v1/auth/login', json={
        'email': user_data['email'],
        'password': user_data['password']
    })
    
    token = login_response.get_json()['access_token']
    
    return {'Authorization': f'Bearer {token}'}

class TestConfig:
    """Test configuration constants"""
    TEST_USER_EMAIL = 'test@example.com'
    TEST_USER_PASSWORD = 'TestPassword123!'
    TEST_WALLET_CURRENCY = 'USD'
    TEST_TRANSACTION_AMOUNT = '100.00'


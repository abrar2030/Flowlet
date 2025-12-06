import os
import tempfile
import pytest
from src.main import create_app
from src.models.database import db

"\nTest configuration for the enhanced Flowlet backend\n"


@pytest.fixture
def app() -> Any:
    """Create and configure a new app instance for each test."""
    db_fd, db_path = tempfile.mkstemp()
    app = create_app("testing")
    app.config.update(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
            "SECRET_KEY": "test-secret-key",
            "JWT_SECRET_KEY": "test-jwt-secret",
            "WTF_CSRF_ENABLED": False,
            "REDIS_URL": None,
        }
    )
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app: Any) -> Any:
    """A test client for the app."""
    return app.test_client()


@pytest.fixture
def runner(app: Any) -> Any:
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()


@pytest.fixture
def auth_headers() -> Any:
    """Sample authentication headers for testing."""
    return {"Authorization": "Bearer test-token", "Content-Type": "application/json"}


@pytest.fixture
def sample_user_data() -> Any:
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "username": "testuser",
        "password": "TestPassword123!",
        "first_name": "Test",
        "last_name": "User",
    }


@pytest.fixture
def sample_transaction_data() -> Any:
    """Sample transaction data for testing."""
    return {
        "amount": 100.0,
        "currency": "USD",
        "description": "Test transaction",
        "account_id": "test-account-123",
    }

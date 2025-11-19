# Flowlet Application Testing Guide

This guide outlines the testing methodologies and practices for the Flowlet application components, including unit, integration, and end-to-end (E2E) testing for both backend services and frontend applications.

## Overview

Flowlet employs a multi-layered testing strategy to ensure the reliability, functionality, and performance of its services:

- **Unit Tests**: Verify the correctness of individual functions, methods, or classes in isolation.
- **Integration Tests**: Confirm that different modules or services interact correctly with each other.
- **End-to-End (E2E) Tests**: Simulate real user scenarios to validate the entire application flow from start to finish.

For infrastructure-level testing, refer to the [Infrastructure Testing Guide](../infrastructure/testing-guide.md).

## Backend Testing

The backend services are primarily written in Python (Flask) and utilize `pytest` for testing.

### Unit Tests

Unit tests for backend services are located in the `Flowlet/backend/src/` directory, typically alongside the code they test or in a dedicated `tests/unit/` subdirectory within each service module.

**Running Unit Tests**:

Navigate to the `Flowlet/backend/` directory and run `pytest`:

```bash
cd Flowlet/backend/
pip install -r requirements.txt # Ensure test dependencies are installed
pytest src/tests/unit/
```

**Example Test Structure**:

```python
# Flowlet/backend/src/wallet/tests/unit/test_wallet_logic.py

import pytest
from src.wallet.logic import calculate_balance

def test_calculate_balance_positive():
    transactions = [100, -50, 20]
    assert calculate_balance(transactions) == 70

def test_calculate_balance_empty():
    transactions = []
    assert calculate_balance(transactions) == 0
```

### Integration Tests

Integration tests for backend services focus on verifying the interaction between different service components (e.g., a service interacting with its database, or two services communicating via an API).

Integration tests are typically found in `Flowlet/backend/tests/integration/`.

**Running Integration Tests**:

```bash
cd Flowlet/backend/
pytest tests/integration/
```

**Example Test Structure**:

```python
# Flowlet/backend/tests/integration/test_wallet_service_db.py

import pytest
from src.main import app
from src.models.database import db
from src.models.wallet import Wallet

@pytest.fixture(scope=\


function\


```python
    "session", autouse=True)
def setup_db():
    with app.app_context():
        db.create_all()
        yield
        db.drop_all()

def test_create_wallet_integration(setup_db):
    with app.test_client() as client:
        response = client.post(
            '/api/v1/wallet/',
            json={
                "userId": "test_user_1",
                "currency": "USD",
                "type": "personal"
            }
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["userId"] == "test_user_1"
        assert data["currency"] == "USD"
        assert data["type"] == "personal"

        wallet = Wallet.query.filter_by(userId="test_user_1").first()
        assert wallet is not None
```

### End-to-End (E2E) Tests

E2E tests simulate complete user flows, interacting with the application through its external interfaces (e.g., API Gateway, web frontend). These tests verify that all components work together seamlessly.

E2E tests are located in `Flowlet/tests/e2e/`.

**Running E2E Tests**:

```bash
cd Flowlet/tests/
pytest e2e/
```

**Example Test Structure**:

```python
# Flowlet/tests/e2e/test_user_flow.py

import requests

BASE_URL = "http://localhost:5000/api/v1" # Adjust if your API Gateway is on a different port/host

def test_full_user_registration_and_wallet_creation():
    # 1. Register a new user
    signup_data = {
        "email": "e2e_test_user@example.com",
        "password": "secure_password",
        "username": "e2e_test_user"
    }
    response = requests.post(f"{BASE_URL}/security/register", json=signup_data)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == signup_data["email"]

    # 2. Login and get token
    login_data = {
        "email": "e2e_test_user@example.com",
        "password": "secure_password"
    }
    response = requests.post(f"{BASE_URL}/security/login", json=login_data)
    assert response.status_code == 200
    token = response.json()["token"]

    # 3. Create a wallet for the new user
    headers = {"Authorization": f"Bearer {token}"}
    wallet_data = {
        "userId": user_data["id"], # Assuming user_data contains the user ID
        "currency": "USD",
        "type": "personal"
    }
    response = requests.post(f"{BASE_URL}/wallet/", headers=headers, json=wallet_data)
    assert response.status_code == 200
    wallet_data = response.json()
    assert wallet_data["currency"] == "USD"
```

## Frontend Testing

The Flowlet web frontend is built with React. Testing is typically done using testing libraries like `@testing-library/react` and a test runner like `Vitest` or `Jest`.

### Unit Tests

Unit tests for React components focus on testing individual components in isolation, ensuring they render correctly and respond to user interactions as expected.

**Running Unit Tests**:

Navigate to the `Flowlet/frontend/web-frontend/` directory and run the test command (assuming `Vitest` is configured):

```bash
cd Flowlet/frontend/web-frontend/
pnpm test
```

**Example Test Structure**:

```jsx
// Flowlet/frontend/web-frontend/src/components/Button.test.jsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

test('renders button with correct text', () => {
  render(<Button>Click Me</Button>);
  expect(screen.getByText(/Click Me/i)).toBeInTheDocument();
});

test('calls onClick prop when clicked', async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click Me</Button>);
  await userEvent.click(screen.getByText(/Click Me/i));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### E2E Tests (Frontend)

Frontend E2E tests can be performed using tools like Cypress or Playwright to simulate user interactions directly in a browser. These tests would cover complete user journeys within the web application.

(Note: Specific E2E tests for the frontend are not explicitly provided in the repository structure, but this section outlines how they would typically be implemented.)

## Performance Testing

Performance tests are crucial for identifying bottlenecks and ensuring the application can handle expected loads. The `Flowlet/tests/performance/` directory contains performance testing scripts.

**Running Performance Tests**:

```bash
cd Flowlet/tests/
locust -f performance/locustfile.py
```

This will start the Locust web UI, usually accessible at `http://localhost:8089`, where you can configure and run load tests.

## Automated Testing

It is recommended to integrate these tests into a Continuous Integration (CI) pipeline to ensure that all changes are automatically tested before deployment. Refer to the [Infrastructure Testing Guide](../infrastructure/docs/testing-guide.md) for an example of a CI workflow.

import locust
import time
import random
from locust import HttpUser, task, between

class FlowletPerformanceTest(HttpUser):
    wait_time = between(1, 5)
    
    def on_start(self):
        # Login to get authentication token
        response = self.client.post("/v1/auth/login", json={
            "email": f"test{random.randint(1, 1000)}@example.com",
            "password": "TestPassword123!"
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            # Create a test user if login fails
            self.client.post("/v1/auth/register", json={
                "email": f"test{random.randint(1, 1000)}@example.com",
                "password": "TestPassword123!"
            })
            # Try login again
            response = self.client.post("/v1/auth/login", json={
                "email": f"test{random.randint(1, 1000)}@example.com",
                "password": "TestPassword123!"
            })
            self.token = response.json()["token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(10)
    def get_wallet_balance(self):
        # Get list of wallets
        wallets_response = self.client.get("/v1/wallets", headers=self.headers)
        if wallets_response.status_code == 200 and len(wallets_response.json()["data"]) > 0:
            wallet_id = wallets_response.json()["data"][0]["id"]
            # Get wallet balance
            self.client.get(f"/v1/wallets/{wallet_id}/balance", headers=self.headers)
    
    @task(5)
    def create_wallet(self):
        self.client.post("/v1/wallets", headers=self.headers, json={
            "type": "individual",
            "currency": "USD",
            "metadata": {
                "name": f"Test Wallet {random.randint(1, 1000)}"
            }
        })
    
    @task(3)
    def create_payment(self):
        # Get list of wallets
        wallets_response = self.client.get("/v1/wallets", headers=self.headers)
        if wallets_response.status_code == 200 and len(wallets_response.json()["data"]) > 0:
            wallet_id = wallets_response.json()["data"][0]["id"]
            # Create payment
            self.client.post("/v1/payments", headers=self.headers, json={
                "sourceType": "wallet",
                "sourceId": wallet_id,
                "destinationType": "external_account",
                "destinationId": f"account-{random.randint(1000, 9999)}",
                "amount": random.randint(100, 10000),
                "currency": "USD",
                "description": "Performance test payment"
            })
    
    @task(1)
    def get_transaction_history(self):
        # Get list of wallets
        wallets_response = self.client.get("/v1/wallets", headers=self.headers)
        if wallets_response.status_code == 200 and len(wallets_response.json()["data"]) > 0:
            wallet_id = wallets_response.json()["data"][0]["id"]
            # Get transaction history
            self.client.get(f"/v1/wallets/{wallet_id}/transactions", headers=self.headers)

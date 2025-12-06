from locust import HttpUser, between, task


class FlowletUser(HttpUser):
    wait_time = between(1, 2)

    @task
    def register_and_login(self) -> Any:
        self.client.post(
            "/register", json={"username": "testuser", "password": "password123"}
        )
        self.client.post(
            "/login", json={"username": "testuser", "password": "password123"}
        )

    @task
    def wallet_operations(self) -> Any:
        self.client.post(
            "/wallet/create", json={"user_id": "testuser", "currency": "USD"}
        )
        self.client.post(
            "/wallet/deposit", json={"wallet_id": "testuser_wallet_USD", "amount": 100}
        )
        self.client.post(
            "/wallet/withdraw", json={"wallet_id": "testuser_wallet_USD", "amount": 50}
        )

    @task
    def make_payment(self) -> Any:
        self.client.post(
            "/payment/make",
            json={
                "sender_id": "testuser",
                "recipient_id": "merchant",
                "amount": 25,
                "currency": "USD",
            },
        )

    @task
    def load_spike_scenario(self) -> Any:
        self.client.post("/spike_endpoint", json={"data": "high_volume_request"})

    @task
    def long_duration_scenario(self) -> Any:
        self.client.get("/health_check")

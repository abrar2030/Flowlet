import json
import os
import statistics
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import psutil
import pytest
from src.main import create_app

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


class TestPerformanceMetrics:
    """Test performance metrics and benchmarks"""

    @pytest.fixture
    def app(self) -> Any:
        """Create application for performance testing"""
        app = create_app("testing")
        return app

    @pytest.fixture
    def client(self, app: Any) -> Any:
        """Create test client for performance testing"""
        return app.test_client()

    def test_api_response_time_benchmarks(self, client: Any) -> Any:
        """Test API response time benchmarks"""
        endpoints = ["/health", "/api/v1/info"]
        response_times = {}
        for endpoint in endpoints:
            times = []
            for _ in range(10):
                start_time = time.time()
                response = client.get(endpoint)
                end_time = time.time()
                assert response.status_code == 200
                times.append(end_time - start_time)
            response_times[endpoint] = {
                "avg": statistics.mean(times),
                "min": min(times),
                "max": max(times),
                "median": statistics.median(times),
            }
        for endpoint, metrics in response_times.items():
            assert (
                metrics["avg"] < 0.5
            ), f"{endpoint} average response time too slow: {metrics['avg']:.3f}s"
            assert (
                metrics["max"] < 1.0
            ), f"{endpoint} max response time too slow: {metrics['max']:.3f}s"

    def test_concurrent_request_handling(self, client: Any) -> Any:
        """Test handling of concurrent requests"""

        def make_request():
            start_time = time.time()
            response = client.get("/api/v1/info")
            end_time = time.time()
            return {
                "status_code": response.status_code,
                "response_time": end_time - start_time,
            }

        with ThreadPoolExecutor(max_workers=50) as executor:
            futures = [executor.submit(make_request) for _ in range(50)]
            results = [future.result() for future in as_completed(futures)]
        successful_requests = [r for r in results if r["status_code"] == 200]
        response_times = [r["response_time"] for r in successful_requests]
        assert len(successful_requests) == 50, "Not all concurrent requests succeeded"
        assert (
            statistics.mean(response_times) < 1.0
        ), "Average response time under load too slow"
        assert max(response_times) < 2.0, "Maximum response time under load too slow"

    def test_memory_usage_under_load(self, client: Any) -> Any:
        """Test memory usage under load"""
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024
        for _ in range(100):
            response = client.get("/api/v1/info")
            assert response.status_code == 200
        final_memory = process.memory_info().rss / 1024 / 1024
        memory_increase = final_memory - initial_memory
        assert (
            memory_increase < 50
        ), f"Memory usage increased too much: {memory_increase:.2f}MB"


class TestDatabasePerformance:
    """Test database performance under various conditions"""

    @pytest.fixture
    def app_with_db(self) -> Any:
        """Create application with database for performance testing"""
        app = create_app("testing")
        with app.app_context():
            from src.models.database import db

            db.create_all()
            yield app
            db.session.remove()
            db.drop_all()

    def test_database_query_performance(self, app_with_db: Any) -> Any:
        """Test database query performance"""
        with app_with_db.app_context():
            from src.models.database import db
            from src.models.user import User

            users = []
            for i in range(1000):
                user = User(
                    email=f"user{i}@test.com", first_name=f"User{i}", last_name="Test"
                )
                users.append(user)
            db.session.add_all(users)
            db.session.commit()
            start_time = time.time()
            result = User.query.filter(User.email.like("%500%")).all()
            end_time = time.time()
            query_time = end_time - start_time
            assert query_time < 0.1, f"Database query too slow: {query_time:.3f}s"
            assert len(result) > 0, "Query should return results"

    def test_database_connection_pool_performance(self, app_with_db: Any) -> Any:
        """Test database connection pool performance"""
        with app_with_db.app_context():
            from sqlalchemy import text
            from src.models.database import db

            def execute_query():
                start_time = time.time()
                result = db.session.execute(text("SELECT 1"))
                result.fetchone()
                end_time = time.time()
                return end_time - start_time

            with ThreadPoolExecutor(max_workers=20) as executor:
                futures = [executor.submit(execute_query) for _ in range(100)]
                query_times = [future.result() for future in as_completed(futures)]
            avg_query_time = statistics.mean(query_times)
            max_query_time = max(query_times)
            assert (
                avg_query_time < 0.05
            ), f"Average query time too slow: {avg_query_time:.3f}s"
            assert (
                max_query_time < 0.2
            ), f"Maximum query time too slow: {max_query_time:.3f}s"


class TestAPIGatewayPerformance:
    """Test API Gateway performance and optimization"""

    def test_request_routing_performance(self, client: Any) -> Any:
        """Test request routing performance"""
        routes = [
            "/health",
            "/api/v1/info",
            "/api/v1/wallet/balance/test",
            "/api/v1/payment/status/test",
            "/api/v1/card/details/test",
        ]
        routing_times = {}
        for route in routes:
            times = []
            for _ in range(20):
                start_time = time.time()
                client.get(route)
                end_time = time.time()
                times.append(end_time - start_time)
            routing_times[route] = statistics.mean(times)
        for route, avg_time in routing_times.items():
            assert avg_time < 0.1, f"Route {route} processing too slow: {avg_time:.3f}s"

    def test_middleware_performance(self, client: Any) -> Any:
        """Test middleware performance impact"""
        start_time = time.time()
        for _ in range(50):
            response = client.get("/api/v1/info")
            assert response.status_code == 200
        end_time = time.time()
        total_time = end_time - start_time
        avg_time_per_request = total_time / 50
        assert (
            avg_time_per_request < 0.1
        ), f"Middleware overhead too high: {avg_time_per_request:.3f}s per request"


class TestCachePerformance:
    """Test caching performance and effectiveness"""

    @patch("redis.Redis")
    def test_cache_hit_performance(self, mock_redis: Any, client: Any) -> Any:
        """Test cache hit performance"""
        mock_redis_client = Mock()
        mock_redis.return_value = mock_redis_client
        mock_redis_client.get.return_value = json.dumps({"cached": "data"})
        from src.services.cache.redis_service import RedisService

        cache_service = RedisService()
        hit_times = []
        for _ in range(100):
            start_time = time.time()
            cache_service.get("test_key")
            end_time = time.time()
            hit_times.append(end_time - start_time)
        avg_hit_time = statistics.mean(hit_times)
        assert avg_hit_time < 0.001, f"Cache hit time too slow: {avg_hit_time:.6f}s"

    @patch("redis.Redis")
    def test_cache_miss_performance(self, mock_redis: Any, client: Any) -> Any:
        """Test cache miss and set performance"""
        mock_redis_client = Mock()
        mock_redis.return_value = mock_redis_client
        mock_redis_client.get.return_value = None
        mock_redis_client.set.return_value = True
        from src.services.cache.redis_service import RedisService

        cache_service = RedisService()
        miss_times = []
        for i in range(50):
            start_time = time.time()
            result = cache_service.get(f"test_key_{i}")
            if result is None:
                cache_service.set(f"test_key_{i}", f"test_value_{i}")
            end_time = time.time()
            miss_times.append(end_time - start_time)
        avg_miss_time = statistics.mean(miss_times)
        assert (
            avg_miss_time < 0.01
        ), f"Cache miss and set time too slow: {avg_miss_time:.6f}s"


class TestSecurityPerformance:
    """Test security feature performance impact"""

    def test_rate_limiting_performance(self, client: Any) -> Any:
        """Test rate limiting performance impact"""
        start_time = time.time()
        for _ in range(50):
            response = client.get("/api/v1/info")
            assert response.status_code == 200
        end_time = time.time()
        total_time = end_time - start_time
        avg_time = total_time / 50
        assert (
            avg_time < 0.05
        ), f"Rate limiting overhead too high: {avg_time:.3f}s per request"

    def test_authentication_performance(self, client: Any) -> Any:
        """Test authentication performance"""
        auth_headers = {
            "Authorization": "Bearer test-token",
            "Content-Type": "application/json",
        }
        auth_times = []
        for _ in range(30):
            start_time = time.time()
            response = client.get("/api/v1/info", headers=auth_headers)
            end_time = time.time()
            auth_times.append(end_time - start_time)
        avg_auth_time = statistics.mean(auth_times)
        assert (
            avg_auth_time < 0.1
        ), f"Authentication overhead too high: {avg_auth_time:.3f}s"


class TestScalabilityMetrics:
    """Test scalability metrics and limits"""

    def test_concurrent_user_simulation(self, client: Any) -> Any:
        """Simulate concurrent users and measure performance"""

        def simulate_user_session():
            """Simulate a user session with multiple requests"""
            session_times = []
            start_time = time.time()
            client.get("/api/v1/info")
            session_times.append(time.time() - start_time)
            for _ in range(5):
                start_time = time.time()
                client.get("/health")
                session_times.append(time.time() - start_time)
            return {
                "total_time": sum(session_times),
                "avg_request_time": statistics.mean(session_times),
                "request_count": len(session_times),
            }

        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(simulate_user_session) for _ in range(20)]
            sessions = [future.result() for future in as_completed(futures)]
        total_times = [s["total_time"] for s in sessions]
        avg_request_times = [s["avg_request_time"] for s in sessions]
        assert statistics.mean(total_times) < 2.0, "User session time too long"
        assert (
            statistics.mean(avg_request_times) < 0.2
        ), "Average request time under load too slow"

    def test_throughput_measurement(self, client: Any) -> Any:
        """Measure API throughput (requests per second)"""
        request_count = 200
        start_time = time.time()
        for _ in range(request_count):
            response = client.get("/health")
            assert response.status_code == 200
        end_time = time.time()
        total_time = end_time - start_time
        throughput = request_count / total_time
        assert throughput > 100, f"Throughput too low: {throughput:.2f} requests/second"


class TestResourceUtilization:
    """Test resource utilization under load"""

    def test_cpu_usage_under_load(self, client: Any) -> Any:
        """Test CPU usage under load"""
        process = psutil.Process(os.getpid())
        process.cpu_percent()
        time.sleep(1)
        start_time = time.time()
        while time.time() - start_time < 5:
            response = client.get("/api/v1/info")
            assert response.status_code == 200
        cpu_after = process.cpu_percent()
        assert cpu_after < 80, f"CPU usage too high under load: {cpu_after}%"

    def test_file_descriptor_usage(self, client: Any) -> Any:
        """Test file descriptor usage"""
        process = psutil.Process(os.getpid())
        initial_fds = process.num_fds() if hasattr(process, "num_fds") else 0
        for _ in range(100):
            response = client.get("/health")
            assert response.status_code == 200
        final_fds = process.num_fds() if hasattr(process, "num_fds") else 0
        if initial_fds > 0:
            fd_increase = final_fds - initial_fds
            assert fd_increase < 50, f"Too many file descriptors opened: {fd_increase}"


class TestErrorHandlingPerformance:
    """Test error handling performance"""

    def test_error_response_time(self, client: Any) -> Any:
        """Test error response time"""
        error_endpoints = [
            "/api/v1/nonexistent",
            "/api/v1/wallet/invalid_id",
            "/api/v1/payment/invalid_id",
        ]
        for endpoint in error_endpoints:
            error_times = []
            for _ in range(10):
                start_time = time.time()
                response = client.get(endpoint)
                end_time = time.time()
                error_times.append(end_time - start_time)
                assert response.status_code in [404, 400, 500]
            avg_error_time = statistics.mean(error_times)
            assert (
                avg_error_time < 0.1
            ), f"Error handling too slow for {endpoint}: {avg_error_time:.3f}s"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

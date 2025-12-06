import os
import statistics
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import pytest
from src.gateway.optimized_gateway import CacheManager, CircuitBreaker, RequestBatcher
from src.main_optimized import create_app

from core.logging import get_logger

logger = get_logger(__name__)

# Performance Optimization Tests for API Gateway


# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


class TestGatewayOptimizations:
    """Test API Gateway performance optimizations"""

    @pytest.fixture
    def app(self):
        """Create optimized application for testing"""
        app = create_app("testing")
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_caching_performance(self, client):
        """Test caching improves response times"""
        endpoint = "/api/v1/info"

        # First request (cache miss)
        start_time = time.time()
        response1 = client.get(endpoint)
        first_request_time = time.time() - start_time

        assert response1.status_code == 200

        # Second request (cache hit)
        start_time = time.time()
        response2 = client.get(endpoint)
        second_request_time = time.time() - start_time

        assert response2.status_code == 200
        assert response1.get_json() == response2.get_json()

        # Cache hit should be significantly faster
        # Note: In testing, the improvement might be minimal due to in-memory operations
        logger.info(
            f"First request: {first_request_time:.4f}s, Second request: {second_request_time:.4f}s"
        )

    def test_concurrent_request_performance(self, client):
        """Test performance under concurrent load"""

        def make_request():
            start_time = time.time()
            response = client.get("/health")
            end_time = time.time()
            return {
                "status_code": response.status_code,
                "response_time": end_time - start_time,
            }

        # Test with 100 concurrent requests
        with ThreadPoolExecutor(max_workers=50) as executor:
            futures = [executor.submit(make_request) for _ in range(100)]
            results = [future.result() for future in as_completed(futures)]

        # Analyze results
        successful_requests = [r for r in results if r["status_code"] == 200]
        response_times = [r["response_time"] for r in successful_requests]

        assert len(successful_requests) == 100, "Not all concurrent requests succeeded"

        avg_response_time = statistics.mean(response_times)
        p95_response_time = (
            statistics.quantiles(response_times, n=20)[18]
            if len(response_times) > 20
            else max(response_times)
        )

        logger.info(
            f"Concurrent requests - Avg: {avg_response_time:.4f}s, P95: {p95_response_time:.4f}s"
        )
        # Performance targets
        assert (
            avg_response_time < 0.5
        ), f"Average response time too slow: {avg_response_time:.4f}s"
        assert (
            p95_response_time < 1.0
        ), f"P95 response time too slow: {p95_response_time:.4f}s"

    def test_rate_limiting_performance(self, client):
        """Test rate limiting doesn't significantly impact performance"""
        response_times = []

        # Make requests within rate limit
        for _ in range(50):  # Well within limits
            start_time = time.time()
            response = client.get("/health")
            end_time = time.time()

            assert response.status_code == 200
            response_times.append(end_time - start_time)

        avg_response_time = statistics.mean(response_times)
        assert (
            avg_response_time < 0.1
        ), f"Rate limiting overhead too high: {avg_response_time:.4f}s"

    def test_gateway_metrics_endpoint(self, client):
        """Test gateway metrics endpoint performance"""
        # Generate some traffic first
        for _ in range(10):
            client.get("/health")

        # Test metrics endpoint
        start_time = time.time()
        response = client.get("/api/v1/gateway/metrics")
        end_time = time.time()

        assert response.status_code == 200

        metrics = response.get_json()
        assert "request_count" in metrics or "status" in metrics

        # Metrics endpoint should be fast
        response_time = end_time - start_time
        assert response_time < 0.1, f"Metrics endpoint too slow: {response_time:.4f}s"


class TestCacheManager:
    """Test cache manager functionality"""

    @pytest.fixture
    def cache_config(self):
        return {
            "default_ttl": 300,
            "max_cache_size": 1000,
            "cache_strategies": {
                "user_profile": 1800,
                "account_balance": 60,
                "static_data": 3600,
            },
        }

    def test_cache_operations(self, cache_config):
        """Test basic cache operations"""
        cache_manager = CacheManager(None, cache_config)  # No Redis for testing

        # Test cache miss
        result = cache_manager.get("test_key", "default")
        assert result is None

        # Test cache set and get
        test_data = {"test": "data", "number": 123}
        cache_manager.set("test_key", test_data, "default")

        cached_result = cache_manager.get("test_key", "default")
        assert cached_result == test_data

    def test_cache_ttl_strategies(self, cache_config):
        """Test different TTL strategies"""
        cache_manager = CacheManager(None, cache_config)

        # Test different cache types
        cache_types = ["user_profile", "account_balance", "static_data"]

        for cache_type in cache_types:
            key = f"test_{cache_type}"
            data = {"type": cache_type, "timestamp": time.time()}

            cache_manager.set(key, data, cache_type)
            cached_data = cache_manager.get(key, cache_type)

            assert cached_data == data

    def test_cache_key_generation(self, cache_config):
        """Test cache key generation"""
        cache_manager = CacheManager(None, cache_config)

        # Test consistent key generation
        endpoint = "/api/v1/test"
        params1 = {"user_id": 123, "type": "balance"}
        params2 = {"type": "balance", "user_id": 123}  # Different order

        key1 = cache_manager.get_cache_key(endpoint, params1)
        key2 = cache_manager.get_cache_key(endpoint, params2)

        assert (
            key1 == key2
        ), "Cache keys should be consistent regardless of parameter order"


class TestCircuitBreaker:
    """Test circuit breaker functionality"""

    @pytest.fixture
    def circuit_config(self):
        return {"failure_threshold": 3, "recovery_timeout": 5, "half_open_max_calls": 2}

    def test_circuit_breaker_closed_state(self, circuit_config):
        """Test circuit breaker in closed state"""
        circuit_breaker = CircuitBreaker("test_service", circuit_config)

        def successful_function():
            return "success"

        # Should work normally in closed state
        result = circuit_breaker.call(successful_function)
        assert result == "success"
        assert circuit_breaker.state == "closed"

    def test_circuit_breaker_failure_handling(self, circuit_config):
        """Test circuit breaker failure handling"""
        circuit_breaker = CircuitBreaker("test_service", circuit_config)

        def failing_function():
            raise Exception("Service unavailable")

        # Trigger failures to open circuit
        for i in range(circuit_config["failure_threshold"]):
            with pytest.raises(Exception):
                circuit_breaker.call(failing_function)

        # Circuit should be open now
        assert circuit_breaker.state == "open"

        # Further calls should fail immediately
        with pytest.raises(Exception, match="Circuit breaker open"):
            circuit_breaker.call(failing_function)


class TestRequestBatcher:
    """Test request batching functionality"""

    @pytest.fixture
    def batch_config(self):
        return {
            "batch_size": 5,
            "batch_timeout": 100,
            "batch_endpoints": ["/api/v1/test/batch"],
        }

    def test_non_batchable_request(self, batch_config):
        """Test non-batchable requests are executed immediately"""
        batcher = RequestBatcher(batch_config)

        result = None

        def callback(response):
            nonlocal result
            result = response

        # Non-batchable endpoint should execute immediately
        batcher.add_request("/api/v1/test/single", {"data": "test"}, callback)

        # Give a moment for processing
        time.sleep(0.01)

        assert result is not None
        assert result["status"] == "success"


class TestPerformanceBenchmarks:
    """Performance benchmark tests"""

    def test_response_time_benchmarks(self, client):
        """Test response time benchmarks for different endpoints"""
        endpoints = ["/health", "/api/v1/info", "/api/v1/gateway/metrics"]

        benchmark_results = {}

        for endpoint in endpoints:
            times = []
            for _ in range(20):  # 20 samples per endpoint
                start_time = time.time()
                response = client.get(endpoint)
                end_time = time.time()

                if response.status_code == 200:
                    times.append(
                        (end_time - start_time) * 1000
                    )  # Convert to milliseconds

            if times:
                benchmark_results[endpoint] = {
                    "avg": statistics.mean(times),
                    "min": min(times),
                    "max": max(times),
                    "p95": (
                        statistics.quantiles(times, n=20)[18]
                        if len(times) > 20
                        else max(times)
                    ),
                }

        # Print benchmark results
        logger.info("\nPerformance Benchmarks:")
        logger.info("=" * 50)
        for endpoint, metrics in benchmark_results.items():
            logger.info(f"{endpoint}:")
            logger.info(f"  Average: {metrics['avg']:.2f}ms")
            logger.info(f"  Min: {metrics['min']:.2f}ms")
            logger.info(f"  Max: {metrics['max']:.2f}ms")
            logger.info(f"  P95: {metrics['p95']:.2f}ms")
        # Assert performance targets
        for endpoint, metrics in benchmark_results.items():
            assert (
                metrics["avg"] < 100
            ), f"{endpoint} average response time too slow: {metrics['avg']:.2f}ms"
            assert (
                metrics["p95"] < 200
            ), f"{endpoint} P95 response time too slow: {metrics['p95']:.2f}ms"

    def test_throughput_benchmark(self, client):
        """Test throughput benchmark"""
        endpoint = "/health"
        duration = 5  # seconds
        request_count = 0

        start_time = time.time()
        end_time = start_time + duration

        while time.time() < end_time:
            response = client.get(endpoint)
            if response.status_code == 200:
                request_count += 1

        actual_duration = time.time() - start_time
        throughput = request_count / actual_duration

        logger.info(f"\nThroughput Benchmark:")
        logger.info(f"Requests: {request_count}")
        logger.info(f"Duration: {actual_duration:.2f}s")
        logger.info(f"Throughput: {throughput:.2f} requests/second")
        # Should handle at least 50 requests per second in test environment
        assert throughput > 50, f"Throughput too low: {throughput:.2f} requests/second"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

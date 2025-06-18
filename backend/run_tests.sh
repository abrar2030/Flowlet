#!/bin/bash

# Comprehensive Test Runner for Flowlet Backend
# This script runs all automated tests and generates reports

set -e  # Exit on any error

echo "=========================================="
echo "Flowlet Backend - Comprehensive Test Suite"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create test results directory
mkdir -p test_results
mkdir -p test_results/coverage
mkdir -p test_results/reports

echo -e "${BLUE}Setting up test environment...${NC}"

# Install test dependencies if not already installed
pip install -q pytest pytest-cov pytest-html pytest-xdist pytest-mock coverage

# Set environment variables for testing
export FLASK_ENV=testing
export DATABASE_URL=sqlite:///:memory:
export SECRET_KEY=test-secret-key
export REDIS_URL=redis://localhost:6379/1

echo -e "${BLUE}Running unit tests...${NC}"

# Run unit tests with coverage
pytest tests/test_service_integrations.py \
    --cov=src \
    --cov-report=html:test_results/coverage/unit \
    --cov-report=xml:test_results/coverage/unit_coverage.xml \
    --html=test_results/reports/unit_tests.html \
    --self-contained-html \
    -v \
    --tb=short

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Unit tests passed${NC}"
else
    echo -e "${RED}✗ Unit tests failed${NC}"
    exit 1
fi

echo -e "${BLUE}Running API integration tests...${NC}"

# Run API integration tests
pytest tests/test_api_integrations.py \
    --cov=src \
    --cov-append \
    --cov-report=html:test_results/coverage/integration \
    --cov-report=xml:test_results/coverage/integration_coverage.xml \
    --html=test_results/reports/integration_tests.html \
    --self-contained-html \
    -v \
    --tb=short

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ API integration tests passed${NC}"
else
    echo -e "${RED}✗ API integration tests failed${NC}"
    exit 1
fi

echo -e "${BLUE}Running performance tests...${NC}"

# Run performance tests
pytest tests/test_performance.py \
    --html=test_results/reports/performance_tests.html \
    --self-contained-html \
    -v \
    --tb=short

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Performance tests passed${NC}"
else
    echo -e "${YELLOW}⚠ Performance tests completed with warnings${NC}"
fi

echo -e "${BLUE}Running existing MVP tests...${NC}"

# Run existing test files if they exist
if [ -f "test_mvp.py" ]; then
    python test_mvp.py
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ MVP tests passed${NC}"
    else
        echo -e "${RED}✗ MVP tests failed${NC}"
    fi
fi

if [ -f "test_api.py" ]; then
    python test_api.py
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ API tests passed${NC}"
    else
        echo -e "${RED}✗ API tests failed${NC}"
    fi
fi

echo -e "${BLUE}Generating comprehensive coverage report...${NC}"

# Generate combined coverage report
coverage combine
coverage html -d test_results/coverage/combined
coverage xml -o test_results/coverage/combined_coverage.xml
coverage report --show-missing > test_results/coverage/coverage_summary.txt

echo -e "${BLUE}Running security tests...${NC}"

# Security testing with bandit (if available)
if command -v bandit &> /dev/null; then
    bandit -r src/ -f json -o test_results/reports/security_report.json || true
    echo -e "${GREEN}✓ Security scan completed${NC}"
else
    echo -e "${YELLOW}⚠ Bandit not installed, skipping security scan${NC}"
fi

echo -e "${BLUE}Running code quality checks...${NC}"

# Code quality checks with flake8 (if available)
if command -v flake8 &> /dev/null; then
    flake8 src/ --output-file=test_results/reports/flake8_report.txt --tee || true
    echo -e "${GREEN}✓ Code quality check completed${NC}"
else
    echo -e "${YELLOW}⚠ Flake8 not installed, skipping code quality check${NC}"
fi

echo -e "${BLUE}Generating test summary...${NC}"

# Generate test summary
cat > test_results/test_summary.md << EOF
# Flowlet Backend Test Summary

## Test Execution Date
$(date)

## Test Results

### Unit Tests
- **Status**: $([ -f "test_results/reports/unit_tests.html" ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Report**: [Unit Test Report](reports/unit_tests.html)

### Integration Tests
- **Status**: $([ -f "test_results/reports/integration_tests.html" ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Report**: [Integration Test Report](reports/integration_tests.html)

### Performance Tests
- **Status**: $([ -f "test_results/reports/performance_tests.html" ] && echo "✅ PASSED" || echo "⚠️ COMPLETED")
- **Report**: [Performance Test Report](reports/performance_tests.html)

## Coverage Summary
$(cat test_results/coverage/coverage_summary.txt)

## Security Scan
- **Status**: $([ -f "test_results/reports/security_report.json" ] && echo "✅ COMPLETED" || echo "⚠️ SKIPPED")
- **Report**: $([ -f "test_results/reports/security_report.json" ] && echo "[Security Report](reports/security_report.json)" || echo "Not available")

## Code Quality
- **Status**: $([ -f "test_results/reports/flake8_report.txt" ] && echo "✅ COMPLETED" || echo "⚠️ SKIPPED")
- **Report**: $([ -f "test_results/reports/flake8_report.txt" ] && echo "[Code Quality Report](reports/flake8_report.txt)" || echo "Not available")

## Test Coverage
- **Combined Coverage**: [Coverage Report](coverage/combined/index.html)
- **Unit Test Coverage**: [Unit Coverage](coverage/unit/index.html)
- **Integration Test Coverage**: [Integration Coverage](coverage/integration/index.html)

## Recommendations

### High Priority
- Ensure all tests pass before deployment
- Maintain test coverage above 80%
- Address any security vulnerabilities found

### Medium Priority
- Optimize performance bottlenecks identified in performance tests
- Improve code quality based on flake8 recommendations
- Add more edge case testing

### Low Priority
- Enhance test documentation
- Add more performance benchmarks
- Consider adding mutation testing

## Next Steps
1. Review failed tests and fix issues
2. Deploy to staging environment
3. Run integration tests against staging
4. Prepare for production deployment
EOF

echo -e "${GREEN}=========================================="
echo -e "Test execution completed!"
echo -e "=========================================="
echo -e "📊 Test results available in: test_results/"
echo -e "📈 Coverage reports: test_results/coverage/"
echo -e "📋 Test summary: test_results/test_summary.md"
echo -e "=========================================="${NC}

# Display coverage summary
echo -e "${BLUE}Coverage Summary:${NC}"
coverage report --show-missing | tail -n 5

# Check if all critical tests passed
if [ -f "test_results/reports/unit_tests.html" ] && [ -f "test_results/reports/integration_tests.html" ]; then
    echo -e "${GREEN}🎉 All critical tests passed! Ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some critical tests failed. Please review and fix before deployment.${NC}"
    exit 1
fi


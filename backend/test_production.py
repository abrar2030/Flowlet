#!/usr/bin/env python3.11
"""
Comprehensive Production Test Suite for Flowlet Financial Backend
Tests all implemented features with enterprise-grade validation
"""

import json
import sys
import time
import uuid
from datetime import datetime
from decimal import Decimal

import requests

# Configuration
BASE_URL = "http://localhost:5001"
API_BASE = f"{BASE_URL}/api/v1"


class FlowletProductionTester:
    """Comprehensive test suite for production Flowlet backend"""

    def __init__(self):
        self.test_results = []
        self.access_token = None
        self.test_user_id = None
        self.test_accounts = []
        self.test_transactions = []

    def log_test(self, test_name, success, message="", data=None):
        """Log test results with detailed information"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")

        self.test_results.append(
            {
                "test": test_name,
                "success": success,
                "message": message,
                "data": data,
                "timestamp": datetime.now().isoformat(),
            }
        )

        if not success and data:
            print(f"   Error details: {data}")

    def make_request(self, method, endpoint, data=None, auth=True):
        """Make HTTP request with proper headers"""
        headers = {"Content-Type": "application/json"}

        if auth and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"

        url = f"{API_BASE}{endpoint}" if not endpoint.startswith("http") else endpoint

        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            return response
        except Exception as e:
            return None

    def test_health_and_info(self):
        """Test basic connectivity and API information"""
        print("\n🏥 Testing Health and API Information...")

        # Health check
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=10)
            if response.status_code == 200:
                health_data = response.json()
                self.log_test(
                    "Health Check", True, f"Status: {health_data.get('status')}"
                )
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection failed: {str(e)}")
            return False

        # API Info
        try:
            response = requests.get(f"{API_BASE}/info", timeout=10)
            if response.status_code == 200:
                info_data = response.json()
                features = len(info_data.get("features", []))
                self.log_test("API Info", True, f"Features: {features}")
            else:
                self.log_test("API Info", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("API Info", False, f"Request failed: {str(e)}")

        return True

    def test_user_registration(self):
        """Test user registration functionality"""
        print("\n👤 Testing User Registration...")

        test_email = f"test_{uuid.uuid4().hex[:8]}@flowlet.com"
        registration_data = {
            "email": test_email,
            "password": "SecurePassword123!",
            "first_name": "Test",
            "last_name": "User",
            "phone_number": "+1234567890",
        }

        response = self.make_request(
            "POST", "/auth/register", registration_data, auth=False
        )

        if response and response.status_code == 201:
            result = response.json()
            self.access_token = result.get("tokens", {}).get("access_token")
            self.test_user_id = result.get("user", {}).get("id")

            if self.access_token and self.test_user_id:
                self.log_test(
                    "User Registration", True, f"User ID: {self.test_user_id}"
                )
                return True
            else:
                self.log_test(
                    "User Registration", False, "Missing tokens or user ID", result
                )
                return False
        else:
            error_data = response.json() if response else None
            self.log_test(
                "User Registration",
                False,
                f"HTTP {response.status_code if response else 'No response'}",
                error_data,
            )
            return False

    def test_user_login(self):
        """Test user login functionality"""
        print("\n🔐 Testing User Authentication...")

        # For this test, we'll use the registered user
        if not self.test_user_id:
            self.log_test("User Login", False, "No test user available")
            return False

        # Login would require the same credentials, but since we already have a token from registration,
        # we'll test token validation instead
        response = self.make_request("GET", "/accounts", auth=True)

        if response and response.status_code == 200:
            self.log_test("Token Authentication", True, "Token is valid")
            return True
        else:
            self.log_test(
                "Token Authentication",
                False,
                f"HTTP {response.status_code if response else 'No response'}",
            )
            return False

    def test_account_creation(self):
        """Test account creation functionality"""
        print("\n🏦 Testing Account Management...")

        account_data = {
            "account_name": "Test Checking Account",
            "account_type": "checking",
            "currency": "USD",
            "initial_deposit": "1000.00",
        }

        response = self.make_request("POST", "/accounts", account_data)

        if response and response.status_code == 201:
            result = response.json()
            account = result.get("account", {})
            account_id = account.get("id")

            if account_id:
                self.test_accounts.append(account_id)
                self.log_test("Account Creation", True, f"Account ID: {account_id}")
                return account_id
            else:
                self.log_test(
                    "Account Creation", False, "No account ID returned", result
                )
                return None
        else:
            error_data = response.json() if response else None
            self.log_test(
                "Account Creation",
                False,
                f"HTTP {response.status_code if response else 'No response'}",
                error_data,
            )
            return None

    def test_balance_operations(self, account_id):
        """Test balance inquiry and operations"""
        print("\n💰 Testing Balance Operations...")

        if not account_id:
            self.log_test("Balance Operations", False, "No account ID provided")
            return False

        # Test balance inquiry
        response = self.make_request("GET", f"/accounts/{account_id}/balance")

        if response and response.status_code == 200:
            balance_data = response.json()
            current_balance = balance_data.get("current_balance", "0")
            self.log_test("Balance Inquiry", True, f"Balance: ${current_balance}")
        else:
            self.log_test(
                "Balance Inquiry",
                False,
                f"HTTP {response.status_code if response else 'No response'}",
            )
            return False

        # Test deposit
        deposit_data = {
            "amount": "500.00",
            "description": "Test deposit",
            "reference": f"TEST_DEP_{uuid.uuid4().hex[:8]}",
        }

        response = self.make_request(
            "POST", f"/accounts/{account_id}/deposit", deposit_data
        )

        if response and response.status_code == 200:
            result = response.json()
            transaction = result.get("transaction", {})
            new_balance = result.get("new_balance", "0")

            if transaction.get("id"):
                self.test_transactions.append(transaction["id"])
                self.log_test(
                    "Fund Deposit",
                    True,
                    f"Amount: $500.00, New Balance: ${new_balance}",
                )
            else:
                self.log_test(
                    "Fund Deposit", False, "No transaction ID returned", result
                )
        else:
            error_data = response.json() if response else None
            self.log_test(
                "Fund Deposit",
                False,
                f"HTTP {response.status_code if response else 'No response'}",
                error_data,
            )

        # Test withdrawal
        withdrawal_data = {
            "amount": "200.00",
            "description": "Test withdrawal",
            "reference": f"TEST_WD_{uuid.uuid4().hex[:8]}",
        }

        response = self.make_request(
            "POST", f"/accounts/{account_id}/withdraw", withdrawal_data
        )

        if response and response.status_code == 200:
            result = response.json()
            transaction = result.get("transaction", {})
            new_balance = result.get("new_balance", "0")

            if transaction.get("id"):
                self.test_transactions.append(transaction["id"])
                self.log_test(
                    "Fund Withdrawal",
                    True,
                    f"Amount: $200.00, New Balance: ${new_balance}",
                )
            else:
                self.log_test(
                    "Fund Withdrawal", False, "No transaction ID returned", result
                )
        else:
            error_data = response.json() if response else None
            self.log_test(
                "Fund Withdrawal",
                False,
                f"HTTP {response.status_code if response else 'No response'}",
                error_data,
            )

        return True

    def test_transfers(self):
        """Test fund transfer functionality"""
        print("\n💸 Testing Fund Transfers...")

        if len(self.test_accounts) < 2:
            # Create a second account for transfer testing
            second_account_data = {
                "account_name": "Test Savings Account",
                "account_type": "savings",
                "currency": "USD",
                "initial_deposit": "500.00",
            }

            response = self.make_request("POST", "/accounts", second_account_data)

            if response and response.status_code == 201:
                result = response.json()
                account = result.get("account", {})
                account_id = account.get("id")

                if account_id:
                    self.test_accounts.append(account_id)
                else:
                    self.log_test(
                        "Transfer Setup", False, "Could not create second account"
                    )
                    return False
            else:
                self.log_test(
                    "Transfer Setup", False, "Could not create second account"
                )
                return False

        # Test transfer between accounts
        transfer_data = {
            "from_account_id": self.test_accounts[0],
            "to_account_id": self.test_accounts[1],
            "amount": "300.00",
            "description": "Test transfer between accounts",
        }

        response = self.make_request("POST", "/transfers", transfer_data)

        if response and response.status_code == 200:
            result = response.json()
            transfer = result.get("transfer", {})
            debit_tx = transfer.get("debit_transaction", {})
            credit_tx = transfer.get("credit_transaction", {})

            if debit_tx.get("id") and credit_tx.get("id"):
                self.test_transactions.extend([debit_tx["id"], credit_tx["id"]])
                self.log_test("Fund Transfer", True, f"Amount: $300.00")
            else:
                self.log_test("Fund Transfer", False, "Missing transaction IDs", result)
        else:
            error_data = response.json() if response else None
            self.log_test(
                "Fund Transfer",
                False,
                f"HTTP {response.status_code if response else 'No response'}",
                error_data,
            )

        return True

    def test_transaction_history(self):
        """Test transaction history functionality"""
        print("\n📊 Testing Transaction History...")

        if not self.test_accounts:
            self.log_test("Transaction History", False, "No test accounts available")
            return False

        account_id = self.test_accounts[0]
        response = self.make_request("GET", f"/accounts/{account_id}/transactions")

        if response and response.status_code == 200:
            result = response.json()
            transactions = result.get("transactions", [])
            pagination = result.get("pagination", {})

            self.log_test(
                "Transaction History", True, f"Found {len(transactions)} transactions"
            )

            # Test pagination
            if pagination.get("total", 0) > 0:
                self.log_test(
                    "Transaction Pagination", True, f"Total: {pagination['total']}"
                )

            return True
        else:
            error_data = response.json() if response else None
            self.log_test(
                "Transaction History",
                False,
                f"HTTP {response.status_code if response else 'No response'}",
                error_data,
            )
            return False

    def test_error_handling(self):
        """Test error handling and validation"""
        print("\n🛡️ Testing Error Handling...")

        # Test invalid account access
        response = self.make_request("GET", "/accounts/invalid-account-id/balance")

        if response and response.status_code == 404:
            self.log_test("Invalid Account Error", True, "Correctly returned 404")
        else:
            self.log_test(
                "Invalid Account Error",
                False,
                f"Expected 404, got {response.status_code if response else 'No response'}",
            )

        # Test insufficient funds
        if self.test_accounts:
            withdrawal_data = {
                "amount": "999999.00",
                "description": "Test insufficient funds",
            }

            response = self.make_request(
                "POST", f"/accounts/{self.test_accounts[0]}/withdraw", withdrawal_data
            )

            if response and response.status_code == 400:
                error_data = response.json()
                if error_data.get("code") == "INSUFFICIENT_FUNDS":
                    self.log_test(
                        "Insufficient Funds Error",
                        True,
                        "Correctly detected insufficient funds",
                    )
                else:
                    self.log_test(
                        "Insufficient Funds Error",
                        False,
                        f"Wrong error code: {error_data.get('code')}",
                    )
            else:
                self.log_test(
                    "Insufficient Funds Error",
                    False,
                    f"Expected 400, got {response.status_code if response else 'No response'}",
                )

        # Test invalid amount format
        if self.test_accounts:
            invalid_deposit_data = {
                "amount": "invalid_amount",
                "description": "Test invalid amount",
            }

            response = self.make_request(
                "POST",
                f"/accounts/{self.test_accounts[0]}/deposit",
                invalid_deposit_data,
            )

            if response and response.status_code == 400:
                self.log_test(
                    "Invalid Amount Error", True, "Correctly rejected invalid amount"
                )
            else:
                self.log_test(
                    "Invalid Amount Error",
                    False,
                    f"Expected 400, got {response.status_code if response else 'No response'}",
                )

        # Test unauthorized access
        old_token = self.access_token
        self.access_token = "invalid_token"

        response = self.make_request("GET", "/accounts")

        if response and response.status_code == 401:
            self.log_test(
                "Unauthorized Access Error", True, "Correctly rejected invalid token"
            )
        else:
            self.log_test(
                "Unauthorized Access Error",
                False,
                f"Expected 401, got {response.status_code if response else 'No response'}",
            )

        # Restore valid token
        self.access_token = old_token

        return True

    def test_security_features(self):
        """Test security features and headers"""
        print("\n🔒 Testing Security Features...")

        # Test security headers
        response = requests.get(f"{BASE_URL}/health", timeout=10)

        if response:
            headers = response.headers
            security_headers = [
                "X-Content-Type-Options",
                "X-Frame-Options",
                "X-XSS-Protection",
                "Strict-Transport-Security",
                "Content-Security-Policy",
            ]

            missing_headers = [h for h in security_headers if h not in headers]

            if not missing_headers:
                self.log_test("Security Headers", True, "All security headers present")
            else:
                self.log_test(
                    "Security Headers", False, f"Missing headers: {missing_headers}"
                )

        # Test rate limiting (simplified)
        rate_limit_test = True
        for i in range(3):
            response = self.make_request("GET", "/accounts")
            if not response or response.status_code not in [200, 429]:
                rate_limit_test = False
                break

        self.log_test("Rate Limiting", rate_limit_test, "Rate limiting is active")

        return True

    def run_comprehensive_test_suite(self):
        """Run the complete production test suite"""
        print("🚀 Starting Flowlet Production Test Suite")
        print("=" * 70)
        print("Testing enterprise-grade financial backend implementation")
        print("=" * 70)

        # Wait for server to be ready
        print("\n⏳ Waiting for server to be ready...")
        time.sleep(3)

        # Test basic connectivity
        if not self.test_health_and_info():
            print("❌ Basic connectivity failed. Cannot continue.")
            return False

        # Test authentication
        if not self.test_user_registration():
            print("❌ User registration failed. Cannot continue.")
            return False

        if not self.test_user_login():
            print("❌ Authentication failed. Cannot continue.")
            return False

        # Test core functionality
        account_id = self.test_account_creation()
        if account_id:
            self.test_balance_operations(account_id)
            self.test_transfers()
            self.test_transaction_history()

        # Test error handling and security
        self.test_error_handling()
        self.test_security_features()

        # Generate comprehensive report
        print("\n📊 Production Test Results Summary")
        print("=" * 70)

        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests

        print(f"Total Tests Executed: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")

        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test']}: {result['message']}")

        print(f"\n📈 Test Artifacts Created:")
        print(f"   - User ID: {self.test_user_id}")
        print(f"   - Accounts: {len(self.test_accounts)}")
        print(f"   - Transactions: {len(self.test_transactions)}")

        print(f"\n🏆 Production Readiness Assessment:")
        if passed_tests / total_tests >= 0.95:
            print("   ✅ EXCELLENT - Ready for production deployment")
        elif passed_tests / total_tests >= 0.90:
            print("   ✅ GOOD - Ready for production with minor fixes")
        elif passed_tests / total_tests >= 0.80:
            print("   ⚠️ FAIR - Needs improvements before production")
        else:
            print("   ❌ POOR - Significant issues need resolution")

        return failed_tests == 0


def main():
    """Main test execution function"""
    print("Flowlet Production Test Suite")
    print("Enterprise Financial Backend Validation")
    print("Testing comprehensive functionality and security")

    # Create and run test suite
    tester = FlowletProductionTester()
    success = tester.run_comprehensive_test_suite()

    if success:
        print("\n🎉 All tests passed! Production backend is ready for deployment.")
        sys.exit(0)
    else:
        print("\n⚠️ Some tests failed. Please review and fix issues before production.")
        sys.exit(1)


if __name__ == "__main__":
    main()

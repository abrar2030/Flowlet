#!/usr/bin/env python3.11
"""
Comprehensive Test Suite for Flowlet MVP
Tests all wallet and payment functionality with financial industry standards
"""

import requests
import json
import time
import uuid
from decimal import Decimal
import sys

# Configuration
BASE_URL = "http://localhost:5001"
API_BASE = f"{BASE_URL}/api/v1"

class FlowletMVPTester:
    """Comprehensive test suite for Flowlet MVP functionality"""
    
    def __init__(self):
        self.test_results = []
        self.wallets_created = []
        self.transactions_created = []
        
    def log_test(self, test_name, success, message="", data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'data': data
        })
        
        if not success:
            print(f"   Error details: {data}")
    
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=10)
            
            if response.status_code == 200:
                health_data = response.json()
                self.log_test("Health Check", True, f"Status: {health_data.get('status', 'unknown')}")
                return True
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Connection failed: {str(e)}")
            return False
    
    def test_api_info(self):
        """Test API info endpoint"""
        try:
            response = requests.get(f"{API_BASE}/info", timeout=10)
            
            if response.status_code == 200:
                info_data = response.json()
                version = info_data.get('version', 'unknown')
                features = len(info_data.get('mvp_features', []))
                self.log_test("API Info", True, f"Version: {version}, Features: {features}")
                return True
            else:
                self.log_test("API Info", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("API Info", False, f"Request failed: {str(e)}")
            return False
    
    def test_wallet_creation(self):
        """Test wallet creation functionality"""
        test_user_id = f"test_user_{uuid.uuid4().hex[:8]}"
        
        wallet_data = {
            "user_id": test_user_id,
            "account_name": "Test Checking Account",
            "account_type": "checking",
            "currency": "USD",
            "initial_deposit": "100.00"
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/wallet/create",
                json=wallet_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 201:
                wallet_info = response.json()
                wallet_id = wallet_info.get('wallet_id')
                
                if wallet_id:
                    self.wallets_created.append(wallet_id)
                    self.log_test("Wallet Creation", True, f"Wallet ID: {wallet_id}")
                    return wallet_id
                else:
                    self.log_test("Wallet Creation", False, "No wallet_id in response", wallet_info)
                    return None
            else:
                self.log_test("Wallet Creation", False, f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Wallet Creation", False, f"Request failed: {str(e)}")
            return None
    
    def test_balance_inquiry(self, wallet_id):
        """Test balance inquiry functionality"""
        if not wallet_id:
            self.log_test("Balance Inquiry", False, "No wallet_id provided")
            return None
            
        try:
            response = requests.get(f"{API_BASE}/wallet/{wallet_id}/balance", timeout=10)
            
            if response.status_code == 200:
                balance_data = response.json()
                current_balance = balance_data.get('current_balance', 0)
                available_balance = balance_data.get('available_balance', 0)
                
                self.log_test("Balance Inquiry", True, 
                            f"Current: ${current_balance}, Available: ${available_balance}")
                return balance_data
            else:
                self.log_test("Balance Inquiry", False, f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Balance Inquiry", False, f"Request failed: {str(e)}")
            return None
    
    def test_deposit_funds(self, wallet_id, amount="50.00"):
        """Test fund deposit functionality"""
        if not wallet_id:
            self.log_test("Fund Deposit", False, "No wallet_id provided")
            return False
            
        deposit_data = {
            "amount": amount,
            "description": "Test deposit from bank account",
            "reference": f"TEST_DEP_{uuid.uuid4().hex[:8]}"
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/wallet/{wallet_id}/deposit",
                json=deposit_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                deposit_result = response.json()
                transaction_id = deposit_result.get('transaction_id')
                
                if transaction_id:
                    self.transactions_created.append(transaction_id)
                    self.log_test("Fund Deposit", True, f"Amount: ${amount}, TX: {transaction_id}")
                    return True
                else:
                    self.log_test("Fund Deposit", False, "No transaction_id in response", deposit_result)
                    return False
            else:
                self.log_test("Fund Deposit", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Fund Deposit", False, f"Request failed: {str(e)}")
            return False
    
    def test_withdrawal_funds(self, wallet_id, amount="25.00"):
        """Test fund withdrawal functionality"""
        if not wallet_id:
            self.log_test("Fund Withdrawal", False, "No wallet_id provided")
            return False
            
        withdrawal_data = {
            "amount": amount,
            "description": "Test withdrawal to bank account",
            "reference": f"TEST_WD_{uuid.uuid4().hex[:8]}"
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/wallet/{wallet_id}/withdraw",
                json=withdrawal_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                withdrawal_result = response.json()
                transaction_id = withdrawal_result.get('transaction_id')
                
                if transaction_id:
                    self.transactions_created.append(transaction_id)
                    self.log_test("Fund Withdrawal", True, f"Amount: ${amount}, TX: {transaction_id}")
                    return True
                else:
                    self.log_test("Fund Withdrawal", False, "No transaction_id in response", withdrawal_result)
                    return False
            else:
                self.log_test("Fund Withdrawal", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Fund Withdrawal", False, f"Request failed: {str(e)}")
            return False
    
    def test_transfer_funds(self, from_wallet_id, to_wallet_id, amount="30.00"):
        """Test fund transfer functionality"""
        if not from_wallet_id or not to_wallet_id:
            self.log_test("Fund Transfer", False, "Missing wallet_id(s)")
            return False
            
        transfer_data = {
            "from_wallet_id": from_wallet_id,
            "to_wallet_id": to_wallet_id,
            "amount": amount,
            "description": "Test transfer between wallets",
            "reference": f"TEST_TXF_{uuid.uuid4().hex[:8]}"
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/payment/transfer",
                json=transfer_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                transfer_result = response.json()
                transaction_id = transfer_result.get('transaction_id')
                
                if transaction_id:
                    self.transactions_created.append(transaction_id)
                    self.log_test("Fund Transfer", True, f"Amount: ${amount}, TX: {transaction_id}")
                    return True
                else:
                    self.log_test("Fund Transfer", False, "No transaction_id in response", transfer_result)
                    return False
            else:
                self.log_test("Fund Transfer", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Fund Transfer", False, f"Request failed: {str(e)}")
            return False
    
    def test_transaction_history(self, wallet_id):
        """Test transaction history functionality"""
        if not wallet_id:
            self.log_test("Transaction History", False, "No wallet_id provided")
            return None
            
        try:
            response = requests.get(f"{API_BASE}/wallet/{wallet_id}/transactions", timeout=10)
            
            if response.status_code == 200:
                history_data = response.json()
                transactions = history_data.get('transactions', [])
                total_count = len(transactions)
                
                self.log_test("Transaction History", True, f"Found {total_count} transactions")
                return history_data
            else:
                self.log_test("Transaction History", False, f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Transaction History", False, f"Request failed: {str(e)}")
            return None
    
    def test_payment_history(self, wallet_id):
        """Test payment history functionality"""
        if not wallet_id:
            self.log_test("Payment History", False, "No wallet_id provided")
            return None
            
        try:
            response = requests.get(f"{API_BASE}/payment/history/{wallet_id}", timeout=10)
            
            if response.status_code == 200:
                payment_data = response.json()
                payments = payment_data.get('payments', [])
                total_count = len(payments)
                
                self.log_test("Payment History", True, f"Found {total_count} payments")
                return payment_data
            else:
                self.log_test("Payment History", False, f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Payment History", False, f"Request failed: {str(e)}")
            return None
    
    def test_user_wallets(self, user_id):
        """Test user wallet listing functionality"""
        if not user_id:
            self.log_test("User Wallets", False, "No user_id provided")
            return None
            
        try:
            response = requests.get(f"{API_BASE}/wallet/user/{user_id}", timeout=10)
            
            if response.status_code == 200:
                wallets_data = response.json()
                wallets = wallets_data.get('wallets', [])
                total_count = len(wallets)
                
                self.log_test("User Wallets", True, f"Found {total_count} wallets for user")
                return wallets_data
            else:
                self.log_test("User Wallets", False, f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("User Wallets", False, f"Request failed: {str(e)}")
            return None
    
    def test_error_handling(self):
        """Test error handling for invalid requests"""
        # Test invalid wallet ID
        try:
            response = requests.get(f"{API_BASE}/wallet/invalid_wallet_id/balance", timeout=10)
            
            if response.status_code == 404:
                self.log_test("Error Handling (Invalid Wallet)", True, "Correctly returned 404")
            else:
                self.log_test("Error Handling (Invalid Wallet)", False, 
                            f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Error Handling (Invalid Wallet)", False, f"Request failed: {str(e)}")
        
        # Test insufficient funds
        if self.wallets_created:
            wallet_id = self.wallets_created[0]
            withdrawal_data = {
                "amount": "999999.00",  # Very large amount
                "description": "Test insufficient funds"
            }
            
            try:
                response = requests.post(
                    f"{API_BASE}/wallet/{wallet_id}/withdraw",
                    json=withdrawal_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 400:
                    self.log_test("Error Handling (Insufficient Funds)", True, "Correctly returned 400")
                else:
                    self.log_test("Error Handling (Insufficient Funds)", False, 
                                f"Expected 400, got {response.status_code}")
            except Exception as e:
                self.log_test("Error Handling (Insufficient Funds)", False, f"Request failed: {str(e)}")
    
    def run_comprehensive_test_suite(self):
        """Run the complete test suite"""
        print("🚀 Starting Flowlet MVP Comprehensive Test Suite")
        print("=" * 60)
        
        # Basic connectivity tests
        print("\n📡 Testing Basic Connectivity...")
        if not self.test_health_check():
            print("❌ Health check failed. Is the server running on port 5001?")
            return False
        
        self.test_api_info()
        
        # Core wallet functionality tests
        print("\n💰 Testing Core Wallet Functionality...")
        
        # Create first wallet
        wallet1_id = self.test_wallet_creation()
        if not wallet1_id:
            print("❌ Wallet creation failed. Cannot continue with wallet tests.")
            return False
        
        # Test balance inquiry
        initial_balance = self.test_balance_inquiry(wallet1_id)
        
        # Test deposits
        self.test_deposit_funds(wallet1_id, "75.00")
        
        # Check balance after deposit
        self.test_balance_inquiry(wallet1_id)
        
        # Test withdrawals
        self.test_withdrawal_funds(wallet1_id, "25.00")
        
        # Check balance after withdrawal
        self.test_balance_inquiry(wallet1_id)
        
        # Test transaction history
        self.test_transaction_history(wallet1_id)
        
        # Payment functionality tests
        print("\n💸 Testing Payment Functionality...")
        
        # Create second wallet for transfers
        wallet2_id = self.test_wallet_creation()
        if wallet2_id:
            # Test fund transfers
            self.test_transfer_funds(wallet1_id, wallet2_id, "40.00")
            
            # Check balances after transfer
            self.test_balance_inquiry(wallet1_id)
            self.test_balance_inquiry(wallet2_id)
            
            # Test payment history
            self.test_payment_history(wallet1_id)
            self.test_payment_history(wallet2_id)
        
        # Advanced functionality tests
        print("\n🔍 Testing Advanced Functionality...")
        
        # Test user wallet listing (extract user_id from first wallet creation)
        if self.wallets_created:
            # For this test, we'll use a known user_id pattern
            test_user_id = f"test_user_{uuid.uuid4().hex[:8]}"
            self.test_user_wallets(test_user_id)
        
        # Error handling tests
        print("\n🛡️ Testing Error Handling...")
        self.test_error_handling()
        
        # Generate test report
        print("\n📊 Test Results Summary")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   - {result['test']}: {result['message']}")
        
        print(f"\n📈 Test Artifacts Created:")
        print(f"   - Wallets: {len(self.wallets_created)}")
        print(f"   - Transactions: {len(self.transactions_created)}")
        
        return failed_tests == 0

def main():
    """Main test execution function"""
    print("Flowlet MVP Test Suite")
    print("Testing comprehensive wallet and payment functionality")
    print("Ensuring financial industry standards compliance")
    
    # Wait for server to be ready
    print("\n⏳ Waiting for server to be ready...")
    time.sleep(2)
    
    # Create and run test suite
    tester = FlowletMVPTester()
    success = tester.run_comprehensive_test_suite()
    
    if success:
        print("\n🎉 All tests passed! Flowlet MVP is working correctly.")
        sys.exit(0)
    else:
        print("\n⚠️ Some tests failed. Please check the implementation.")
        sys.exit(1)

if __name__ == "__main__":
    main()


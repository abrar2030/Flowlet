import unittest
from datetime import datetime

# Assuming a simplified LedgerService module structure
# In a real scenario, you would import the actual classes/functions


class LedgerService:
    def __init__(self):
        self.entries = []
        self.balances = {}

    def create_journal_entry(
        self, debit_account, credit_account, amount, description, transaction_id=None
    ):
        if amount <= 0:
            return {"status": "failed", "message": "Amount must be positive"}
        if not all([debit_account, credit_account, description]):
            return {
                "status": "failed",
                "message": "Missing required journal entry details",
            }
        if debit_account == credit_account:
            return {
                "status": "failed",
                "message": "Debit and credit accounts cannot be the same",
            }

        entry = {
            "timestamp": datetime.now().isoformat(),
            "debit_account": debit_account,
            "credit_account": credit_account,
            "amount": amount,
            "description": description,
            "transaction_id": transaction_id,
            "entry_id": len(self.entries) + 1,  # Simple ID generation
        }
        self.entries.append(entry)
        self._update_balances(debit_account, credit_account, amount)
        return {"status": "success", "entry_id": entry["entry_id"]}

    def _update_balances(self, debit_account, credit_account, amount):
        self.balances[debit_account] = self.balances.get(debit_account, 0) - amount
        self.balances[credit_account] = self.balances.get(credit_account, 0) + amount

    def get_account_balance(self, account_name):
        return self.balances.get(account_name, 0)

    def get_all_balances(self):
        return self.balances

    def get_journal_entries(self, account_name=None, transaction_id=None):
        filtered_entries = []
        for entry in self.entries:
            match_account = (
                account_name is None
                or entry["debit_account"] == account_name
                or entry["credit_account"] == account_name
            )
            match_transaction = (
                transaction_id is None or entry["transaction_id"] == transaction_id
            )
            if match_account and match_transaction:
                filtered_entries.append(entry)
        return filtered_entries

    def reconcile_accounts(self, external_records):
        # Simulate reconciliation logic
        # In a real system, this would compare internal ledger with external statements
        discrepancies = []
        internal_summary = {}
        for entry in self.entries:
            internal_summary[entry["transaction_id"]] = (
                internal_summary.get(entry["transaction_id"], 0) + entry["amount"]
            )

        for ext_record in external_records:
            ext_txn_id = ext_record.get("transaction_id")
            ext_amount = ext_record.get("amount")

            if ext_txn_id not in internal_summary:
                discrepancies.append(
                    f"External transaction {ext_txn_id} not found in internal ledger."
                )
            elif internal_summary[ext_txn_id] != ext_amount:
                discrepancies.append(
                    f"Amount mismatch for transaction {ext_txn_id}: Internal {internal_summary[ext_txn_id]}, External {ext_amount}."
                )

        return {
            "status": "success",
            "discrepancies": discrepancies,
            "count": len(discrepancies),
        }


class TestLedgerService(unittest.TestCase):

    def setUp(self):
        self.ledger = LedgerService()

    def test_create_journal_entry_success(self):
        result = self.ledger.create_journal_entry(
            "Cash", "Revenue", 100.00, "Sale of goods", "txn_001"
        )
        self.assertEqual(result["status"], "success")
        self.assertEqual(self.ledger.get_account_balance("Cash"), -100.00)
        self.assertEqual(self.ledger.get_account_balance("Revenue"), 100.00)
        self.assertEqual(len(self.ledger.entries), 1)

    def test_create_journal_entry_missing_details(self):
        result = self.ledger.create_journal_entry(
            "Cash", "Revenue", 100.00, None
        )  # Missing description
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Missing required journal entry details")
        self.assertEqual(len(self.ledger.entries), 0)

    def test_create_journal_entry_zero_amount(self):
        result = self.ledger.create_journal_entry("Cash", "Revenue", 0, "Test entry")
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Amount must be positive")
        self.assertEqual(len(self.ledger.entries), 0)

    def test_create_journal_entry_same_accounts(self):
        result = self.ledger.create_journal_entry("Cash", "Cash", 50.00, "Transfer")
        self.assertEqual(result["status"], "failed")
        self.assertEqual(
            result["message"], "Debit and credit accounts cannot be the same"
        )
        self.assertEqual(len(self.ledger.entries), 0)

    def test_get_account_balance(self):
        self.ledger.create_journal_entry("Cash", "Revenue", 100.00, "Sale")
        self.ledger.create_journal_entry("Expenses", "Cash", 20.00, "Office supplies")
        self.assertEqual(self.ledger.get_account_balance("Cash"), -80.00)
        self.assertEqual(self.ledger.get_account_balance("Revenue"), 100.00)
        self.assertEqual(self.ledger.get_account_balance("Expenses"), -20.00)
        self.assertEqual(self.ledger.get_account_balance("NonExistentAccount"), 0)

    def test_get_all_balances(self):
        self.ledger.create_journal_entry("Cash", "Revenue", 100.00, "Sale")
        self.ledger.create_journal_entry("Expenses", "Cash", 20.00, "Office supplies")
        balances = self.ledger.get_all_balances()
        self.assertIn("Cash", balances)
        self.assertIn("Revenue", balances)
        self.assertIn("Expenses", balances)
        self.assertEqual(balances["Cash"], -80.00)
        self.assertEqual(balances["Revenue"], 100.00)
        self.assertEqual(balances["Expenses"], -20.00)

    def test_get_journal_entries_all(self):
        self.ledger.create_journal_entry("Cash", "Revenue", 100.00, "Sale", "txn_001")
        self.ledger.create_journal_entry(
            "Expenses", "Cash", 20.00, "Office supplies", "txn_002"
        )
        entries = self.ledger.get_journal_entries()
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0]["transaction_id"], "txn_001")
        self.assertEqual(entries[1]["transaction_id"], "txn_002")

    def test_get_journal_entries_by_account(self):
        self.ledger.create_journal_entry("Cash", "Revenue", 100.00, "Sale", "txn_001")
        self.ledger.create_journal_entry(
            "Expenses", "Cash", 20.00, "Office supplies", "txn_002"
        )
        cash_entries = self.ledger.get_journal_entries(account_name="Cash")
        self.assertEqual(len(cash_entries), 2)
        revenue_entries = self.ledger.get_journal_entries(account_name="Revenue")
        self.assertEqual(len(revenue_entries), 1)
        self.assertEqual(revenue_entries[0]["transaction_id"], "txn_001")

    def test_get_journal_entries_by_transaction_id(self):
        self.ledger.create_journal_entry("Cash", "Revenue", 100.00, "Sale", "txn_001")
        self.ledger.create_journal_entry(
            "Expenses", "Cash", 20.00, "Office supplies", "txn_002"
        )
        txn1_entries = self.ledger.get_journal_entries(transaction_id="txn_001")
        self.assertEqual(len(txn1_entries), 1)
        self.assertEqual(txn1_entries[0]["debit_account"], "Cash")

    def test_reconcile_accounts_no_discrepancies(self):
        self.ledger.create_journal_entry("Cash", "Revenue", 100.00, "Sale", "txn_001")
        self.ledger.create_journal_entry(
            "Expenses", "Cash", 20.00, "Office supplies", "txn_002"
        )
        external_records = [
            {"transaction_id": "txn_001", "amount": 100.00},
            {"transaction_id": "txn_002", "amount": 20.00},
        ]
        result = self.ledger.reconcile_accounts(external_records)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["count"], 0)
        self.assertEqual(result["discrepancies"], [])

    def test_reconcile_accounts_missing_internal_transaction(self):
        self.ledger.create_journal_entry("Cash", "Revenue", 100.00, "Sale", "txn_001")
        external_records = [
            {"transaction_id": "txn_001", "amount": 100.00},
            {"transaction_id": "txn_003", "amount": 50.00},  # Missing in internal
        ]
        result = self.ledger.reconcile_accounts(external_records)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["count"], 1)
        self.assertIn(
            "External transaction txn_003 not found in internal ledger.",
            result["discrepancies"],
        )

    def test_reconcile_accounts_amount_mismatch(self):
        self.ledger.create_journal_entry("Cash", "Revenue", 100.00, "Sale", "txn_001")
        external_records = [{"transaction_id": "txn_001", "amount": 90.00}]  # Mismatch
        result = self.ledger.reconcile_accounts(external_records)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["count"], 1)
        self.assertIn(
            "Amount mismatch for transaction txn_001: Internal 100.0, External 90.0.",
            result["discrepancies"],
        )


if __name__ == "__main__":
    unittest.main()

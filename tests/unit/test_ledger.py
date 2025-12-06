import unittest
from datetime import datetime


class LedgerService:

    def __init__(self) -> Any:
        self.entries = []
        self.balances = {}

    def create_journal_entry(
        self,
        debit_account: Any,
        credit_account: Any,
        amount: Any,
        description: Any,
        transaction_id: Any = None,
    ) -> Any:
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
            "entry_id": len(self.entries) + 1,
        }
        self.entries.append(entry)
        self._update_balances(debit_account, credit_account, amount)
        return {"status": "success", "entry_id": entry["entry_id"]}

    def _update_balances(
        self, debit_account: Any, credit_account: Any, amount: Any
    ) -> Any:
        self.balances[debit_account] = self.balances.get(debit_account, 0) - amount
        self.balances[credit_account] = self.balances.get(credit_account, 0) + amount

    def get_account_balance(self, account_name: Any) -> Any:
        return self.balances.get(account_name, 0)

    def get_all_balances(self) -> Any:
        return self.balances

    def get_journal_entries(
        self, account_name: Any = None, transaction_id: Any = None
    ) -> Any:
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

    def reconcile_accounts(self, external_records: Any) -> Any:
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

    def setUp(self) -> Any:
        self.ledger = LedgerService()

    def test_create_journal_entry_success(self) -> Any:
        result = self.ledger.create_journal_entry(
            "Cash", "Revenue", 100.0, "Sale of goods", "txn_001"
        )
        self.assertEqual(result["status"], "success")
        self.assertEqual(self.ledger.get_account_balance("Cash"), -100.0)
        self.assertEqual(self.ledger.get_account_balance("Revenue"), 100.0)
        self.assertEqual(len(self.ledger.entries), 1)

    def test_create_journal_entry_missing_details(self) -> Any:
        result = self.ledger.create_journal_entry("Cash", "Revenue", 100.0, None)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Missing required journal entry details")
        self.assertEqual(len(self.ledger.entries), 0)

    def test_create_journal_entry_zero_amount(self) -> Any:
        result = self.ledger.create_journal_entry("Cash", "Revenue", 0, "Test entry")
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Amount must be positive")
        self.assertEqual(len(self.ledger.entries), 0)

    def test_create_journal_entry_same_accounts(self) -> Any:
        result = self.ledger.create_journal_entry("Cash", "Cash", 50.0, "Transfer")
        self.assertEqual(result["status"], "failed")
        self.assertEqual(
            result["message"], "Debit and credit accounts cannot be the same"
        )
        self.assertEqual(len(self.ledger.entries), 0)

    def test_get_account_balance(self) -> Any:
        self.ledger.create_journal_entry("Cash", "Revenue", 100.0, "Sale")
        self.ledger.create_journal_entry("Expenses", "Cash", 20.0, "Office supplies")
        self.assertEqual(self.ledger.get_account_balance("Cash"), -80.0)
        self.assertEqual(self.ledger.get_account_balance("Revenue"), 100.0)
        self.assertEqual(self.ledger.get_account_balance("Expenses"), -20.0)
        self.assertEqual(self.ledger.get_account_balance("NonExistentAccount"), 0)

    def test_get_all_balances(self) -> Any:
        self.ledger.create_journal_entry("Cash", "Revenue", 100.0, "Sale")
        self.ledger.create_journal_entry("Expenses", "Cash", 20.0, "Office supplies")
        balances = self.ledger.get_all_balances()
        self.assertIn("Cash", balances)
        self.assertIn("Revenue", balances)
        self.assertIn("Expenses", balances)
        self.assertEqual(balances["Cash"], -80.0)
        self.assertEqual(balances["Revenue"], 100.0)
        self.assertEqual(balances["Expenses"], -20.0)

    def test_get_journal_entries_all(self) -> Any:
        self.ledger.create_journal_entry("Cash", "Revenue", 100.0, "Sale", "txn_001")
        self.ledger.create_journal_entry(
            "Expenses", "Cash", 20.0, "Office supplies", "txn_002"
        )
        entries = self.ledger.get_journal_entries()
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0]["transaction_id"], "txn_001")
        self.assertEqual(entries[1]["transaction_id"], "txn_002")

    def test_get_journal_entries_by_account(self) -> Any:
        self.ledger.create_journal_entry("Cash", "Revenue", 100.0, "Sale", "txn_001")
        self.ledger.create_journal_entry(
            "Expenses", "Cash", 20.0, "Office supplies", "txn_002"
        )
        cash_entries = self.ledger.get_journal_entries(account_name="Cash")
        self.assertEqual(len(cash_entries), 2)
        revenue_entries = self.ledger.get_journal_entries(account_name="Revenue")
        self.assertEqual(len(revenue_entries), 1)
        self.assertEqual(revenue_entries[0]["transaction_id"], "txn_001")

    def test_get_journal_entries_by_transaction_id(self) -> Any:
        self.ledger.create_journal_entry("Cash", "Revenue", 100.0, "Sale", "txn_001")
        self.ledger.create_journal_entry(
            "Expenses", "Cash", 20.0, "Office supplies", "txn_002"
        )
        txn1_entries = self.ledger.get_journal_entries(transaction_id="txn_001")
        self.assertEqual(len(txn1_entries), 1)
        self.assertEqual(txn1_entries[0]["debit_account"], "Cash")

    def test_reconcile_accounts_no_discrepancies(self) -> Any:
        self.ledger.create_journal_entry("Cash", "Revenue", 100.0, "Sale", "txn_001")
        self.ledger.create_journal_entry(
            "Expenses", "Cash", 20.0, "Office supplies", "txn_002"
        )
        external_records = [
            {"transaction_id": "txn_001", "amount": 100.0},
            {"transaction_id": "txn_002", "amount": 20.0},
        ]
        result = self.ledger.reconcile_accounts(external_records)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["count"], 0)
        self.assertEqual(result["discrepancies"], [])

    def test_reconcile_accounts_missing_internal_transaction(self) -> Any:
        self.ledger.create_journal_entry("Cash", "Revenue", 100.0, "Sale", "txn_001")
        external_records = [
            {"transaction_id": "txn_001", "amount": 100.0},
            {"transaction_id": "txn_003", "amount": 50.0},
        ]
        result = self.ledger.reconcile_accounts(external_records)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["count"], 1)
        self.assertIn(
            "External transaction txn_003 not found in internal ledger.",
            result["discrepancies"],
        )

    def test_reconcile_accounts_amount_mismatch(self) -> Any:
        self.ledger.create_journal_entry("Cash", "Revenue", 100.0, "Sale", "txn_001")
        external_records = [{"transaction_id": "txn_001", "amount": 90.0}]
        result = self.ledger.reconcile_accounts(external_records)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["count"], 1)
        self.assertIn(
            "Amount mismatch for transaction txn_001: Internal 100.0, External 90.0.",
            result["discrepancies"],
        )


if __name__ == "__main__":
    unittest.main()

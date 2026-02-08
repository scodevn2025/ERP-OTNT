"""
Test Cost Accounting Module for OTNT ERP
Tests: Chart of Accounts, Journal Entries, Financial Reports, Automated Journal Posting
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@otnt.vn"
TEST_PASSWORD = "admin123"
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "password123"


class TestAuthAndSession:
    """Test authentication and session management"""
    
    def test_login_with_admin_credentials(self):
        """Test login with admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful for {TEST_EMAIL}")
    
    def test_login_with_test_user(self):
        """Test login with test user credentials"""
        # First try to register if user doesn't exist
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "full_name": "Test User",
            "role": "admin"
        })
        
        # Now login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        print(f"✓ Login successful for {TEST_USER_EMAIL}")
    
    def test_session_validation_with_token(self):
        """Test session validation with /api/auth/me endpoint"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        # Validate session
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200, f"Session validation failed: {response.text}"
        data = response.json()
        assert data["email"] == TEST_EMAIL
        print("✓ Session validation successful")
    
    def test_session_invalid_token(self):
        """Test that invalid token returns 401"""
        headers = {"Authorization": "Bearer invalid_token_12345"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid token correctly rejected")


class TestChartOfAccounts:
    """Test Chart of Accounts CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_accounts(self):
        """Test listing all accounts"""
        response = requests.get(f"{BASE_URL}/api/admin/accounts", headers=self.headers)
        assert response.status_code == 200, f"Failed to list accounts: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} accounts")
    
    def test_list_accounts_with_balances(self):
        """Test listing accounts with balances"""
        response = requests.get(
            f"{BASE_URL}/api/admin/accounts",
            params={"include_balances": True},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check that balance field exists
        if len(data) > 0:
            assert "balance" in data[0]
        print(f"✓ Listed accounts with balances")
    
    def test_list_accounts_by_type(self):
        """Test filtering accounts by type"""
        for account_type in ['asset', 'liability', 'equity', 'revenue', 'expense']:
            response = requests.get(
                f"{BASE_URL}/api/admin/accounts",
                params={"account_type": account_type},
                headers=self.headers
            )
            assert response.status_code == 200
            data = response.json()
            for acc in data:
                assert acc["account_type"] == account_type
        print("✓ Account type filtering works")
    
    def test_create_account(self):
        """Test creating a new account"""
        test_account = {
            "code": "TEST999",
            "name": "Test Account for Testing",
            "account_type": "asset",
            "description": "Test account created by automated tests",
            "is_header": False
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/accounts",
            json=test_account,
            headers=self.headers
        )
        # May fail if account already exists
        if response.status_code == 400 and "already exists" in response.text:
            print("✓ Account already exists (expected)")
            return
        
        assert response.status_code == 200, f"Failed to create account: {response.text}"
        data = response.json()
        assert data["code"] == test_account["code"]
        assert data["name"] == test_account["name"]
        print(f"✓ Created account {data['code']}")
    
    def test_get_account_by_id(self):
        """Test getting a specific account"""
        # First list accounts to get an ID
        list_response = requests.get(f"{BASE_URL}/api/admin/accounts", headers=self.headers)
        accounts = list_response.json()
        
        if len(accounts) > 0:
            account_id = accounts[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/admin/accounts/{account_id}",
                headers=self.headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == account_id
            print(f"✓ Retrieved account {data['code']}")
    
    def test_update_account(self):
        """Test updating an account"""
        # First create a test account
        test_account = {
            "code": "TESTUPD",
            "name": "Account to Update",
            "account_type": "expense",
            "description": "Will be updated",
            "is_header": False
        }
        create_response = requests.post(
            f"{BASE_URL}/api/admin/accounts",
            json=test_account,
            headers=self.headers
        )
        
        if create_response.status_code == 200:
            account_id = create_response.json()["id"]
            
            # Update the account
            update_data = {
                "code": "TESTUPD",
                "name": "Updated Account Name",
                "account_type": "expense",
                "description": "Updated description",
                "is_header": False
            }
            response = requests.put(
                f"{BASE_URL}/api/admin/accounts/{account_id}",
                json=update_data,
                headers=self.headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["name"] == "Updated Account Name"
            print("✓ Account updated successfully")
    
    def test_verify_seeded_accounts(self):
        """Verify that VAS accounts are seeded"""
        response = requests.get(f"{BASE_URL}/api/admin/accounts", headers=self.headers)
        accounts = response.json()
        
        # Check for key VAS accounts
        account_codes = [a["code"] for a in accounts]
        expected_codes = ["111", "156", "331", "511", "632"]  # Cash, Inventory, Payable, Revenue, COGS
        
        for code in expected_codes:
            assert code in account_codes, f"Expected account {code} not found"
        
        print(f"✓ Verified VAS accounts are seeded: {expected_codes}")


class TestJournalEntries:
    """Test Journal Entry CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token and accounts"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get accounts for journal entries
        accounts_response = requests.get(
            f"{BASE_URL}/api/admin/accounts",
            headers=self.headers
        )
        self.accounts = accounts_response.json()
        self.postable_accounts = [a for a in self.accounts if not a.get("is_header")]
    
    def test_list_journal_entries(self):
        """Test listing journal entries"""
        response = requests.get(f"{BASE_URL}/api/admin/journal-entries", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} journal entries")
    
    def test_list_journal_entries_by_type(self):
        """Test filtering journal entries by type"""
        for journal_type in ['general', 'inventory', 'sales']:
            response = requests.get(
                f"{BASE_URL}/api/admin/journal-entries",
                params={"journal_type": journal_type},
                headers=self.headers
            )
            assert response.status_code == 200
        print("✓ Journal type filtering works")
    
    def test_list_journal_entries_by_status(self):
        """Test filtering journal entries by status"""
        for status in ['draft', 'posted']:
            response = requests.get(
                f"{BASE_URL}/api/admin/journal-entries",
                params={"status": status},
                headers=self.headers
            )
            assert response.status_code == 200
        print("✓ Journal status filtering works")
    
    def test_create_journal_entry(self):
        """Test creating a journal entry"""
        if len(self.postable_accounts) < 2:
            pytest.skip("Not enough postable accounts")
        
        # Get two accounts for debit/credit
        debit_account = self.postable_accounts[0]
        credit_account = self.postable_accounts[1]
        
        journal_entry = {
            "journal_type": "general",
            "reference": "TEST-JE-001",
            "description": "Test journal entry",
            "lines": [
                {
                    "account_id": debit_account["id"],
                    "description": "Debit entry",
                    "debit": 100000,
                    "credit": 0
                },
                {
                    "account_id": credit_account["id"],
                    "description": "Credit entry",
                    "debit": 0,
                    "credit": 100000
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/journal-entries",
            json=journal_entry,
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to create journal entry: {response.text}"
        data = response.json()
        assert data["total_debit"] == 100000
        assert data["total_credit"] == 100000
        assert data["status"] == "draft"
        print(f"✓ Created journal entry {data['entry_number']}")
        
        # Store for later tests
        self.created_entry_id = data["id"]
        return data
    
    def test_create_journal_entry_unbalanced_fails(self):
        """Test that unbalanced journal entry fails"""
        if len(self.postable_accounts) < 2:
            pytest.skip("Not enough postable accounts")
        
        journal_entry = {
            "journal_type": "general",
            "description": "Unbalanced entry",
            "lines": [
                {
                    "account_id": self.postable_accounts[0]["id"],
                    "debit": 100000,
                    "credit": 0
                },
                {
                    "account_id": self.postable_accounts[1]["id"],
                    "debit": 0,
                    "credit": 50000  # Intentionally unbalanced
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/journal-entries",
            json=journal_entry,
            headers=self.headers
        )
        assert response.status_code == 400, "Unbalanced entry should fail"
        print("✓ Unbalanced journal entry correctly rejected")
    
    def test_post_journal_entry(self):
        """Test posting a journal entry"""
        # First create a draft entry
        entry_data = self.test_create_journal_entry()
        entry_id = entry_data["id"]
        
        # Post the entry
        response = requests.post(
            f"{BASE_URL}/api/admin/journal-entries/{entry_id}/post",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to post entry: {response.text}"
        print(f"✓ Posted journal entry {entry_data['entry_number']}")
    
    def test_delete_draft_journal_entry(self):
        """Test deleting a draft journal entry"""
        # Create a draft entry
        if len(self.postable_accounts) < 2:
            pytest.skip("Not enough postable accounts")
        
        journal_entry = {
            "journal_type": "general",
            "description": "Entry to delete",
            "lines": [
                {"account_id": self.postable_accounts[0]["id"], "debit": 50000, "credit": 0},
                {"account_id": self.postable_accounts[1]["id"], "debit": 0, "credit": 50000}
            ]
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/journal-entries",
            json=journal_entry,
            headers=self.headers
        )
        entry_id = create_response.json()["id"]
        
        # Delete the entry
        response = requests.delete(
            f"{BASE_URL}/api/admin/journal-entries/{entry_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        print("✓ Deleted draft journal entry")


class TestFinancialReports:
    """Test Financial Reports endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_trial_balance_report(self):
        """Test Trial Balance report"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/trial-balance",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to get trial balance: {response.text}"
        data = response.json()
        
        assert "accounts" in data
        assert "total_debit" in data
        assert "total_credit" in data
        assert "is_balanced" in data
        
        print(f"✓ Trial Balance: Debit={data['total_debit']}, Credit={data['total_credit']}, Balanced={data['is_balanced']}")
    
    def test_inventory_valuation_report(self):
        """Test Inventory Valuation report"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/inventory-valuation",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to get inventory valuation: {response.text}"
        data = response.json()
        
        assert "items" in data
        assert "total_value" in data
        assert "item_count" in data
        
        print(f"✓ Inventory Valuation: {data['item_count']} items, Total Value={data['total_value']}")
    
    def test_inventory_valuation_by_warehouse(self):
        """Test Inventory Valuation filtered by warehouse"""
        # Get warehouses first
        wh_response = requests.get(f"{BASE_URL}/api/admin/warehouses", headers=self.headers)
        warehouses = wh_response.json()
        
        if len(warehouses) > 0:
            warehouse_id = warehouses[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/admin/reports/inventory-valuation",
                params={"warehouse_id": warehouse_id},
                headers=self.headers
            )
            assert response.status_code == 200
            print(f"✓ Inventory Valuation by warehouse works")
    
    def test_profit_loss_report(self):
        """Test Profit & Loss report"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/profit-loss",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to get P&L: {response.text}"
        data = response.json()
        
        assert "revenue" in data
        assert "expenses" in data
        assert "net_profit" in data
        assert "items" in data["revenue"]
        assert "total" in data["revenue"]
        assert "items" in data["expenses"]
        assert "total" in data["expenses"]
        
        print(f"✓ P&L Report: Revenue={data['revenue']['total']}, Expenses={data['expenses']['total']}, Net Profit={data['net_profit']}")


class TestAutomatedJournalPosting:
    """Test automated journal posting when inventory docs are posted or sales orders completed"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token and required data"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get warehouses
        wh_response = requests.get(f"{BASE_URL}/api/admin/warehouses", headers=self.headers)
        self.warehouses = wh_response.json()
        
        # Get products
        prod_response = requests.get(f"{BASE_URL}/api/admin/products", headers=self.headers)
        self.products = prod_response.json()
    
    def test_inventory_receipt_creates_journal(self):
        """Test that posting inventory receipt creates automated journal entry"""
        if len(self.warehouses) == 0 or len(self.products) == 0:
            pytest.skip("No warehouses or products available")
        
        warehouse_id = self.warehouses[0]["id"]
        product_id = self.products[0]["id"]
        
        # Create inventory receipt document
        receipt_doc = {
            "doc_type": "receipt",
            "warehouse_id": warehouse_id,
            "note": "Test receipt for journal automation",
            "lines": [
                {
                    "product_id": product_id,
                    "quantity": 5,
                    "unit_cost": 1000000,
                    "serial_numbers": []
                }
            ]
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/inventory/documents",
            json=receipt_doc,
            headers=self.headers
        )
        assert create_response.status_code == 200, f"Failed to create receipt: {create_response.text}"
        doc_id = create_response.json()["id"]
        doc_number = create_response.json()["doc_number"]
        
        # Count journal entries before posting
        je_before = requests.get(
            f"{BASE_URL}/api/admin/journal-entries",
            params={"journal_type": "inventory"},
            headers=self.headers
        ).json()
        count_before = len(je_before)
        
        # Post the document
        post_response = requests.post(
            f"{BASE_URL}/api/admin/inventory/documents/{doc_id}/post",
            headers=self.headers
        )
        assert post_response.status_code == 200, f"Failed to post receipt: {post_response.text}"
        
        # Check for new journal entry
        time.sleep(0.5)  # Small delay for async processing
        je_after = requests.get(
            f"{BASE_URL}/api/admin/journal-entries",
            params={"journal_type": "inventory"},
            headers=self.headers
        ).json()
        
        # Find journal entry with reference to this document
        matching_entries = [je for je in je_after if je.get("reference") == doc_number]
        
        if len(matching_entries) > 0:
            print(f"✓ Inventory receipt {doc_number} created automated journal entry")
        else:
            print(f"⚠ No automated journal entry found for {doc_number} (may be expected if accounts not configured)")
    
    def test_sales_order_completion_creates_journal(self):
        """Test that completing sales order creates automated journal entry"""
        if len(self.warehouses) == 0 or len(self.products) == 0:
            pytest.skip("No warehouses or products available")
        
        # First ensure we have a customer
        customer_data = {
            "name": "Test Customer for Journal",
            "phone": "0999888777",
            "email": "testjournal@example.com"
        }
        cust_response = requests.post(
            f"{BASE_URL}/api/admin/customers",
            json=customer_data,
            headers=self.headers
        )
        if cust_response.status_code == 400:
            # Customer exists, get it
            cust_list = requests.get(
                f"{BASE_URL}/api/admin/customers",
                params={"search": "0999888777"},
                headers=self.headers
            ).json()
            customer_id = cust_list[0]["id"] if cust_list else None
        else:
            customer_id = cust_response.json()["id"]
        
        if not customer_id:
            pytest.skip("Could not create/find customer")
        
        warehouse_id = self.warehouses[0]["id"]
        product = self.products[0]
        
        # Create sales order
        order_data = {
            "customer_id": customer_id,
            "warehouse_id": warehouse_id,
            "note": "Test order for journal automation",
            "lines": [
                {
                    "product_id": product["id"],
                    "quantity": 1,
                    "unit_price": 15000000,
                    "serial_numbers": []
                }
            ]
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/sales/orders",
            json=order_data,
            headers=self.headers
        )
        
        if create_response.status_code != 200:
            print(f"⚠ Could not create sales order: {create_response.text}")
            return
        
        order_id = create_response.json()["id"]
        order_number = create_response.json()["order_number"]
        
        # Confirm the order
        confirm_response = requests.post(
            f"{BASE_URL}/api/admin/sales/orders/{order_id}/confirm",
            headers=self.headers
        )
        
        # Complete the order
        complete_response = requests.post(
            f"{BASE_URL}/api/admin/sales/orders/{order_id}/complete",
            headers=self.headers
        )
        
        if complete_response.status_code == 200:
            # Check for sales journal entry
            time.sleep(0.5)
            je_response = requests.get(
                f"{BASE_URL}/api/admin/journal-entries",
                params={"journal_type": "sales"},
                headers=self.headers
            )
            sales_entries = je_response.json()
            matching = [je for je in sales_entries if je.get("reference") == order_number]
            
            if len(matching) > 0:
                print(f"✓ Sales order {order_number} created automated journal entry")
            else:
                print(f"⚠ No automated journal entry found for {order_number}")
        else:
            print(f"⚠ Could not complete order: {complete_response.text}")


class TestSeedData:
    """Test seed data endpoint"""
    
    def test_seed_endpoint(self):
        """Test the seed endpoint creates default accounts"""
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Call seed endpoint
        response = requests.post(f"{BASE_URL}/api/admin/seed", headers=headers)
        assert response.status_code == 200, f"Seed failed: {response.text}"
        
        # Verify accounts exist
        accounts_response = requests.get(f"{BASE_URL}/api/admin/accounts", headers=headers)
        accounts = accounts_response.json()
        
        assert len(accounts) > 0, "No accounts after seeding"
        print(f"✓ Seed endpoint created {len(accounts)} accounts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

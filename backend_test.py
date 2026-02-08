import requests
import sys
import json
from datetime import datetime

class OTNTERPTester:
    def __init__(self, base_url="https://robotech-erp.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_register(self, email, password, full_name, role="admin"):
        """Test user registration"""
        data = {
            "email": email,
            "password": password,
            "full_name": full_name,
            "role": role
        }
        response = self.run_test("User Registration", "POST", "auth/register", 200, data)
        if response and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_login(self, email, password):
        """Test user login"""
        data = {"email": email, "password": password}
        response = self.run_test("User Login", "POST", "auth/login", 200, data)
        if response and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_get_profile(self):
        """Test get user profile"""
        return self.run_test("Get Profile", "GET", "auth/me", 200)

    def test_dashboard_stats(self):
        """Test dashboard stats"""
        return self.run_test("Dashboard Stats", "GET", "admin/dashboard/stats", 200)

    def test_seed_data(self):
        """Test seed data creation"""
        return self.run_test("Seed Data", "POST", "admin/seed", 200)

    def test_categories_crud(self):
        """Test categories CRUD operations"""
        # List categories
        categories = self.run_test("List Categories", "GET", "admin/categories", 200)
        
        # Create category
        category_data = {
            "name": "Test Category",
            "slug": "test-category",
            "description": "Test category description",
            "sort_order": 99
        }
        created = self.run_test("Create Category", "POST", "admin/categories", 200, category_data)
        
        if created and 'id' in created:
            category_id = created['id']
            
            # Update category
            update_data = {
                "name": "Updated Test Category",
                "slug": "updated-test-category",
                "description": "Updated description",
                "sort_order": 100
            }
            self.run_test("Update Category", "PUT", f"admin/categories/{category_id}", 200, update_data)
            
            # Delete category
            self.run_test("Delete Category", "DELETE", f"admin/categories/{category_id}", 200)
        
        return categories

    def test_brands_crud(self):
        """Test brands CRUD operations"""
        # List brands
        brands = self.run_test("List Brands", "GET", "admin/brands", 200)
        
        # Create brand
        brand_data = {
            "name": "Test Brand",
            "slug": "test-brand",
            "description": "Test brand description",
            "country": "Vietnam"
        }
        created = self.run_test("Create Brand", "POST", "admin/brands", 200, brand_data)
        
        if created and 'id' in created:
            brand_id = created['id']
            
            # Update brand
            update_data = {
                "name": "Updated Test Brand",
                "slug": "updated-test-brand",
                "description": "Updated description",
                "country": "USA"
            }
            self.run_test("Update Brand", "PUT", f"admin/brands/{brand_id}", 200, update_data)
            
            # Delete brand
            self.run_test("Delete Brand", "DELETE", f"admin/brands/{brand_id}", 200)
        
        return brands

    def test_products_crud(self):
        """Test products CRUD operations"""
        # List products
        products = self.run_test("List Products", "GET", "admin/products", 200)
        
        # Create product
        product_data = {
            "name": "Test Robot",
            "slug": "test-robot",
            "sku": "TEST-ROBOT-001",
            "product_type": "robot",
            "description": "Test robot description",
            "price": 1000000,
            "cost_price": 800000,
            "warranty_months": 12
        }
        created = self.run_test("Create Product", "POST", "admin/products", 200, product_data)
        
        if created and 'id' in created:
            product_id = created['id']
            
            # Get single product
            self.run_test("Get Product", "GET", f"admin/products/{product_id}", 200)
            
            # Update product
            update_data = {
                "name": "Updated Test Robot",
                "price": 1200000
            }
            self.run_test("Update Product", "PUT", f"admin/products/{product_id}", 200, update_data)
            
            # Delete product
            self.run_test("Delete Product", "DELETE", f"admin/products/{product_id}", 200)
        
        return products

    def test_store_endpoints(self):
        """Test public store endpoints"""
        # Store products
        self.run_test("Store Products", "GET", "store/products", 200)
        
        # Store categories
        self.run_test("Store Categories", "GET", "store/categories", 200)
        
        # Store brands
        self.run_test("Store Brands", "GET", "store/brands", 200)

    def test_product_filters(self):
        """Test product filtering"""
        # Test with filters
        self.run_test("Filter by Type", "GET", "store/products?product_type=robot", 200)
        self.run_test("Search Products", "GET", "store/products?search=robot", 200)
        self.run_test("Price Filter", "GET", "store/products?min_price=1000000&max_price=5000000", 200)

    def test_warehouses_crud(self):
        """Test warehouses CRUD operations"""
        # List warehouses
        warehouses = self.run_test("List Warehouses", "GET", "admin/warehouses", 200)
        
        # Create warehouse
        warehouse_data = {
            "name": "Test Warehouse",
            "code": "WH-TEST",
            "address": "123 Test Street",
            "phone": "0123456789",
            "is_default": False
        }
        created = self.run_test("Create Warehouse", "POST", "admin/warehouses", 200, warehouse_data)
        
        if created and 'id' in created:
            warehouse_id = created['id']
            
            # Get single warehouse
            self.run_test("Get Warehouse", "GET", f"admin/warehouses/{warehouse_id}", 200)
            
            # Update warehouse
            update_data = {
                "name": "Updated Test Warehouse",
                "code": "WH-TEST-UPD",
                "address": "456 Updated Street",
                "phone": "0987654321",
                "is_default": False
            }
            self.run_test("Update Warehouse", "PUT", f"admin/warehouses/{warehouse_id}", 200, update_data)
            
            # Delete warehouse
            self.run_test("Delete Warehouse", "DELETE", f"admin/warehouses/{warehouse_id}", 200)
        
        return warehouses

    def test_inventory_documents(self):
        """Test inventory documents operations"""
        # First ensure we have warehouses and products
        warehouses = self.run_test("List Warehouses for Inventory", "GET", "admin/warehouses", 200)
        products = self.run_test("List Products for Inventory", "GET", "admin/products", 200)
        
        if not warehouses or not products:
            self.log_test("Inventory Documents", False, "No warehouses or products available")
            return
        
        warehouse_id = warehouses[0]['id'] if warehouses else None
        product_id = products[0]['id'] if products else None
        
        if not warehouse_id or not product_id:
            self.log_test("Inventory Documents", False, "Missing warehouse or product ID")
            return
        
        # List inventory documents
        docs = self.run_test("List Inventory Documents", "GET", "admin/inventory/documents", 200)
        
        # Create receipt document
        receipt_data = {
            "doc_type": "receipt",
            "warehouse_id": warehouse_id,
            "reference": "TEST-RECEIPT-001",
            "note": "Test receipt document",
            "lines": [
                {
                    "product_id": product_id,
                    "quantity": 10,
                    "unit_cost": 100000,
                    "note": "Test line"
                }
            ]
        }
        created_doc = self.run_test("Create Receipt Document", "POST", "admin/inventory/documents", 200, receipt_data)
        
        if created_doc and 'id' in created_doc:
            doc_id = created_doc['id']
            
            # Get single document
            self.run_test("Get Inventory Document", "GET", f"admin/inventory/documents/{doc_id}", 200)
            
            # Post/approve document
            self.run_test("Post Inventory Document", "POST", f"admin/inventory/documents/{doc_id}/post", 200)
            
            # Try to delete posted document (should fail)
            self.run_test("Delete Posted Document (Should Fail)", "DELETE", f"admin/inventory/documents/{doc_id}", 400)
        
        # Create transfer document if we have multiple warehouses
        if len(warehouses) >= 2:
            dest_warehouse_id = warehouses[1]['id']
            transfer_data = {
                "doc_type": "transfer",
                "warehouse_id": warehouse_id,
                "dest_warehouse_id": dest_warehouse_id,
                "reference": "TEST-TRANSFER-001",
                "note": "Test transfer document",
                "lines": [
                    {
                        "product_id": product_id,
                        "quantity": 5,
                        "unit_cost": 100000,
                        "note": "Transfer test"
                    }
                ]
            }
            transfer_doc = self.run_test("Create Transfer Document", "POST", "admin/inventory/documents", 200, transfer_data)
            
            if transfer_doc and 'id' in transfer_doc:
                # Post transfer document
                self.run_test("Post Transfer Document", "POST", f"admin/inventory/documents/{transfer_doc['id']}/post", 200)
        
        return docs

    def test_stock_balance(self):
        """Test stock balance operations"""
        # Get stock balance
        stock = self.run_test("Get Stock Balance", "GET", "admin/inventory/stock", 200)
        
        # Get stock ledger
        ledger = self.run_test("Get Stock Ledger", "GET", "admin/inventory/ledger", 200)
        
        return stock, ledger

    def test_inventory_filters(self):
        """Test inventory filtering"""
        # Test document filters
        self.run_test("Filter Documents by Type", "GET", "admin/inventory/documents?doc_type=receipt", 200)
        self.run_test("Filter Documents by Status", "GET", "admin/inventory/documents?status=posted", 200)
        
        # Test stock filters
        self.run_test("Filter Stock by Warehouse", "GET", "admin/inventory/stock?warehouse_id=test", 200)
        self.run_test("Low Stock Filter", "GET", "admin/inventory/stock?low_stock=true", 200)

    def test_serials_crud(self):
        """Test serial/IMEI CRUD operations"""
        # First ensure we have robot products and warehouses
        products = self.run_test("List Products for Serials", "GET", "admin/products", 200)
        warehouses = self.run_test("List Warehouses for Serials", "GET", "admin/warehouses", 200)
        
        if not products or not warehouses:
            self.log_test("Serials CRUD", False, "No products or warehouses available")
            return None
        
        # Find or create a robot product with track_serial=true
        robot_product = None
        for product in products:
            if product.get('product_type') == 'robot' and product.get('track_serial'):
                robot_product = product
                break
        
        if not robot_product:
            # Create a robot product
            robot_data = {
                "name": "Test Robot for Serial",
                "slug": "test-robot-serial",
                "sku": "ROBOT-SERIAL-001",
                "product_type": "robot",
                "description": "Test robot for serial tracking",
                "price": 2000000,
                "cost_price": 1500000,
                "warranty_months": 24,
                "track_serial": True
            }
            robot_product = self.run_test("Create Robot Product", "POST", "admin/products", 200, robot_data)
            if not robot_product:
                self.log_test("Serials CRUD", False, "Failed to create robot product")
                return None
        
        warehouse_id = warehouses[0]['id']
        
        # List serials
        serials = self.run_test("List Serials", "GET", "admin/serials", 200)
        
        # Create serial
        serial_data = {
            "serial_number": f"SN-TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "imei": "123456789012345",
            "product_id": robot_product['id'],
            "warehouse_id": warehouse_id,
            "cost_price": 1500000,
            "note": "Test serial creation"
        }
        created_serial = self.run_test("Create Serial", "POST", "admin/serials", 200, serial_data)
        
        if created_serial and 'id' in created_serial:
            serial_id = created_serial['id']
            
            # Get single serial
            self.run_test("Get Serial", "GET", f"admin/serials/{serial_id}", 200)
            
            # Get serial movements
            self.run_test("Get Serial Movements", "GET", f"admin/serials/{serial_id}/movements", 200)
            
            return created_serial
        
        return None

    def test_customers_crud(self):
        """Test customers CRUD operations"""
        # List customers
        customers = self.run_test("List Customers", "GET", "admin/customers", 200)
        
        # Create customer
        customer_data = {
            "name": "Nguyễn Văn Test",
            "phone": f"091234{datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@example.com",
            "address": "123 Test Street, Test City",
            "tax_code": "0123456789",
            "note": "Test customer"
        }
        created_customer = self.run_test("Create Customer", "POST", "admin/customers", 200, customer_data)
        
        if created_customer and 'id' in created_customer:
            customer_id = created_customer['id']
            
            # Get single customer
            self.run_test("Get Customer", "GET", f"admin/customers/{customer_id}", 200)
            
            # Update customer
            update_data = {
                "name": "Nguyễn Văn Updated",
                "phone": customer_data['phone'],
                "email": customer_data['email'],
                "address": "456 Updated Street, Updated City",
                "tax_code": "9876543210",
                "note": "Updated test customer"
            }
            self.run_test("Update Customer", "PUT", f"admin/customers/{customer_id}", 200, update_data)
            
            return created_customer
        
        return None

    def test_sales_orders_crud(self):
        """Test sales orders CRUD operations"""
        # First ensure we have customers, warehouses, and products
        customers = self.run_test("List Customers for Sales", "GET", "admin/customers", 200)
        warehouses = self.run_test("List Warehouses for Sales", "GET", "admin/warehouses", 200)
        products = self.run_test("List Products for Sales", "GET", "admin/products", 200)
        
        if not customers or not warehouses or not products:
            self.log_test("Sales Orders CRUD", False, "Missing customers, warehouses, or products")
            return None
        
        customer_id = customers[0]['id']
        warehouse_id = warehouses[0]['id']
        product_id = products[0]['id']
        
        # List sales orders
        orders = self.run_test("List Sales Orders", "GET", "admin/sales/orders", 200)
        
        # Create sales order
        order_data = {
            "customer_id": customer_id,
            "warehouse_id": warehouse_id,
            "note": "Test sales order",
            "lines": [
                {
                    "product_id": product_id,
                    "quantity": 2,
                    "unit_price": 1000000,
                    "serial_numbers": [],
                    "note": "Test line"
                }
            ]
        }
        created_order = self.run_test("Create Sales Order", "POST", "admin/sales/orders", 200, order_data)
        
        if created_order and 'id' in created_order:
            order_id = created_order['id']
            
            # Get single order
            self.run_test("Get Sales Order", "GET", f"admin/sales/orders/{order_id}", 200)
            
            # Confirm order
            self.run_test("Confirm Sales Order", "POST", f"admin/sales/orders/{order_id}/confirm", 200)
            
            # Complete order
            self.run_test("Complete Sales Order", "POST", f"admin/sales/orders/{order_id}/complete", 200)
            
            return created_order
        
        return None

    def test_sales_with_serial_workflow(self):
        """Test complete sales workflow with serial tracking and warranty activation"""
        print("\n🔄 Testing Complete Sales + Serial + Warranty Workflow...")
        
        # Step 1: Create robot product with serial tracking
        robot_data = {
            "name": "Test Robot Workflow",
            "slug": "test-robot-workflow",
            "sku": f"ROBOT-WF-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "product_type": "robot",
            "description": "Test robot for workflow",
            "price": 3000000,
            "cost_price": 2000000,
            "warranty_months": 12,
            "track_serial": True
        }
        robot_product = self.run_test("Create Robot for Workflow", "POST", "admin/products", 200, robot_data)
        
        if not robot_product:
            self.log_test("Sales Workflow", False, "Failed to create robot product")
            return False
        
        # Step 2: Get warehouse
        warehouses = self.run_test("Get Warehouses for Workflow", "GET", "admin/warehouses", 200)
        if not warehouses:
            self.log_test("Sales Workflow", False, "No warehouses available")
            return False
        
        warehouse_id = warehouses[0]['id']
        
        # Step 3: Create serial for the robot
        serial_data = {
            "serial_number": f"WF-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "product_id": robot_product['id'],
            "warehouse_id": warehouse_id,
            "cost_price": 2000000,
            "note": "Workflow test serial"
        }
        created_serial = self.run_test("Create Serial for Workflow", "POST", "admin/serials", 200, serial_data)
        
        if not created_serial:
            self.log_test("Sales Workflow", False, "Failed to create serial")
            return False
        
        # Step 4: Create customer
        customer_data = {
            "name": "Workflow Test Customer",
            "phone": f"0912{datetime.now().strftime('%d%H%M%S')}",
            "email": f"workflow{datetime.now().strftime('%H%M%S')}@test.com",
            "address": "Workflow Test Address"
        }
        created_customer = self.run_test("Create Customer for Workflow", "POST", "admin/customers", 200, customer_data)
        
        if not created_customer:
            self.log_test("Sales Workflow", False, "Failed to create customer")
            return False
        
        # Step 5: Create sales order with serial
        order_data = {
            "customer_id": created_customer['id'],
            "warehouse_id": warehouse_id,
            "note": "Workflow test order with serial",
            "lines": [
                {
                    "product_id": robot_product['id'],
                    "quantity": 1,
                    "unit_price": 3000000,
                    "serial_numbers": [created_serial['serial_number']],
                    "note": "Robot with serial"
                }
            ]
        }
        created_order = self.run_test("Create Order with Serial", "POST", "admin/sales/orders", 200, order_data)
        
        if not created_order:
            self.log_test("Sales Workflow", False, "Failed to create sales order")
            return False
        
        # Step 6: Complete the order (should activate warranty and change serial status)
        order_id = created_order['id']
        completed = self.run_test("Complete Order (Activate Warranty)", "POST", f"admin/sales/orders/{order_id}/complete", 200)
        
        if not completed:
            self.log_test("Sales Workflow", False, "Failed to complete order")
            return False
        
        # Step 7: Verify serial status changed to 'sold' and warranty is set
        updated_serial = self.run_test("Verify Serial Status Changed", "GET", f"admin/serials/{created_serial['id']}", 200)
        
        if updated_serial:
            if updated_serial.get('status') == 'sold':
                self.log_test("Serial Status Changed to Sold", True, "Serial status correctly updated")
            else:
                self.log_test("Serial Status Changed to Sold", False, f"Expected 'sold', got '{updated_serial.get('status')}'")
            
            if updated_serial.get('warranty_start') and updated_serial.get('warranty_end'):
                self.log_test("Warranty Activated", True, "Warranty dates set correctly")
            else:
                self.log_test("Warranty Activated", False, "Warranty dates not set")
            
            if updated_serial.get('customer_id') == created_customer['id']:
                self.log_test("Serial Customer Linked", True, "Serial linked to customer")
            else:
                self.log_test("Serial Customer Linked", False, "Serial not linked to customer")
        
        return True

    def test_serial_filters(self):
        """Test serial filtering"""
        # Test serial filters
        self.run_test("Filter Serials by Status", "GET", "admin/serials?status=in_stock", 200)
        self.run_test("Filter Serials by Warehouse", "GET", "admin/serials?warehouse_id=test", 200)
        self.run_test("Search Serials", "GET", "admin/serials?search=SN", 200)

    def test_customer_filters(self):
        """Test customer filtering"""
        # Test customer search
        self.run_test("Search Customers", "GET", "admin/customers?search=test", 200)

    def test_sales_order_filters(self):
        """Test sales order filtering"""
        # Test order filters
        self.run_test("Filter Orders by Status", "GET", "admin/sales/orders?status=completed", 200)
        self.run_test("Filter Orders by Customer", "GET", "admin/sales/orders?customer_id=test", 200)
        self.run_test("Filter Orders by Warehouse", "GET", "admin/sales/orders?warehouse_id=test", 200)

def main():
    print("🚀 Starting OTNT ERP API Testing...")
    print("=" * 50)
    
    tester = OTNTERPTester()
    
    # Test root endpoint
    tester.test_root_endpoint()
    
    # Test authentication - try login first, then register if needed
    print("\n📝 Testing Authentication...")
    login_success = tester.test_login("admin@otnt.vn", "admin123")
    
    if not login_success:
        print("Login failed, trying registration...")
        register_success = tester.test_register("admin@otnt.vn", "admin123", "Admin User", "admin")
        if not register_success:
            print("❌ Both login and registration failed, stopping tests")
            return 1
    
    # Test profile
    tester.test_get_profile()
    
    # Test dashboard
    print("\n📊 Testing Dashboard...")
    tester.test_dashboard_stats()
    tester.test_seed_data()
    
    # Test CRUD operations
    print("\n🏷️ Testing Categories...")
    tester.test_categories_crud()
    
    print("\n🏢 Testing Brands...")
    tester.test_brands_crud()
    
    print("\n📦 Testing Products...")
    tester.test_products_crud()
    
    # Test warehouse operations (Week 2 feature)
    print("\n🏭 Testing Warehouses...")
    tester.test_warehouses_crud()
    
    # Test inventory operations (Week 2 feature)
    print("\n📋 Testing Inventory Documents...")
    tester.test_inventory_documents()
    
    print("\n📊 Testing Stock Balance...")
    tester.test_stock_balance()
    
    print("\n🔍 Testing Inventory Filters...")
    tester.test_inventory_filters()
    
    # Test Week 3 features: Serial/IMEI, Customers, Sales Orders
    print("\n🏷️ Testing Serial/IMEI Management...")
    tester.test_serials_crud()
    
    print("\n👥 Testing Customers Management...")
    tester.test_customers_crud()
    
    print("\n🛒 Testing Sales Orders...")
    tester.test_sales_orders_crud()
    
    print("\n🔄 Testing Complete Sales + Serial + Warranty Workflow...")
    tester.test_sales_with_serial_workflow()
    
    print("\n🔍 Testing Week 3 Filters...")
    tester.test_serial_filters()
    tester.test_customer_filters()
    tester.test_sales_order_filters()
    
    # Test store endpoints
    print("\n🏪 Testing Store Endpoints...")
    tester.test_store_endpoints()
    tester.test_product_filters()
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Summary: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        
        # Show failed tests
        failed_tests = [t for t in tester.test_results if not t['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())
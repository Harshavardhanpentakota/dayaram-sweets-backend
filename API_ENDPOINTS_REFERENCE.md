# 📋 Complete API Endpoints Reference

## Base URL: `http://localhost:5000`

---

## 🔐 Authentication Header Format
```
Authorization: Bearer <JWT_TOKEN>
```

---

# 1. ADMIN ROUTES (`/api/admin`)

## 1.1 AUTHENTICATION

### Admin Login
- **Endpoint:** `POST /api/admin/login`
- **Access:** Public (No authentication required)
- **Inputs:**
  ```json
  {
    "email": "admin@example.com",
    "password": "password123"
  }
  ```
- **Validation:**
  - email: Valid email format (required)
  - password: Min 6 characters (required)

---

## 1.2 ADMIN MANAGEMENT (Settings → Admin Users)

### Get All Admins
- **Endpoint:** `GET /api/admin/admins`
- **Access:** Admin with WRITE permission
- **Query Parameters:**
  - `isActive`: true | false (optional)
  - `role`: super-admin | admin | manager | staff (optional)

### Get Single Admin
- **Endpoint:** `GET /api/admin/admins/:adminId`
- **Access:** Admin with WRITE permission
- **URL Parameters:**
  - `adminId`: MongoDB ObjectId (24 hex characters)

### Create New Admin
- **Endpoint:** `POST /api/admin/admins`
- **Access:** Admin with WRITE permission
- **Inputs:**
  ```json
  {
    "username": "newadmin",
    "email": "admin@example.com",
    "password": "password123",
    "role": "manager",
    "accessRights": {
      "read": true,
      "write": true
    },
    "permissions": {
      "manageProducts": true,
      "manageOrders": true,
      "manageUsers": false,
      "manageAdmins": false,
      "manageSettings": false,
      "manageCoupons": true,
      "viewReports": true
    }
  }
  ```
- **Validation:**
  - username: 3-50 characters (required)
  - email: Valid email (required)
  - password: Min 6 characters (required)
  - role: super-admin | admin | manager | staff (optional, default: staff)

### Update Admin
- **Endpoint:** `PUT /api/admin/admins/:adminId`
- **Access:** Admin with WRITE permission
- **URL Parameters:**
  - `adminId`: MongoDB ObjectId
- **Inputs:** (All optional)
  ```json
  {
    "username": "updatedname",
    "email": "newemail@example.com",
    "password": "newpassword",
    "role": "admin",
    "accessRights": { "read": true, "write": true },
    "permissions": { "manageProducts": true },
    "isActive": true
  }
  ```

### Delete Admin
- **Endpoint:** `DELETE /api/admin/admins/:adminId`
- **Access:** Admin with WRITE permission
- **URL Parameters:**
  - `adminId`: MongoDB ObjectId

### Toggle Admin Status
- **Endpoint:** `PATCH /api/admin/admins/:adminId/toggle-status`
- **Access:** Admin with WRITE permission
- **URL Parameters:**
  - `adminId`: MongoDB ObjectId

---

## 1.3 SETTINGS MANAGEMENT (Settings → Delivery Charges)

### Get All Settings
- **Endpoint:** `GET /api/admin/settings`
- **Access:** Admin with READ permission
- **Query Parameters:**
  - `category`: delivery | payment | general | taxes | other (optional)
  - `isActive`: true | false (optional)

### Get Delivery Charges
- **Endpoint:** `GET /api/admin/settings/delivery-charges`
- **Access:** Admin with READ permission

### Initialize Default Settings
- **Endpoint:** `POST /api/admin/settings/initialize`
- **Access:** Admin with WRITE permission
- **Inputs:** None (creates default settings)

### Get Setting by Key
- **Endpoint:** `GET /api/admin/settings/:key`
- **Access:** Admin with READ permission
- **URL Parameters:**
  - `key`: Setting key (e.g., "delivery.base_charge")

### Create Setting
- **Endpoint:** `POST /api/admin/settings`
- **Access:** Admin with WRITE permission
- **Inputs:**
  ```json
  {
    "key": "delivery.weekend_charge",
    "value": 75,
    "type": "number",
    "category": "delivery",
    "description": "Weekend delivery charge",
    "isActive": true
  }
  ```
- **Validation:**
  - key: Min 2 characters (required)
  - value: Any type (required)
  - type: string | number | boolean | object | array (required)
  - category: delivery | payment | general | taxes | other (required)

### Update Setting (Property-Value)
- **Endpoint:** `PUT /api/admin/settings/:key`
- **Access:** Admin with WRITE permission
- **URL Parameters:**
  - `key`: Setting key
- **Inputs:**
  ```json
  {
    "value": 60,
    "description": "Updated description",
    "isActive": true
  }
  ```

### Bulk Update Settings
- **Endpoint:** `PATCH /api/admin/settings/bulk-update`
- **Access:** Admin with WRITE permission
- **Inputs:**
  ```json
  {
    "settings": [
      { "key": "delivery.base_charge", "value": 60 },
      { "key": "tax.gst_rate", "value": 18 }
    ]
  }
  ```

### Delete Setting
- **Endpoint:** `DELETE /api/admin/settings/:key`
- **Access:** Admin with WRITE permission
- **URL Parameters:**
  - `key`: Setting key

---

## 1.4 COUPONS MANAGEMENT (Settings → Coupons)

### Get Coupon Statistics
- **Endpoint:** `GET /api/admin/coupons/stats`
- **Access:** Admin with READ permission

### Get All Coupons
- **Endpoint:** `GET /api/admin/coupons`
- **Access:** Admin with READ permission
- **Query Parameters:**
  - `isActive`: true | false (optional)
  - `sortBy`: createdAt | validFrom | validUntil | usedCount | code (optional)
  - `order`: asc | desc (optional)

### Validate Coupon
- **Endpoint:** `POST /api/admin/coupons/validate`
- **Access:** Public (No authentication)
- **Inputs:**
  ```json
  {
    "code": "WELCOME10",
    "orderValue": 500,
    "userId": "64f5a8b9c1234567890abcde",
    "category": "sweets",
    "productIds": ["64f5a8b9c1234567890abcdf"]
  }
  ```
- **Validation:**
  - code: Min 3 characters (required)
  - orderValue: Positive number (required)
  - userId: MongoDB ObjectId (optional)

### Get Coupon by Code
- **Endpoint:** `GET /api/admin/coupons/:code`
- **Access:** Admin with READ permission
- **URL Parameters:**
  - `code`: Coupon code (e.g., "WELCOME10")

### Create Coupon
  ```json
  {
    "code": "NEWYEAR2026",
    "description": "New Year special - 20% off",
    "discountType": "percentage",
    "discountValue": 20,

### Upload Image to Cloudinary
- **Endpoint:** `POST /api/admin/image/upload`
- **Access:** Admin with WRITE permission
- **Content-Type:** `multipart/form-data`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Form-Data Inputs:**
  - `image` (required): Image file (field name must be exactly `image`)
  - `folder` (optional): Cloudinary folder path string
- **File Requirements:**
  - Only image MIME types are accepted (`image/*`)
  - Max size: 10MB
  - If file is larger than 10MB, response is:
    - `image upload failure: file size is greater than 10 mb`
- **Environment Requirements:**
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- **Success Response (201):**
  ```json
  {
    "message": "Image uploaded successfully",
    "data": {
      "url": "https://res.cloudinary.com/.../image/upload/...jpg",
      "publicId": "dayaram-sweets/products/sample",
      "format": "jpg",
      "width": 1200,
      "height": 800,
      "bytes": 152340
    }
  }
  ```
- **cURL Example:**
  ```bash
  curl -X POST http://localhost:5000/api/admin/image/upload \
    -H "Authorization: Bearer <JWT_TOKEN>" \
    -F "image=@C:/path/to/photo.jpg" \
    -F "folder=dayaram-sweets/products"
  ```

### Cancel Image Upload (Delete from Cloudinary)
- **Endpoint:** `POST /api/admin/image/cancel`
- **Access:** Admin with WRITE permission
- **Content-Type:** `application/json`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Inputs:**
  ```json
  {
    "imageUrl": "https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/dayaram-sweets/products/sample.jpg",
    "cancel": true
  }
  ```
- **Notes:**
  - `imageUrl` is required and must be a Cloudinary URL.
  - Cancel flag can be any one of: `cancel`, `cancelled`, `isCancelled` and must be `true`.
- **Success Response (200):**
  ```json
  {
    "message": "Cancelled image removed from Cloudinary",
    "data": {
      "publicId": "dayaram-sweets/products/sample",
      "result": "ok"
    }
  }
  ```
    "minOrderValue": 500,
    "maxDiscountAmount": 200,
    "usageLimit": 1000,
    "validFrom": "2026-01-01T00:00:00.000Z",
    "validUntil": "2026-01-31T23:59:59.000Z",
    "isActive": true,
    "applicableCategories": ["sweets", "gift-boxes"],
    "applicableProducts": ["64f5a8b9c1234567890abcde"],

### Example 3: Upload Product Image to Cloudinary

```bash
curl -X POST http://localhost:5000/api/admin/image/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "image=@product-image.jpg" \
  -F "folder=dayaram-sweets/products"
```

### Example 4: Cancel Upload and Delete Image

```bash
curl -X POST http://localhost:5000/api/admin/image/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "imageUrl": "https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/dayaram-sweets/products/sample.jpg",
    "cancel": true
  }'
```
    "excludedProducts": ["64f5a8b9c1234567890abcdf"],
    "firstOrderOnly": false
  }
  ```
- **Validation:**
  - code: 3-20 characters, uppercase (required)
  - description: Min 10 characters (required)
  - discountType: percentage | fixed (required)
  - discountValue: Non-negative (required)
  - validFrom: Date (required)
  - validUntil: Date after validFrom (required)
  - Percentage cannot exceed 100%

### Update Coupon
- **Endpoint:** `PUT /api/admin/coupons/:code`
- **Access:** Admin with WRITE permission
- **URL Parameters:**
  - `code`: Coupon code
- **Inputs:** (All optional, same structure as create)

### Toggle Coupon Status
- **Endpoint:** `PATCH /api/admin/coupons/:code/toggle-status`
- **Access:** Admin with WRITE permission
- **URL Parameters:**
  - `code`: Coupon code

### Delete Coupon
- **Endpoint:** `DELETE /api/admin/coupons/:code`
- **Access:** Admin with WRITE permission
- **URL Parameters:**
  - `code`: Coupon code

---

## 1.5 PRODUCT MANAGEMENT (Admin Only)

### Get All Products (Admin)
- **Endpoint:** `GET /api/admin/products`
- **Access:** Admin with READ permission

### Get Products by Category (Admin)
- **Endpoint:** `GET /api/admin/products/category/:category`
- **Access:** Admin with READ permission
- **URL Parameters:**
  - `category`: sweets | namkeen | dry-fruits | gift-boxes | seasonal | other

### Create Product
- **Endpoint:** `POST /api/admin/products`
- **Access:** Admin with WRITE permission
- **Inputs:**
  ```json
  {
    "name": "Kaju Katli",
    "description": "Premium cashew sweet",
    "category": "sweets",
    "price": 450,
    "stock": 100,
    "images": ["https://example.com/image.jpg"],
    "weight": "250g",
    "ingredients": ["Cashew", "Sugar", "Ghee"],
    "nutritionalInfo": {
      "calories": 400,
      "protein": 10,
      "carbohydrates": 50,
      "fat": 20,
      "sugar": 30
    },
    "tags": ["premium", "festive"],
    "isFeatured": true,
    "originalPrice": 500,
    "discount": 10
  }
  ```
- **Validation:**
  - name: 2-200 characters (required)
  - description: Min 10 characters (required)
  - category: One of allowed values (required)
  - price: Positive number (required)
  - stock: Non-negative integer (required)

### Update Product
- **Endpoint:** `PUT /api/admin/products/:id`
- **Access:** Admin with WRITE permission
- **URL Parameters:**
  - `id`: Product MongoDB ObjectId
- **Inputs:** (All optional, same as create)

### Delete Product
- **Endpoint:** `DELETE /api/admin/products/:id`
- **Access:** Admin with WRITE permission
- **URL Parameters:**
  - `id`: Product MongoDB ObjectId
- **Note:** Soft delete (sets isActive to false)

### Bulk Upload Products
- **Endpoint:** `POST /api/admin/products/bulk-upload`
- **Access:** Admin with WRITE permission
- **Content-Type:** multipart/form-data
- **Inputs:**
  - `file`: Excel file (.xlsx or .xls)
  - Max file size: 5MB
- **Excel Format:** See BULK_UPLOAD_GUIDE.md

### Modify Product Collection
- **Endpoint:** `PATCH /api/admin/products/modify-collection`
- **Access:** Admin with WRITE permission
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Inputs:**
  ```json
  {
    "collectionName": "winter-specials",
    "isCollectionNameModified": false,
    "products": [
      { "productId": "KAJU-KATLI-001" },
      { "_id": "67d1abcd1234abcd1234abcd" }
    ]
  }
  ```
- **Input Rules:**
  - `collectionName`: Required string
  - `isCollectionNameModified`: Optional boolean, default `false`
  - `products`: Optional array when `isCollectionNameModified` is `true`
  - Each product item must include either `productId` or `_id`
- **Behavior:**
  - Updates all sent products to the requested `collectionName`
  - If `isCollectionNameModified` is `true`, all active products with non-empty collection names other than `collectionName` are also updated to `collectionName`
- **Success Response:**
  ```json
  {
    "message": "Collection updated successfully",
    "collectionName": "winter-specials",
    "explicitlyUpdatedCount": 2,
    "reassignedCollectionCount": 5,
    "isCollectionNameModified": true
  }
  ```

---

# 2. PUBLIC PRODUCT ROUTES (`/api/products`)

### Search Products
- **Endpoint:** `GET /api/products/search`
- **Access:** Public
- **Query Parameters:**
  - `search`: Text search (optional)
  - `category`: sweets | namkeen | dry-fruits | gift-boxes | seasonal | other (optional)
  - `minPrice`: Number (optional)
  - `maxPrice`: Number (optional)
  - `isBestSeller`: true | false (optional)
  - `isNewArrival`: true | false (optional)
  - `sort`: createdAt | price | name | ratings.average (optional, default: createdAt)
  - `order`: asc | desc (optional, default: desc)
  - `page`: Number (optional, default: 1)
  - `limit`: Number (optional, default: 10)

### Get All Active Products
- **Endpoint:** `GET /api/products`
- **Access:** Public

### Get Best Selling Products
- **Endpoint:** `GET /api/products/best-sellers`
- **Access:** Public
- **Query Parameters:**
  - `limit`: Number (optional, default: 10)

### Get Special Collection Groups
- **Endpoint:** `GET /api/products/special-collection`
- **Access:** Public
- **Behavior:** Returns all active products where `collection !== ""`, grouped by collection name
- **Success Response:**
  ```json
  [
    {
      "collection_name": "winter-specials",
      "products": [
        {
          "_id": "67d1abcd1234abcd1234abcd",
          "productId": "KAJU-KATLI-001",
          "name": "Kaju Katli",
          "collection": "winter-specials"
        }
      ]
    }
  ]
  ```

### Get Special Collection Products
- **Endpoint:** `GET /api/products/special-collections`
- **Access:** Public
- **Behavior:** Returns active products where `collection` is neither empty nor `best-seller`

### Get Products by Category
- **Endpoint:** `GET /api/products/category/:category`
- **Access:** Public
- **URL Parameters:**
  - `category`: sweets | namkeen | dry-fruits | gift-boxes | seasonal | other

### Get Single Product
- **Endpoint:** `GET /api/products/:id`
- **Access:** Public
- **URL Parameters:**
  - `id`: Product MongoDB ObjectId

---

# 3. USER ROUTES (`/api/users`)

### Register User
- **Endpoint:** `POST /api/users/register`
- **Access:** Public
- **Inputs:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "9876543210"
  }
  ```
- **Validation:**
  - name: Min 2 characters (required)
  - email: Valid email (required)
  - password: Min 6 characters (required)
  - phone: 10 digits (required)

### Login User
- **Endpoint:** `POST /api/users/login`
- **Access:** Public
- **Inputs:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

### Get User Profile
- **Endpoint:** `GET /api/users/profile/:id`
- **Access:** Protected (User authentication required)
- **URL Parameters:**
  - `id`: User MongoDB ObjectId

### Update User Profile
- **Endpoint:** `PUT /api/users/profile/:id`
- **Access:** Protected (User authentication required)
- **URL Parameters:**
  - `id`: User MongoDB ObjectId
- **Inputs:** (All optional)
  ```json
  {
    "name": "Updated Name",
    "phone": "9876543210",
    "email": "newemail@example.com"
  }
  ```

### Get All Users
- **Endpoint:** `GET /api/users`
- **Access:** Protected (Admin access)

### Delete User
- **Endpoint:** `DELETE /api/users/:id`
- **Access:** Protected (Admin access)
- **URL Parameters:**
  - `id`: User MongoDB ObjectId

---

## 3.1 SAVED ADDRESSES

### Get Saved Addresses
- **Endpoint:** `GET /api/users/:userId/addresses`
- **Access:** Protected
- **URL Parameters:**
  - `userId`: User MongoDB ObjectId

### Add Saved Address
- **Endpoint:** `POST /api/users/:userId/addresses`
- **Access:** Protected
- **URL Parameters:**
  - `userId`: User MongoDB ObjectId
- **Inputs:**
  ```json
  {
    "label": "Home",
    "name": "John Doe",
    "phone": "9876543210",
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India",
    "isDefault": true
  }
  ```

### Update Saved Address
- **Endpoint:** `PUT /api/users/:userId/addresses/:addressId`
- **Access:** Protected
- **URL Parameters:**
  - `userId`: User MongoDB ObjectId
  - `addressId`: Address MongoDB ObjectId
- **Inputs:** (All optional, same as add)

### Delete Saved Address
- **Endpoint:** `DELETE /api/users/:userId/addresses/:addressId`
- **Access:** Protected
- **URL Parameters:**
  - `userId`: User MongoDB ObjectId
  - `addressId`: Address MongoDB ObjectId

---

# 4. ORDER ROUTES (`/api/orders`)

### Create Order
- **Endpoint:** `POST /api/orders`
- **Access:** Protected (User authentication)
- **Inputs:**
  ```json
  {
    "userId": "64f5a8b9c1234567890abcde",
    "items": [
      {
        "productId": "64f5a8b9c1234567890abcdf",
        "name": "Kaju Katli",
        "quantity": 2,
        "price": 450,
        "subtotal": 900
      }
    ],
    "shippingAddress": {
      "name": "John Doe",
      "phone": "9876543210",
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001",
      "country": "India"
    },
    "paymentMethod": "cod",
    "shippingCost": 50,
    "tax": 162,
    "discount": 0
  }
  ```
- **Validation:**
  - userId: MongoDB ObjectId (required)
  - items: Non-empty array (required)
  - shippingAddress: Complete address object (required)
  - paymentMethod: cod | online | card | upi | wallet (required)

### Get All Orders
- **Endpoint:** `GET /api/orders`
- **Access:** Protected (Admin access)

### Get User Orders
- **Endpoint:** `GET /api/orders/user/:userId`
- **Access:** Protected
- **URL Parameters:**
  - `userId`: User MongoDB ObjectId

### Get Order by ID
- **Endpoint:** `GET /api/orders/:id`
- **Access:** Protected
- **URL Parameters:**
  - `id`: Order MongoDB ObjectId

### Generate Invoice
- **Endpoint:** `GET /api/orders/:id/invoice`
- **Access:** Protected
- **URL Parameters:**
  - `id`: Order MongoDB ObjectId

### Update Order Status
- **Endpoint:** `PUT /api/orders/:id/status`
- **Access:** Protected (Admin access)
- **URL Parameters:**
  - `id`: Order MongoDB ObjectId
- **Inputs:**
  ```json
  {
    "status": "confirmed",
    "notes": "Order confirmed and processing"
  }
  ```
- **Validation:**
  - status: pending | confirmed | processing | shipped | delivered | cancelled (required)

### Delete Order
- **Endpoint:** `DELETE /api/orders/:id`
- **Access:** Protected (Admin access)
- **URL Parameters:**
  - `id`: Order MongoDB ObjectId

---

# 5. PAYMENT ROUTES (`/api/payments`)

### Create Payment
- **Endpoint:** `POST /api/payments`
- **Access:** Protected
- **Inputs:**
  ```json
  {
    "orderId": "64f5a8b9c1234567890abcde",
    "amount": 1012,
    "paymentMethod": "online",
    "transactionId": "TXN123456789",
    "gatewayResponse": { "status": "success" }
  }
  ```
- **Validation:**
  - orderId: MongoDB ObjectId (required)
  - amount: Positive number (required)
  - paymentMethod: cod | online | card | upi | wallet (required)

### Get All Payments
- **Endpoint:** `GET /api/payments`
- **Access:** Protected (Admin access)

### Get Payments by Order
- **Endpoint:** `GET /api/payments/order/:orderId`
- **Access:** Protected
- **URL Parameters:**
  - `orderId`: Order MongoDB ObjectId

### Get Payment by ID
- **Endpoint:** `GET /api/payments/:id`
- **Access:** Protected
- **URL Parameters:**
  - `id`: Payment MongoDB ObjectId

### Update Payment Status
- **Endpoint:** `PUT /api/payments/:id/status`
- **Access:** Protected (Admin access)
- **URL Parameters:**
  - `id`: Payment MongoDB ObjectId
- **Inputs:**
  ```json
  {
    "status": "completed"
  }
  ```
- **Validation:**
  - status: pending | completed | failed | refunded (required)

---

# 6. RESET PASSWORD ROUTES (`/api/reset-password`)

### Send OTP
- **Endpoint:** `POST /api/reset-password/send-otp`
- **Access:** Public
- **Inputs:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Validation:**
  - email: Valid email (required)

### Verify OTP and Reset Password
- **Endpoint:** `POST /api/reset-password/verify-otp`
- **Access:** Public
- **Inputs:**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "newpassword123"
  }
  ```
- **Validation:**
  - email: Valid email (required)
  - otp: 6 digits (required)
  - newPassword: Min 6 characters (required)

### Resend OTP
- **Endpoint:** `POST /api/reset-password/resend-otp`
- **Access:** Public
- **Inputs:**
  ```json
  {
    "email": "user@example.com"
  }
  ```

---

# 7. HEALTH CHECK

### Server Health
- **Endpoint:** `GET /health`
- **Access:** Public
- **Response:**
  ```json
  {
    "status": "OK",
    "message": "Server is running"
  }
  ```

---

# ACCESS PERMISSION SUMMARY

## 🔓 Public Endpoints (No Authentication)
- Admin Login
- User Registration & Login
- All Product Routes (GET only)
- Coupon Validation
- Reset Password (all routes)
- Health Check

## 🔐 Protected Endpoints

### Admin with READ Permission
- Get All Admins
- Get Admin by ID
- Get All Settings
- Get Delivery Charges
- Get Setting by Key
- Get Coupon Stats
- Get All Coupons
- Get Coupon by Code
- Get All Products (Admin view)
- Get Products by Category (Admin view)

### Admin with WRITE Permission
- Create Admin
- Update Admin
- Delete Admin
- Toggle Admin Status
- Create Setting
- Update Setting
- Bulk Update Settings
- Delete Setting
- Initialize Settings
- Create Coupon
- Update Coupon
- Delete Coupon
- Toggle Coupon Status
- Create Product
- Update Product
- Delete Product
- Bulk Upload Products
- Modify Product Collection

### User Authentication Required
- User Profile (GET/PUT)
- Saved Addresses (CRUD)
- Create Order
- Get User Orders
- Get Order Details
- Create Payment

### Admin Only
- Get All Users
- Delete User
- Get All Orders
- Update Order Status
- Delete Order
- Get All Payments
- Update Payment Status

---

# QUICK REFERENCE TABLE

| Route Base | Total Endpoints | Public | Admin READ | Admin WRITE | User Auth |
|------------|-----------------|--------|------------|-------------|-----------|
| `/api/admin` | 35 | 1 | 12 | 21 | 0 |
| `/api/products` | 7 | 7 | 0 | 0 | 0 |
| `/api/users` | 9 | 2 | 0 | 0 | 7 |
| `/api/orders` | 7 | 0 | 0 | 3 | 4 |
| `/api/payments` | 5 | 0 | 0 | 2 | 3 |
| `/api/reset-password` | 3 | 3 | 0 | 0 | 0 |
| `/health` | 1 | 1 | 0 | 0 | 0 |
| **TOTAL** | **67** | **14** | **12** | **26** | **14** |

---

# NOTES

1. **MongoDB ObjectId Format:** 24 hexadecimal characters (e.g., `64f5a8b9c1234567890abcde`)
2. **Date Format:** ISO 8601 (e.g., `2026-01-01T00:00:00.000Z`)
3. **JWT Token Expiry:** 24 hours
4. **File Upload Max Size:** 5MB (Excel files only)
5. **Pagination Default:** page=1, limit=10
6. **All prices in INR (Indian Rupees)**
7. **Soft Delete:** Products and orders are not permanently deleted
8. **Password Hashing:** Automatic with bcrypt (salt rounds: 10)

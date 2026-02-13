# Admin Settings Management API

## Overview
Comprehensive settings management system for admin users. This includes admin user management, roles & permissions, delivery charges configuration, and coupon management.

---

## Settings Menu Structure

```
Settings (Admin Only - /api/admin)
 ├── Admin Users          → Manage admin accounts, roles & permissions
 ├── Roles & Permissions  → Define access control for admins
 ├── Delivery Charges     → Configure shipping costs and rules
 └── Coupons             → Create and manage discount coupons
```

---

## Base URL
```
/api/admin
```

**All routes require authentication via JWT token:**
```
Authorization: Bearer <your-jwt-token>
```

---

# 1. ADMIN USERS MANAGEMENT

## Get All Admins
**GET** `/api/admin/admins`

**Authentication:** Required (Admin with write access)

**Query Parameters:**
- `isActive`: true | false (optional)
- `role`: super-admin | admin | manager | staff (optional)

**Response:**
```json
[
  {
    "_id": "64f5a8b9c1234567890abcde",
    "username": "admin1",
    "email": "admin@example.com",
    "role": "super-admin",
    "accessRights": {
      "read": true,
      "write": true
    },
    "permissions": {
      "manageProducts": true,
      "manageOrders": true,
      "manageUsers": true,
      "manageAdmins": true,
      "manageSettings": true,
      "manageCoupons": true,
      "viewReports": true
    },
    "isActive": true,
    "lastLogin": "2026-02-14T10:30:00.000Z",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
]
```

## Get Single Admin
**GET** `/api/admin/admins/:adminId`

**Authentication:** Required (Admin with write access)

## Create New Admin
**POST** `/api/admin/admins`

**Authentication:** Required (Admin with write access)

**Request Body:**
```json
{
  "username": "newadmin",
  "email": "newadmin@example.com",
  "password": "securepassword123",
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

**Validation:**
- username: 3-50 characters (required)
- email: Valid email format (required)
- password: Minimum 6 characters (required)
- role: super-admin | admin | manager | staff (default: staff)
- All permission fields are optional booleans

## Update Admin
**PUT** `/api/admin/admins/:adminId`

**Authentication:** Required (Admin with write access)

**Request Body:** (All fields optional)
```json
{
  "username": "updatedadmin",
  "email": "updated@example.com",
  "password": "newpassword123",
  "role": "admin",
  "accessRights": {
    "read": true,
    "write": true
  },
  "permissions": {
    "manageProducts": true,
    "manageSettings": true
  },
  "isActive": true
}
```

## Delete Admin
**DELETE** `/api/admin/admins/:adminId`

**Authentication:** Required (Admin with write access)

## Toggle Admin Status
**PATCH** `/api/admin/admins/:adminId/toggle-status`

**Authentication:** Required (Admin with write access)

Activates/deactivates an admin account.

---

# 2. ROLES & PERMISSIONS

## Admin Roles

### Super Admin
- Full system access
- Can manage all admins
- Can modify all settings
- Cannot be deactivated

### Admin
- Manage products, orders, users
- View reports
- Limited settings access

### Manager
- Manage products and orders
- View reports
- No admin management

### Staff
- Basic product management
- Order processing only

## Permission Types

| Permission | Description |
|------------|-------------|
| manageProducts | Create, update, delete products |
| manageOrders | Process and manage orders |
| manageUsers | Manage customer accounts |
| manageAdmins | Create and manage admin users |
| manageSettings | Modify system settings |
| manageCoupons | Create and manage coupons |
| viewReports | Access analytics and reports |

---

# 3. DELIVERY CHARGES MANAGEMENT

## Get All Settings
**GET** `/api/admin/settings`

**Authentication:** Required (Admin with read access)

**Query Parameters:**
- `category`: delivery | payment | general | taxes | other
- `isActive`: true | false

## Get Delivery Charges
**GET** `/api/admin/settings/delivery-charges`

**Authentication:** Required (Admin with read access)

Returns all delivery-related settings.

**Response:**
```json
[
  {
    "_id": "64f5a8b9c1234567890abcde",
    "key": "delivery.base_charge",
    "value": 50,
    "type": "number",
    "category": "delivery",
    "description": "Base delivery charge",
    "isActive": true
  },
  {
    "key": "delivery.free_above",
    "value": 500,
    "type": "number",
    "category": "delivery",
    "description": "Free delivery for orders above this amount"
  }
]
```

## Initialize Default Settings
**POST** `/api/admin/settings/initialize`

**Authentication:** Required (Admin with write access)

Creates default settings for delivery, taxes, payment, etc. Run once during initial setup.

**Default Settings Created:**
- `delivery.base_charge`: 50
- `delivery.free_above`: 500
- `delivery.express_charge`: 100
- `delivery.estimated_days`: 3
- `tax.gst_rate`: 18
- `general.min_order_value`: 100
- `general.currency`: "INR"
- `payment.cod_enabled`: true
- `payment.online_enabled`: true

## Get Setting by Key
**GET** `/api/admin/settings/:key`

**Authentication:** Required (Admin with read access)

Example: `/api/admin/settings/delivery.base_charge`

## Create Setting
**POST** `/api/admin/settings`

**Authentication:** Required (Admin with write access)

**Request Body:**
```json
{
  "key": "delivery.weekend_charge",
  "value": 75,
  "type": "number",
  "category": "delivery",
  "description": "Additional charge for weekend delivery",
  "isActive": true
}
```

**Validation:**
- key: Unique identifier (required)
- value: Any type (required)
- type: string | number | boolean | object | array (required)
- category: delivery | payment | general | taxes | other (required)

## Update Setting (Property-Value Approach)
**PUT** `/api/admin/settings/:key`

**Authentication:** Required (Admin with write access)

**Request Body:**
```json
{
  "value": 60,
  "description": "Updated base delivery charge"
}
```

This endpoint allows updating any property of a setting using the key.

## Update Multiple Settings (Bulk Update)
**PATCH** `/api/admin/settings/bulk-update`

**Authentication:** Required (Admin with write access)

**Request Body:**
```json
{
  "settings": [
    {
      "key": "delivery.base_charge",
      "value": 60
    },
    {
      "key": "delivery.express_charge",
      "value": 120
    },
    {
      "key": "tax.gst_rate",
      "value": 18
    }
  ]
}
```

**Response:**
```json
{
  "message": "Settings update completed",
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  },
  "results": {
    "success": [
      { "key": "delivery.base_charge", "value": 60 },
      { "key": "delivery.express_charge", "value": 120 },
      { "key": "tax.gst_rate", "value": 18 }
    ],
    "failed": []
  }
}
```

## Delete Setting
**DELETE** `/api/admin/settings/:key`

**Authentication:** Required (Admin with write access)

---

# 4. COUPONS MANAGEMENT

## Get All Coupons
**GET** `/api/admin/coupons`

**Authentication:** Required (Admin with read access)

**Query Parameters:**
- `isActive`: true | false
- `sortBy`: createdAt | validFrom | validUntil | usedCount | code
- `order`: asc | desc

**Response:**
```json
[
  {
    "_id": "64f5a8b9c1234567890abcde",
    "code": "WELCOME10",
    "description": "10% off on first order",
    "discountType": "percentage",
    "discountValue": 10,
    "minOrderValue": 300,
    "maxDiscountAmount": 100,
    "usageLimit": 100,
    "usedCount": 45,
    "validFrom": "2026-01-01T00:00:00.000Z",
    "validUntil": "2026-12-31T23:59:59.000Z",
    "isActive": true,
    "applicableCategories": ["sweets", "namkeen"],
    "firstOrderOnly": true,
    "createdBy": {
      "_id": "...",
      "username": "admin1",
      "email": "admin@example.com"
    }
  }
]
```

## Get Coupon Statistics
**GET** `/api/admin/coupons/stats`

**Authentication:** Required (Admin with read access)

**Response:**
```json
{
  "total": 25,
  "active": 18,
  "expired": 7,
  "topUsed": [
    {
      "code": "FESTIVE50",
      "description": "Festival special offer",
      "usedCount": 250,
      "usageLimit": 500
    }
  ]
}
```

## Validate Coupon
**POST** `/api/admin/coupons/validate`

**Authentication:** Not required (can be called from order system)

**Request Body:**
```json
{
  "code": "WELCOME10",
  "orderValue": 500,
  "userId": "64f5a8b9c1234567890abcde",
  "category": "sweets",
  "productIds": ["64f5a8b9c1234567890abcdf"]
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "coupon": {
    "code": "WELCOME10",
    "description": "10% off on first order",
    "discountType": "percentage",
    "discountValue": 10
  },
  "discountAmount": 50,
  "finalAmount": 450
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "message": "Coupon has expired or not yet valid"
}
```

## Get Coupon by Code
**GET** `/api/admin/coupons/:code`

**Authentication:** Required (Admin with read access)

Example: `/api/admin/coupons/WELCOME10`

## Create Coupon
**POST** `/api/admin/coupons`

**Authentication:** Required (Admin with write access)

**Request Body:**
```json
{
  "code": "NEWYEAR2026",
  "description": "New Year special - 20% off on all products",
  "discountType": "percentage",
  "discountValue": 20,
  "minOrderValue": 500,
  "maxDiscountAmount": 200,
  "usageLimit": 1000,
  "validFrom": "2026-01-01T00:00:00.000Z",
  "validUntil": "2026-01-31T23:59:59.000Z",
  "isActive": true,
  "applicableCategories": ["sweets", "gift-boxes"],
  "firstOrderOnly": false
}
```

**Validation:**
- code: 3-20 characters, auto-converted to uppercase (required)
- description: Minimum 10 characters (required)
- discountType: percentage | fixed (required)
- discountValue: Non-negative number (required)
- minOrderValue: Non-negative number (default: 0)
- usageLimit: Minimum 1 (default: 1)
- validFrom: Date (required)
- validUntil: Must be after validFrom (required)
- Percentage discount cannot exceed 100%

## Update Coupon
**PUT** `/api/admin/coupons/:code`

**Authentication:** Required (Admin with write access)

**Request Body:** (All fields optional)
```json
{
  "description": "Updated description",
  "discountValue": 25,
  "maxDiscountAmount": 250,
  "isActive": true
}
```

## Toggle Coupon Status
**PATCH** `/api/admin/coupons/:code/toggle-status`

**Authentication:** Required (Admin with write access)

Activates/deactivates a coupon.

## Delete Coupon
**DELETE** `/api/admin/coupons/:code`

**Authentication:** Required (Admin with write access)

---

## Usage Examples

### Example 1: Setup Delivery Charges

```bash
# 1. Login as Admin
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# 2. Initialize Default Settings
curl -X POST http://localhost:5000/api/admin/settings/initialize \
  -H "Authorization: Bearer <token>"

# 3. Update Delivery Charges
curl -X PATCH http://localhost:5000/api/admin/settings/bulk-update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "settings": [
      { "key": "delivery.base_charge", "value": 60 },
      { "key": "delivery.free_above", "value": 600 }
    ]
  }'
```

### Example 2: Create Admin User with Specific Permissions

```bash
curl -X POST http://localhost:5000/api/admin/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "username": "product_manager",
    "email": "manager@example.com",
    "password": "secure123",
    "role": "manager",
    "permissions": {
      "manageProducts": true,
      "manageOrders": true,
      "manageCoupons": true,
      "viewReports": true
    }
  }'
```

### Example 3: Create Festival Coupon

```bash
curl -X POST http://localhost:5000/api/admin/coupons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "code": "DIWALI2026",
    "description": "Diwali Special - 25% off on all sweets",
    "discountType": "percentage",
    "discountValue": 25,
    "minOrderValue": 1000,
    "maxDiscountAmount": 500,
    "usageLimit": 5000,
    "validFrom": "2026-10-20T00:00:00.000Z",
    "validUntil": "2026-11-05T23:59:59.000Z",
    "applicableCategories": ["sweets", "gift-boxes"]
  }'
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. write permission required."
}
```

### 400 Bad Request
```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "discountValue",
      "message": "Percentage discount cannot exceed 100%"
    }
  ]
}
```

### 404 Not Found
```json
{
  "message": "Setting not found"
}
```

---

## Settings Categories

### Delivery Settings
- `delivery.base_charge` - Base shipping cost
- `delivery.free_above` - Free shipping threshold
- `delivery.express_charge` - Express delivery cost
- `delivery.estimated_days` - Standard delivery time
- `delivery.weekend_charge` - Weekend surcharge

### Tax Settings
- `tax.gst_rate` - GST percentage
- `tax.cgst_rate` - CGST percentage
- `tax.sgst_rate` - SGST percentage

### Payment Settings
- `payment.cod_enabled` - Cash on delivery availability
- `payment.online_enabled` - Online payment availability
- `payment.min_cod_value` - Minimum order for COD

### General Settings
- `general.min_order_value` - Minimum order amount
- `general.currency` - Currency code
- `general.support_email` - Support contact email
- `general.support_phone` - Support contact number

---

## Security Notes

1. **Authentication**: All routes require valid JWT token
2. **Password Hashing**: Passwords automatically hashed with bcrypt
3. **Role-Based Access**: Granular permission control
4. **Audit Trail**: Last login tracking for admins
5. **Input Validation**: All inputs validated using Zod schemas

---

## Environment Variables

```env
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
MONGODB_URI=your-mongodb-connection-string
```

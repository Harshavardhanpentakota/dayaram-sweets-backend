# Admin Routes & Product Management API

## Overview
All product management operations are now restricted to authenticated admins with appropriate access rights. This document outlines the admin authentication system and available endpoints.

## Authentication System

### Access Rights
Admins have two types of permissions:
- **Read Access**: View products and inventory
- **Write Access**: Create, update, delete products, and manage bulk uploads

### JWT Token
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Routes

### Base URL
```
/api/admin
```

---

## Authentication Endpoints

### 1. Admin Login
**POST** `/api/admin/login`

Login to get JWT token for authenticated requests.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "64f5a8b9c1234567890abcde",
    "username": "admin1",
    "email": "admin@example.com",
    "accessRights": {
      "read": true,
      "write": true
    }
  }
}
```

**Validation:**
- Email must be valid format
- Password must be at least 6 characters

---

## Admin Management Endpoints

### 2. Create New Admin
**POST** `/api/admin/admins`

**Authentication:** Required (Admin with write access)

**Request Body:**
```json
{
  "username": "newadmin",
  "email": "newadmin@example.com",
  "password": "securepassword123",
  "accessRights": {
    "read": true,
    "write": false
  }
}
```

**Validation:**
- Username: 3-50 characters
- Email: Valid email format
- Password: Minimum 6 characters
- accessRights.read: Boolean (required)
- accessRights.write: Boolean (required)

### 3. Update Admin
**PUT** `/api/admin/admins/:adminId`

**Authentication:** Required (Admin with write access)

**Request Body:**
```json
{
  "username": "updatedadmin",
  "email": "updated@example.com",
  "password": "newpassword123",
  "accessRights": {
    "read": true,
    "write": true
  }
}
```

**Note:** All fields are optional. Password will be hashed automatically.

---

## Product Management Endpoints (Admin Only)

### 4. Get All Products
**GET** `/api/admin/products`

**Authentication:** Required (Admin with read access)

View all products including inactive ones.

**Response:**
```json
[
  {
    "_id": "64f5a8b9c1234567890abcde",
    "name": "Kaju Katli",
    "description": "Premium cashew sweet",
    "price": 450,
    "category": "sweets",
    "stock": 100,
    "isActive": true,
    ...
  }
]
```

### 5. Get Products by Category
**GET** `/api/admin/products/category/:category`

**Authentication:** Required (Admin with read access)

**Parameters:**
- category: sweets | namkeen | dry-fruits | gift-boxes | seasonal | other

### 6. Add Product
**POST** `/api/admin/products`

**Authentication:** Required (Admin with write access)

**Request Body:**
```json
{
  "name": "Kaju Katli",
  "description": "Premium cashew sweet made with finest ingredients",
  "category": "sweets",
  "price": 450,
  "stock": 100,
  "images": ["https://example.com/image1.jpg"],
  "weight": "250g",
  "ingredients": ["Cashew", "Sugar", "Ghee"],
  "tags": ["premium", "festive"],
  "isFeatured": true
}
```

**Validation:**
- name: 2-200 characters (required)
- description: Minimum 10 characters (required)
- category: One of allowed values (required)
- price: Positive number (required)
- stock: Non-negative integer (required)
- images: Array of valid URLs (optional)
- originalPrice: Positive number (optional)
- discount: 0-100 (optional)

### 7. Update Product
**PUT** `/api/admin/products/:id`

**Authentication:** Required (Admin with write access)

**Parameters:**
- id: Valid MongoDB ObjectId

**Request Body:** Same as Add Product (all fields optional)

### 8. Delete Product
**DELETE** `/api/admin/products/:id`

**Authentication:** Required (Admin with write access)

**Parameters:**
- id: Valid MongoDB ObjectId

**Note:** This performs a soft delete (sets isActive to false)

**Response:**
```json
{
  "message": "Product deleted successfully"
}
```

### 9. Bulk Upload Products
**POST** `/api/admin/products/bulk-upload`

**Authentication:** Required (Admin with write access)

Upload an Excel file to add multiple products at once.

**Request:**
- Content-Type: multipart/form-data
- Field name: `file`
- File type: .xlsx or .xls
- Max file size: 5MB

**Response:**
```json
{
  "message": "Bulk import completed",
  "summary": {
    "total": 10,
    "successful": 9,
    "failed": 1
  },
  "results": {
    "success": [
      {
        "row": 2,
        "product": "64f5a8b9c1234567890abcde",
        "name": "Kaju Katli"
      }
    ],
    "failed": [
      {
        "row": 5,
        "error": "Product validation failed: price: Price is required",
        "data": { "name": "Test", "description": "Test" }
      }
    ]
  }
}
```

**Validation:**
- File must be Excel format (.xlsx or .xls)
- File size must be less than 5MB
- Refer to BULK_UPLOAD_GUIDE.md for Excel format details

### 10. Upload Image to Cloudinary
**POST** `/api/admin/image/upload`

**Authentication:** Required (Admin with write access)

Upload a single image file and get a Cloudinary URL for product `images`.

**Request:**
- Content-Type: multipart/form-data
- Header: `Authorization: Bearer <your-jwt-token>`
- Field name: `image` (required)
- Optional field: `folder` (Cloudinary folder path)

**Validation:**
- File must be an image (`image/*`)
- File size must be less than or equal to 10MB
- If file size is greater than 10MB, API returns:
  - `image upload failure: file size is greater than 10 mb`
- Cloudinary env keys must be configured:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

**Response:**
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

### 11. Cancel Image Upload (Delete from Cloudinary)
**POST** `/api/admin/image/cancel`

**Authentication:** Required (Admin with write access)

Delete a previously uploaded Cloudinary image when user cancels from frontend.

**Request Body:**
```json
{
  "imageUrl": "https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/dayaram-sweets/products/sample.jpg",
  "cancel": true
}
```

**Validation:**
- `imageUrl` is required and must be a valid Cloudinary URL
- Cancel flag is required and must be true
- Accepted cancel flags: `cancel`, `cancelled`, or `isCancelled`

**Response:**
```json
{
  "message": "Cancelled image removed from Cloudinary",
  "data": {
    "publicId": "dayaram-sweets/products/sample",
    "result": "ok"
  }
}
```

---

## Public Product Routes (No Authentication)

These routes are available at `/api/products` and don't require authentication:

- **GET** `/api/products` - Get all active products
- **GET** `/api/products/search` - Search products with filters
- **GET** `/api/products/best-sellers` - Get best-selling products
- **GET** `/api/products/category/:category` - Get products by category
- **GET** `/api/products/:id` - Get single product by ID

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
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 500 Server Error
```json
{
  "message": "Server error",
  "error": "Error details"
}
```

---

## Usage Examples

### Example 1: Admin Login and Add Product

```bash
# Step 1: Login
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Response includes token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Step 2: Use token to add product
curl -X POST http://localhost:5000/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Kaju Katli",
    "description": "Premium cashew sweet",
    "category": "sweets",
    "price": 450,
    "stock": 100
  }'
```

### Example 2: Bulk Upload with Authentication

```bash
curl -X POST http://localhost:5000/api/admin/products/bulk-upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@products.xlsx"
```

### Example 3: Upload Image to Cloudinary

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

---

## Admin Product Management Features

Based on your requirements, here's the feature mapping:

### Products Menu Structure
```
Products (Admin Only - /api/admin/products)
 ├── All Products       → GET /api/admin/products
 ├── Add Product        → POST /api/admin/products
 ├── Categories         → GET /api/admin/products/category/:category
 ├── Inventory          → GET /api/admin/products (filter by stock)
 └── Bulk Upload        → POST /api/admin/products/bulk-upload
```

All routes require:
- Valid JWT token in Authorization header
- Appropriate access rights (read or write)

---

## Security Notes

1. **Passwords**: Automatically hashed using bcrypt before storage
2. **Token Expiration**: JWT tokens expire after 24 hours
3. **Access Control**: Two-level permission system (read/write)
4. **File Upload**: Limited to 5MB Excel files only
5. **Validation**: All inputs are validated using Zod schemas

---

## Environment Variables Required

```env
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
MONGODB_URI=your-mongodb-connection-string
```

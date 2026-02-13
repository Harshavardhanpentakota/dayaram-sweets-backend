# Bulk Product Upload Guide

## Overview
The bulk product upload feature allows you to add multiple products at once using an Excel file (.xlsx or .xls).

## API Endpoint
```
POST /api/products/bulk-upload
Content-Type: multipart/form-data
```

## Request
- **Method**: POST
- **Field name**: `file`
- **File type**: Excel (.xlsx or .xls)
- **Max file size**: 5MB

## Excel File Format

### Required Columns
The first row (row 0) should contain column headers. The following columns are required:

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| name | String | Product name | "Kaju Katli" |
| description | String | Product description | "Premium cashew sweet" |
| price | Number | Price in rupees | 450 |

### Optional Columns

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| category | String | Must be one of: sweets, namkeen, dry-fruits, gift-boxes, seasonal, other | "sweets" |
| stock | Number | Available quantity | 100 |
| weight | String | Weight with unit | "250g" |
| originalPrice | Number | Original price before discount | 500 |
| discount | Number | Discount percentage (0-100) | 10 |
| images | String | Comma-separated image URLs | "url1.jpg, url2.jpg" |
| tags | String | Comma-separated tags | "premium, festive, popular" |
| ingredients | String | Comma-separated ingredients | "cashew, sugar, ghee" |
| isActive | Boolean | Product visibility | TRUE |
| isBestSeller | Boolean | Mark as bestseller | FALSE |
| isFeatured | Boolean | Mark as featured | FALSE |

### Column Name Variations
The system accepts both lowercase and capitalized column names:
- `name` or `Name`
- `price` or `Price`
- `description` or `Description`
- etc.

### Default Values
If not specified in Excel:
- `category`: "sweets"
- `stock`: 0
- `isActive`: true
- `isBestSeller`: false
- `isFeatured`: false
- `discount`: 0

## Sample Excel Structure

| name | description | price | category | stock | weight | images | tags | isActive | isBestSeller |
|------|-------------|-------|----------|-------|--------|--------|------|----------|--------------|
| Kaju Katli | Premium cashew sweet | 450 | sweets | 100 | 250g | https://example.com/img1.jpg | premium,festive | TRUE | TRUE |
| Soan Papdi | Light and flaky sweet | 180 | sweets | 150 | 200g | https://example.com/img2.jpg | traditional | TRUE | FALSE |
| Namkeen Mix | Spicy snack mix | 120 | namkeen | 200 | 500g | https://example.com/img3.jpg | spicy,snack | TRUE | FALSE |

## Response Format

### Success Response
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

## Usage Example with cURL
```bash
curl -X POST http://localhost:5000/api/products/bulk-upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@products.xlsx"
```

## Usage Example with Postman
1. Set method to POST
2. Enter URL: `http://localhost:5000/api/products/bulk-upload`
3. Go to "Body" tab
4. Select "form-data"
5. Add key: `file` (change type to "File")
6. Choose your Excel file
7. Click "Send"

## Tips
- The first row (headers) is automatically skipped
- Empty rows are ignored
- Validation errors for individual rows won't stop the entire import
- Check the response to see which rows succeeded and which failed
- For array fields (images, tags, ingredients), separate multiple values with commas
- Boolean fields accept: TRUE/FALSE, true/false, 1/0

## Error Handling
- If a row fails validation, it will be listed in the `failed` array
- Other rows will continue to be processed
- Common errors:
  - Missing required fields (name, description, price)
  - Invalid category value
  - Invalid price (negative or non-numeric)
  - Invalid discount (>100 or <0)

import { Request, Response } from 'express';
import Product from '../../db/models/Product';
import * as XLSX from 'xlsx';

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ isActive: true });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findOne({ productId: req.params.productId });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ category: req.params.category, isActive: true });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getBestSellingProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const products = await Product.find({ isBestSeller: true, isActive: true })
      .sort({ 'ratings.count': -1, 'ratings.average': -1 })
      .limit(limit);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Search products with query parameters
export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      search, 
      category, 
      minPrice, 
      maxPrice, 
      isBestSeller, 
      isNewArrival,
      sort = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '10'
    } = req.query;

    // Build the filter object
    const filter: any = { isActive: true };

    // Text search in name and description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Filter by best seller
    if (isBestSeller === 'true') {
      filter.isBestSeller = true;
    }

    // Filter by new arrival
    if (isNewArrival === 'true') {
      filter.isNewArrival = true;
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: any = {};
    sortObj[sort as string] = sortOrder;

    // Execute query
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Bulk add products from Excel file
export const bulkAddProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // Read the Excel file from buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON, skipping the first row (headers)
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      res.status(400).json({ message: 'Excel file is empty or has no data rows' });
      return;
    }

    // Create products from Excel data
    const results = {
      success: [] as any[],
      failed: [] as any[]
    };

    for (let i = 0; i < data.length; i++) {
      try {
        const row: any = data[i];
        
        // Map Excel columns to product fields
        // Adjust these field names based on your Excel column headers
        const productData: any = {
          name: row.name || row.Name,
          description: row.description || row.Description,
          price: Number(row.price || row.Price),
          category: row.category || row.Category || 'sweets',
          stock: row.stock !== undefined ? Number(row.stock) : (row.Stock !== undefined ? Number(row.Stock) : 0),
          weight: row.weight || row.Weight,
          isActive: row.isActive !== undefined ? row.isActive : (row.IsActive !== undefined ? row.IsActive : true),
          isBestSeller: row.isBestSeller || row.IsBestSeller || false,
          isFeatured: row.isFeatured || row.IsFeatured || false
        };

        // Handle optional numeric fields
        if (row.originalPrice || row.OriginalPrice) {
          productData.originalPrice = Number(row.originalPrice || row.OriginalPrice);
        }
        if (row.discount || row.Discount) {
          productData.discount = Number(row.discount || row.Discount);
        }

        // Handle array fields (comma-separated in Excel)
        if (row.images || row.Images) {
          const imageString = row.images || row.Images;
          productData.images = typeof imageString === 'string' 
            ? imageString.split(',').map((img: string) => img.trim()).filter((img: string) => img)
            : [];
        }

        if (row.tags || row.Tags) {
          const tagString = row.tags || row.Tags;
          productData.tags = typeof tagString === 'string' 
            ? tagString.split(',').map((tag: string) => tag.trim().toLowerCase()).filter((tag: string) => tag)
            : [];
        }

        if (row.ingredients || row.Ingredients) {
          const ingredientString = row.ingredients || row.Ingredients;
          productData.ingredients = typeof ingredientString === 'string' 
            ? ingredientString.split(',').map((ing: string) => ing.trim()).filter((ing: string) => ing)
            : [];
        }

        // Remove undefined/null fields
        Object.keys(productData).forEach(key => {
          if (productData[key] === undefined || productData[key] === null) {
            delete productData[key];
          }
        });

        const product = await Product.create(productData);
        results.success.push({ row: i + 2, product: product._id, name: product.name });
      } catch (error: any) {
        results.failed.push({ 
          row: i + 2, 
          error: error.message || 'Failed to create product',
          data: data[i]
        });
      }
    }

    res.status(200).json({
      message: 'Bulk import completed',
      summary: {
        total: data.length,
        successful: results.success.length,
        failed: results.failed.length
      },
      results
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Server error during bulk import', 
      error: error.message || error 
    });
  }
};

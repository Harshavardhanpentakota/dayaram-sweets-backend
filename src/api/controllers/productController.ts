import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../../db/models/Product';
import * as XLSX from 'xlsx';

const CATEGORY_MAP: Record<string, string> = {
  'andhra': 'Andhra Sweets',
  'andhra sweets': 'Andhra Sweets',
  'cashew': 'Cashew Sweets',
  'kaju': 'Cashew Sweets',
  'cashew sweets': 'Cashew Sweets',
  'bengali': 'Bengali Sweets',
  'bengali sweets': 'Bengali Sweets',
  'khoya': 'Khoya Sweets',
  'khoya sweets': 'Khoya Sweets',
  'laddu': 'Laddu Sweets',
  'laddu sweets': 'Laddu Sweets',
  'milk': 'Milk Sweets',
  'milk sweets': 'Milk Sweets',
  'home': 'Home Foods',
  'home foods': 'Home Foods',
  'other': 'Category Unspecified',
  'category unspecified': 'Category Unspecified',
  'sweets': 'Category Unspecified',
  'namkeen': 'Category Unspecified',
  'dry-fruits': 'Category Unspecified',
  'gift-boxes': 'Category Unspecified',
  'seasonal': 'Category Unspecified',
};

const toCanonicalCategory = (rawValue: unknown): string => {
  if (typeof rawValue !== 'string') return 'Category Unspecified';
  const normalized = rawValue.trim().toLowerCase();
  return CATEGORY_MAP[normalized] || 'Category Unspecified';
};

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

export const getSpecialCollections = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({
      isActive: true,
      collection: { $nin: ['', 'best-seller'] },
    }).lean();

    const formattedProducts = products.map((product: any) => ({
      ...product,
      collection: product?.collection || '',
    }));

    res.status(200).json(formattedProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getSpecialCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const collections = await Product.aggregate([
      {
        $match: {
          isActive: true,
          collection: { $ne: '' },
        },
      },
      { $sort: { updatedAt: -1, createdAt: -1 } },
      {
        $group: {
          _id: '$collection',
          products: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          _id: 0,
          collection_name: '$_id',
          products: 1,
        },
      },
      { $sort: { collection_name: 1 } },
    ]);

    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findOneAndUpdate(
      { productId: req.params.productId },
      req.body,
      { new: true }
    );
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const modifyCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = Array.isArray(req.body) ? { products: req.body } : req.body;
    const products = Array.isArray(payload?.products) ? payload.products : [];
    const collectionName = typeof payload?.collectionName === 'string' ? payload.collectionName.trim() : '';
    const isCollectionNameModified = payload?.isCollectionNameModified === true;

    const productIds = products
      .map((item: any) => {
        if (typeof item === 'string') {
          return item.trim();
        }

        if (item && typeof item.productId === 'string') {
          return item.productId.trim();
        }

        return '';
      })
      .filter((productId: string) => productId.length > 0);

    const objectIds = products
      .map((item: any) => {
        if (item && typeof item._id === 'string' && mongoose.Types.ObjectId.isValid(item._id)) {
          return new mongoose.Types.ObjectId(item._id);
        }

        return null;
      })
      .filter((value: mongoose.Types.ObjectId | null): value is mongoose.Types.ObjectId => value !== null);

    const uniqueProductIds = Array.from(new Set(productIds));
    const uniqueObjectIds = Array.from(
      new Map<string, mongoose.Types.ObjectId>(
        objectIds.map((value: mongoose.Types.ObjectId) => [value.toHexString(), value])
      ).values()
    );

    const targetFilters: Array<Record<string, unknown>> = [];

    if (uniqueProductIds.length > 0) {
      targetFilters.push({ productId: { $in: uniqueProductIds } });
    }

    if (uniqueObjectIds.length > 0) {
      targetFilters.push({ _id: { $in: uniqueObjectIds } });
    }

    const matchedProducts = targetFilters.length > 0
      ? await Product.find(
          targetFilters.length === 1 ? targetFilters[0] : { $or: targetFilters },
          { _id: 1, productId: 1, collection: 1, isBestSeller: 1 }
        ).lean()
      : [];

    const matchedProductIds = new Set(
      matchedProducts
        .map((product: any) => (typeof product.productId === 'string' ? product.productId : ''))
        .filter((productId: string) => productId.length > 0)
    );

    const matchedObjectIds = new Set(
      matchedProducts.map((product: any) => String(product._id))
    );

    const notFoundProductIds = uniqueProductIds.filter((productId) => !matchedProductIds.has(productId));
    const notFoundObjectIds = uniqueObjectIds
      .map((objectId) => objectId.toHexString())
      .filter((objectId) => !matchedObjectIds.has(objectId));

    let explicitlyUpdatedCount = 0;

    if (matchedProducts.length > 0) {
      const explicitUpdateResult = await Product.updateMany(
        {
          _id: { $in: matchedProducts.map((product: any) => product._id) },
        },
        [
          {
            $set: {
              collection: {
                $cond: [
                  {
                    $eq: [
                      {
                        $trim: {
                          input: {
                            $ifNull: ['$collection', ''],
                          },
                        },
                      },
                      collectionName,
                    ],
                  },
                  '',
                  collectionName,
                ],
              },
            },
          },
        ]
      );
      explicitlyUpdatedCount = explicitUpdateResult.modifiedCount;
    }

    let reassignedCollectionCount = 0;

    if (isCollectionNameModified) {
      const reassignResult = await Product.updateMany(
        {
          isActive: true,
          collection: { $nin: ['', collectionName] },
        },
        {
          $set: { collection: collectionName },
        }
      );

      reassignedCollectionCount = reassignResult.modifiedCount;
    }

    res.status(200).json({
      message: 'Collection updated successfully',
      collectionName,
      explicitlyUpdatedCount,
      reassignedCollectionCount,
      isCollectionNameModified,
      matchedProducts: matchedProducts.map((product: any) => ({
        _id: product._id,
        productId: product.productId,
        previousCollection: product.collection || '',
        isBestSeller: product.isBestSeller,
      })),
      notFoundProductIds,
      notFoundObjectIds,
    });
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
          category: toCanonicalCategory(row.category || row.Category),
          stock: row.stock !== undefined ? Number(row.stock) : (row.Stock !== undefined ? Number(row.Stock) : 0),
          weight: row.weight || row.Weight,
          isActive: row.isActive !== undefined ? row.isActive : (row.IsActive !== undefined ? row.IsActive : true),
          isBestSeller: row.isBestSeller || row.IsBestSeller || row.isFeatured || row.IsFeatured || false
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

// Bulk add products from JSON input array
export const addBulkProductsByInput = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = Array.isArray(req.body) ? req.body : req.body?.products;

    if (!Array.isArray(products) || products.length === 0) {
      res.status(400).json({ message: 'Products array is required and cannot be empty' });
      return;
    }

    const normalizedProducts = products.map((product: any) => {
      return {
        ...product,
        category: toCanonicalCategory(product?.category),
      };
    });

    const success: any[] = [];
    const failed: any[] = [];
    const usedProductIds = new Set<string>();
    const adjustedProductIds: Array<{ index: number; from: string; to: string }> = [];

    const buildUniqueProductId = async (baseProductId: string): Promise<string> => {
      let candidate = baseProductId;
      let suffix = 0;

      while (usedProductIds.has(candidate) || await Product.exists({ productId: candidate })) {
        suffix += 1;
        candidate = `${baseProductId}-${suffix}`;
      }

      return candidate;
    };

    for (let index = 0; index < normalizedProducts.length; index++) {
      try {
        const productData = { ...normalizedProducts[index] } as any;

        if (typeof productData.productId === 'string' && productData.productId.trim()) {
          const originalProductId = productData.productId.trim();
          const uniqueProductId = await buildUniqueProductId(originalProductId);

          if (uniqueProductId !== originalProductId) {
            adjustedProductIds.push({ index, from: originalProductId, to: uniqueProductId });
          }

          productData.productId = uniqueProductId;
          usedProductIds.add(uniqueProductId);
        }

        const product = await Product.create(productData);
        success.push({
          index,
          id: product._id,
          name: product.name,
          productId: product.productId,
        });
      } catch (error: any) {
        failed.push({
          index,
          error: error.message || 'Failed to create product',
          product: normalizedProducts[index],
        });
      }
    }

    const statusCode = failed.length > 0 ? 207 : 201;

    res.status(statusCode).json({
      message: 'Bulk product insertion completed',
      summary: {
        total: products.length,
        successful: success.length,
        adjustedProductIds: adjustedProductIds.length,
        failed: failed.length,
      },
      success,
      adjustedProductIds,
      failed,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Bulk mark existing products as best sellers
export const bulkAllBestSellers = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = Array.isArray(req.body) ? req.body : req.body?.products;

    if (!Array.isArray(payload) || payload.length === 0) {
      res.status(400).json({ message: 'Products array is required and cannot be empty' });
      return;
    }

    const rawProductIds = payload
      .map((item: any) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item.productId === 'string') return item.productId.trim();
        return '';
      })
      .filter((productId: string) => productId.length > 0);

    const uniqueProductIds = Array.from(new Set(rawProductIds));

    if (uniqueProductIds.length === 0) {
      res.status(400).json({ message: 'No valid productId values found in request' });
      return;
    }

    const existingProducts = await Product.find(
      { productId: { $in: uniqueProductIds } },
      { productId: 1, isBestSeller: 1 }
    ).lean();

    const existingProductIds = new Set(existingProducts.map((p: any) => p.productId));
    const alreadyBestSeller = existingProducts
      .filter((p: any) => p.isBestSeller)
      .map((p: any) => p.productId);

    const notFound = uniqueProductIds.filter((productId) => !existingProductIds.has(productId));

    const updateResult = await Product.updateMany(
      { productId: { $in: uniqueProductIds }, isBestSeller: { $ne: true } },
      { $set: { isBestSeller: true } }
    );

    res.status(200).json({
      message: 'Bulk best-seller update completed',
      summary: {
        totalReceived: payload.length,
        uniqueProductIds: uniqueProductIds.length,
        matched: existingProducts.length,
        updated: updateResult.modifiedCount,
        alreadyBestSeller: alreadyBestSeller.length,
        notFound: notFound.length,
      },
      alreadyBestSeller,
      notFound,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Randomize ratings for all active products
export const randomizeAllProductRatings = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ isActive: true }, { _id: 1, productId: 1, ratings: 1 });

    if (!products.length) {
      res.status(200).json({ message: 'No active products found', updated: 0 });
      return;
    }

    const ratingAverages = [4, 4.5, 5];
    const ratingCounts = [9, 10, 11, 12];
    const updatedProducts: Array<{ productId?: string; average: number; count: number }> = [];

    for (const product of products) {
      const average = ratingAverages[Math.floor(Math.random() * ratingAverages.length)];
      const count = ratingCounts[Math.floor(Math.random() * ratingCounts.length)];

      await Product.updateOne(
        { _id: product._id },
        {
          $set: {
            ratings: {
              average,
              count,
            },
          },
        }
      );

      updatedProducts.push({
        productId: product.productId,
        average,
        count,
      });
    }

    res.status(200).json({
      message: 'Ratings randomized successfully for active products',
      updated: updatedProducts.length,
      products: updatedProducts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

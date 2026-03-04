import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../src/db/config';
import Product from '../src/db/models/Product';

dotenv.config();

const migrateProductCollections = async (): Promise<void> => {
  try {
    await connectDB();

    const products = await Product.find({ isActive: true }).select('_id').lean();

    if (products.length === 0) {
      console.log('No active products found. Nothing to update.');
      return;
    }

    const result = await Product.updateMany(
      { isActive: true },
      [
        {
          $set: {
            collection: {
              $cond: [{ $lt: [{ $rand: {} }, 0.5] }, '', 'winter-specials'],
            },
          },
        },
        { $unset: 'collections' },
      ]
    );

    console.log(`Total active products: ${products.length}`);
    console.log(`Matched: ${result.matchedCount}`);
    console.log(`Modified: ${result.modifiedCount}`);
  } catch (error) {
    console.error('Failed to migrate product collections:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

void migrateProductCollections();

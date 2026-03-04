require('dotenv').config();
const mongoose = require('mongoose');

async function migrateProductCollections() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dayaram-sweets';

  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');

    const productsCollection = mongoose.connection.collection('products');

    const totalActiveProducts = await productsCollection.countDocuments({ isActive: true });

    if (totalActiveProducts === 0) {
      console.log('No active products found. Nothing to update.');
      return;
    }

    const result = await productsCollection.updateMany(
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

    console.log(`Total active products: ${totalActiveProducts}`);
    console.log(`Matched: ${result.matchedCount}`);
    console.log(`Modified: ${result.modifiedCount}`);
  } catch (error) {
    console.error('Failed to migrate product collections:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

migrateProductCollections();

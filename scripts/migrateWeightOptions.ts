/**
 * One-time migration: convert scalar product fields into a `weightOptions` array.
 *
 * Before:  { price, originalPrice, discount, stock, weight }
 * After:   { weightOptions: [{ weight, price, originalPrice?, stock }] }
 *
 * The scalar fields (price, originalPrice, discount, stock, weight) are removed
 * in the same pass. The script operates on the raw collection so the new Mongoose
 * schema (which no longer defines the scalar fields) doesn't strip them before we
 * can read them.
 *
 * Idempotent: only documents that still have a scalar `price` and no non-empty
 * `weightOptions` are migrated, so re-running is safe.
 *
 * Run with: npm run migrate:weight-options
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function migrateWeightOptions() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI not set in .env');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const collection = mongoose.connection.collection('products');

  // Candidates: still have a scalar price and no populated weightOptions array.
  const cursor = collection.find({
    price: { $exists: true },
    $or: [
      { weightOptions: { $exists: false } },
      { weightOptions: { $size: 0 } },
    ],
  });

  let migrated = 0;
  let skipped = 0;
  let total = 0;

  while (await cursor.hasNext()) {
    const doc: any = await cursor.next();
    total++;

    if (doc.price === undefined || doc.price === null) {
      skipped++;
      continue;
    }

    const option: any = {
      weight: doc.weight || 'Default',
      price: doc.price,
      stock: doc.stock ?? 0,
    };
    if (doc.originalPrice !== undefined && doc.originalPrice !== null) {
      option.originalPrice = doc.originalPrice;
    }

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: { weightOptions: [option] },
        $unset: {
          price: '',
          originalPrice: '',
          discount: '',
          stock: '',
          weight: '',
        },
      }
    );
    migrated++;
  }

  console.log(`\nDone! Migrated: ${migrated}, Skipped: ${skipped}, Scanned: ${total}`);
  await mongoose.disconnect();
}

migrateWeightOptions().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});

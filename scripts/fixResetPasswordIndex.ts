import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dropOldIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dayaram-sweets');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db?.collection('resetpasswords');

    if (collection) {
      // Drop the old token index
      try {
        await collection.dropIndex('token_1');
        console.log('Successfully dropped token_1 index');
      } catch (error: any) {
        if (error.code === 27) {
          console.log('Index token_1 does not exist, skipping...');
        } else {
          throw error;
        }
      }

      // Drop all documents in the collection to start fresh
      await collection.deleteMany({});
      console.log('Cleared all existing reset password entries');
    }

    await mongoose.disconnect();
    console.log('Done! You can now restart your server.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

dropOldIndex();

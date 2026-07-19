import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Product from '../db/models/Product';

const giftBoxProducts = [
  {
    name: 'Diwali Premium Gift Box',
    description: 'A luxurious Diwali gift box containing an assortment of premium sweets including Kaju Katli, Motichoor Laddu, Besan Barfi, Gulab Jamun, and Mysore Pak. Beautifully packaged for gifting.',
    category: 'Gift Boxes',
    collection: 'Diwali Special',
    weightOptions: [{ weight: '1 kg', price: 799, originalPrice: 999, stock: 50 }],
    images: [],
    tags: ['diwali', 'gift', 'premium', 'festival'],
    isActive: true,
    isBestSeller: true,
    ratings: { average: 4.8, count: 120 },
  },
  {
    name: 'Diwali Family Pack',
    description: 'The perfect Diwali treat for the whole family. This large assorted box includes 8 varieties of traditional Indian sweets – enough to share and celebrate together.',
    category: 'Gift Boxes',
    collection: 'Diwali Special',
    weightOptions: [{ weight: '2 kg', price: 1299, originalPrice: 1599, stock: 30 }],
    images: [],
    tags: ['diwali', 'family', 'assorted', 'festival'],
    isActive: true,
    isBestSeller: false,
    ratings: { average: 4.7, count: 85 },
  },
  {
    name: 'Kaju Katli Gift Box',
    description: 'Premium quality pure cashew Kaju Katli packed in an elegant gift box. Made with the finest cashews and pure ghee, perfect for gifting on any occasion.',
    category: 'Gift Boxes',
    collection: 'Cashew Special',
    weightOptions: [{ weight: '500 g', price: 599, originalPrice: 699, stock: 60 }],
    images: [],
    tags: ['kaju katli', 'cashew', 'gift', 'premium'],
    isActive: true,
    isBestSeller: true,
    ratings: { average: 4.9, count: 200 },
  },
  {
    name: 'Traditional Peda Gift Box',
    description: 'Handcrafted traditional milk Peda made from pure cow milk, sugar, and cardamom. Packaged in a decorative box, ideal for festivals and celebrations.',
    category: 'Gift Boxes',
    collection: 'Milk Sweets Special',
    weightOptions: [{ weight: '500 g', price: 449, originalPrice: 549, stock: 45 }],
    images: [],
    tags: ['peda', 'milk sweets', 'traditional', 'gift'],
    isActive: true,
    isBestSeller: false,
    ratings: { average: 4.6, count: 75 },
  },
  {
    name: 'Corporate Gift Hamper',
    description: 'Elegant corporate gifting hamper with 5 varieties of premium sweets — ideal for clients, partners, and employee appreciation. Comes in a branded premium box.',
    category: 'Gift Boxes',
    collection: 'Corporate Gifting',
    weightOptions: [{ weight: '1.2 kg', price: 999, originalPrice: 1199, stock: 25 }],
    images: [],
    tags: ['corporate', 'hamper', 'premium', 'gifting'],
    isActive: true,
    isBestSeller: false,
    ratings: { average: 4.7, count: 55 },
  },
  {
    name: 'Dry Fruit Sweets Box',
    description: 'A delightful collection of sweets enriched with premium dry fruits — almonds, cashews, pistachios, and raisins. A healthy and indulgent gift for any occasion.',
    category: 'Gift Boxes',
    collection: 'Dry Fruit Specials',
    weightOptions: [{ weight: '750 g', price: 899, originalPrice: 1099, stock: 35 }],
    images: [],
    tags: ['dry fruit', 'nuts', 'premium', 'healthy'],
    isActive: true,
    isBestSeller: true,
    ratings: { average: 4.8, count: 95 },
  },
  {
    name: 'Birthday Celebration Box',
    description: 'Make birthdays sweeter with this special assorted sweet box. Includes colourful barfis, laddoos, and gulab jamuns in a festive birthday-themed packaging.',
    category: 'Gift Boxes',
    collection: 'Celebration',
    weightOptions: [{ weight: '800 g', price: 649, originalPrice: 799, stock: 40 }],
    images: [],
    tags: ['birthday', 'celebration', 'assorted', 'gift'],
    isActive: true,
    isBestSeller: false,
    ratings: { average: 4.5, count: 60 },
  },
  {
    name: 'Wedding Return Gift Box',
    description: 'Beautiful mini sweet boxes perfect for wedding return gifts. Each box contains an assortment of 4 premium sweets, elegantly wrapped for the special occasion.',
    category: 'Gift Boxes',
    collection: 'Wedding Special',
    weightOptions: [{ weight: '250 g', price: 199, originalPrice: 249, stock: 200 }],
    images: [],
    tags: ['wedding', 'return gift', 'mini', 'occasion'],
    isActive: true,
    isBestSeller: false,
    ratings: { average: 4.6, count: 140 },
  },
  {
    name: 'Festive Jumbo Box',
    description: 'The ultimate festival gift! Our largest assorted box features 12 varieties of Dayaram\'s finest sweets — enough for the entire family to celebrate. Great for Diwali, Holi, or Eid.',
    category: 'Gift Boxes',
    collection: 'Diwali Special',
    weightOptions: [{ weight: '3 kg', price: 1999, originalPrice: 2499, stock: 20 }],
    images: [],
    tags: ['jumbo', 'festival', 'assorted', 'large', 'diwali'],
    isActive: true,
    isBestSeller: true,
    ratings: { average: 4.9, count: 45 },
  },
  {
    name: 'Sugar-Free Sweet Gift Box',
    description: 'Specially crafted for health-conscious sweet lovers. Our sugar-free gift box contains ladoos, barfi, and pedas made with natural sweeteners — perfect for diabetic-friendly gifting.',
    category: 'Gift Boxes',
    collection: 'Health Special',
    weightOptions: [{ weight: '600 g', price: 749, originalPrice: 899, stock: 30 }],
    images: [],
    tags: ['sugar-free', 'diabetic', 'healthy', 'gift'],
    isActive: true,
    isBestSeller: false,
    ratings: { average: 4.7, count: 70 },
  },
  {
    name: 'Holi Special Colour Box',
    description: 'Celebrate the festival of colours with our vibrant Holi special gift box! Includes colourful thandai-flavoured sweets, gujiyas, and traditional mathri. Perfectly packaged with a festive touch.',
    category: 'Gift Boxes',
    collection: 'Holi Special',
    weightOptions: [{ weight: '700 g', price: 549, originalPrice: 649, stock: 40 }],
    images: [],
    tags: ['holi', 'festival', 'colours', 'special'],
    isActive: true,
    isBestSeller: false,
    ratings: { average: 4.5, count: 50 },
  },
];

async function seedGiftBoxProducts() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not set in .env');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const productData of giftBoxProducts) {
      const existing = await Product.findOne({ name: productData.name });
      if (existing) {
        console.log(`Skipped (already exists): ${productData.name}`);
        skipped++;
      } else {
        await Product.create(productData);
        console.log(`Created: ${productData.name}`);
        created++;
      }
    }

    console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedGiftBoxProducts();

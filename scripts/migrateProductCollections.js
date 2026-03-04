"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../src/db/config");
const Product_1 = __importDefault(require("../src/db/models/Product"));
dotenv_1.default.config();
const migrateProductCollections = async () => {
    try {
        await (0, config_1.connectDB)();
        const products = await Product_1.default.find({ isActive: true }).select('_id').lean();
        if (products.length === 0) {
            console.log('No active products found. Nothing to update.');
            return;
        }
        const result = await Product_1.default.updateMany({ isActive: true }, [
            {
                $set: {
                    collection: {
                        $cond: [{ $lt: [{ $rand: {} }, 0.5] }, '', 'winter-specials'],
                    },
                },
            },
            { $unset: 'collections' },
        ]);
        console.log(`Total active products: ${products.length}`);
        console.log(`Matched: ${result.matchedCount}`);
        console.log(`Modified: ${result.modifiedCount}`);
    }
    catch (error) {
        console.error('Failed to migrate product collections:', error);
        process.exitCode = 1;
    }
    finally {
        await mongoose_1.default.connection.close();
    }
};
void migrateProductCollections();

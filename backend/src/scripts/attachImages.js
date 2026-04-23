import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import Product from '../models/Product.js';

const mapping = {
  'Stainless Steel Mixing Bowl Set': 'mixing-bowl-set-steel.png',
  'Glass Mixing Bowl with Lid': 'mixing-bowl-glass.png',
  'Ceramic Decorative Mixing Bowl': 'mixing-bowl-ceramic.png',
  'Non-Stick Round Cake Pan 8 inch': 'cake-pan-8inch.png',
  'Rectangular Sheet Pan Commercial Grade': 'sheet-pan-comm.png',
  'Springform Cheesecake Pan 9 inch': 'springform-pan-9inch.png',
};

const baseUrl = 'http://localhost:5001/uploads/products';

const attachImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const products = await Product.find({ name: { $in: Object.keys(mapping) } });
    for (const product of products) {
      const fileName = mapping[product.name];
      product.imageUrl = `${baseUrl}/${fileName}`;
      await product.save();
      console.log(`Updated ${product.name} -> ${product.imageUrl}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

attachImages();

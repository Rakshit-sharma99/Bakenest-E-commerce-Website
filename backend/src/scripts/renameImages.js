import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads/products');

const renames = [
  { old: 'Stainless Steel Mixing Bowl Set.png', new: 'mixing-bowl-set-steel.png' },
  { old: 'Glass Mixing Bowl with Lid.png', new: 'mixing-bowl-glass.png' },
  { old: 'Ceramic Decorative Mixing Bowl (2).png', new: 'mixing-bowl-ceramic.png' },
  { old: 'Non-Stick Round Cake Pan 8 inch.png', new: 'cake-pan-8inch.png' },
  { old: 'Rectangular Sheet Pan Commercial Grade.png', new: 'sheet-pan-comm.png' },
  { old: 'Springform Cheesecake Pan 9 inch.png', new: 'springform-pan-9inch.png' },
];

renames.forEach(r => {
  const oldPath = path.join(uploadDir, r.old);
  const newPath = path.join(uploadDir, r.new);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed ${r.old} to ${r.new}`);
  } else {
    console.log(`File not found: ${r.old}`);
  }
});

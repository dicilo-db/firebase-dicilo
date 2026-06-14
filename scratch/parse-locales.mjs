import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../public/locales/es/common.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function findPaths(obj, parent = '') {
  for (const key in obj) {
    const currentPath = parent ? `${parent}.${key}` : key;
    if (key === 'dicicoin') {
      console.log(`Found path: ${currentPath}`);
      console.log(JSON.stringify(obj[key], null, 2));
    } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      findPaths(obj[key], currentPath);
    }
  }
}

findPaths(data);
process.exit(0);

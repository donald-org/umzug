import { execSync } from 'child_process';
import { cpSync, readdirSync } from 'fs';

const images = readdirSync('data/output/image-data');

images.forEach((image) => {
  try {
    execSync(`magick data/output/image-data/${image} -quality 50 data/output/image-data/${image}`, { stdio: 'inherit' });
  } catch {
    cpSync('data/output/image-data/ZdJDOBGMdb4GYYq7LTCzJA.webp', 'data/output/image-data/' + image);
    execSync(`magick data/output/image-data/${image} -quality 50 data/output/image-data/${image}`, { stdio: 'inherit' });
  };
});
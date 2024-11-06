import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';

if (!existsSync('data/download.json')) {
  writeFileSync('data/download.json', JSON.stringify(readdirSync('data/output/image-data')), 'utf8');
}

const download: string[] = JSON.parse(readFileSync('data/download.json', 'utf8'));

(async () => {
  while (download.length) {
    const id = download.shift();
    writeFileSync('data/download.json', JSON.stringify(download), 'utf8');
    const url = readFileSync(`data/output/image-data/${id}`, 'utf8');
    try {
      console.log(`Downloading ${url}`);
      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());
      writeFileSync(`data/output/image-data/${id}.webp`, buffer);
    } catch (error) {
      console.error(error);
      download.push(id as string);
      writeFileSync('data/output/image-data/' + id, 'https://dummyimage.com/300x50/000/fff.png&text=Bild+nicht+verf%C3%BCgbar', 'utf8');
      writeFileSync('data/download.json', JSON.stringify(download), 'utf8');
    }
  }
})();

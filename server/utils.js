import fs from 'fs';
import path from 'path';
import axios from 'axios';
import archiver from 'archiver';
import { promises as fsPromises } from 'fs';

// Create the storage directory if it doesn't exist
const STORAGE_DIR = path.join(process.cwd(), 'storage');
const IMAGES_DIR = path.join(STORAGE_DIR, 'images');

// Ensure storage directories exist
export const ensureStorageDirectories = async () => {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      await fsPromises.mkdir(STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(IMAGES_DIR)) {
      await fsPromises.mkdir(IMAGES_DIR, { recursive: true });
    }
    console.log('Storage directories created successfully');
  } catch (error) {
    console.error('Error creating storage directories:', error);
    throw error;
  }
};

// Download an image from a URL and save it to local storage
export const downloadImage = async (url, heroId, angle) => {
  try {
    // Create hero-specific directory if it doesn't exist
    const heroDir = path.join(IMAGES_DIR, heroId);
    if (!fs.existsSync(heroDir)) {
      await fsPromises.mkdir(heroDir, { recursive: true });
    }

    // Set the file path
    const fileName = `${angle}.png`;
    const filePath = path.join(heroDir, fileName);

    // If url is 'placeholder', create a placeholder image instead of downloading
    if (url === 'placeholder') {
      // Use a base64 encoded 1x1 transparent PNG
      const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
      fs.writeFileSync(filePath, transparentPixel);
      const localPath = `/storage/images/${heroId}/${fileName}`;
      console.log(`Created placeholder image at ${filePath}`);
      return localPath;
    }

    // Download the image with additional headers to help with CORS
    console.log(`Downloading image from: ${url}`);
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://api.openai.com/'
      },
      maxRedirects: 5,
      timeout: 30000
    });

    // Save the image to the file system
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        // Return the local path relative to the server
        const localPath = `/storage/images/${heroId}/${fileName}`;
        console.log(`Successfully downloaded and saved image to ${filePath}`);
        resolve(localPath);
      });
      writer.on('error', (err) => {
        console.error(`Error writing image file: ${err.message}`);
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Error downloading image: ${error.message}`);
    console.error('For URL:', url);
    
    // Even if we fail to download, create a reference file to avoid future errors
    try {
      // Create a simple 1x1 transparent PNG as placeholder
      const heroDir = path.join(IMAGES_DIR, heroId);
      if (!fs.existsSync(heroDir)) {
        await fsPromises.mkdir(heroDir, { recursive: true });
      }
      
      const fileName = `${angle}.png`;
      const filePath = path.join(heroDir, fileName);
      const localPath = `/storage/images/${heroId}/${fileName}`;
      
      // Use a base64 encoded 1x1 transparent PNG
      const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
      fs.writeFileSync(filePath, transparentPixel);
      
      // Also save a reference text file with the original URL for debugging
      const infoFile = path.join(heroDir, `${angle}_original_url.txt`);
      fs.writeFileSync(infoFile, url || 'Unknown URL');
      
      console.log(`Created placeholder image at ${filePath}`);
      return localPath;
    } catch (placeholderError) {
      console.error(`Error creating placeholder image: ${placeholderError.message}`);
      throw error; // Rethrow the original error
    }
  }
};

// Create a zip file containing hero assets (images and backstory)
export const createHeroZip = async (hero) => {
  try {
    // Create a temporary directory for the zip if it doesn't exist
    const tempDir = path.join(STORAGE_DIR, 'temp');
    if (!fs.existsSync(tempDir)) {
      await fsPromises.mkdir(tempDir, { recursive: true });
    }

    // Set the zip file path
    const zipFileName = `${hero.name.replace(/\s+/g, '_')}_${hero.id}.zip`;
    const zipFilePath = path.join(tempDir, zipFileName);

    // Create a file to write to
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Compression level
    });

    // Listen for all archive data to be written
    const closePromise = new Promise((resolve, reject) => {
      output.on('close', () => resolve(zipFilePath));
      archive.on('error', (err) => reject(err));
    });

    // Pipe archive data to the file
    archive.pipe(output);

    // Add the hero's images to the zip
    const heroImagesDir = path.join(IMAGES_DIR, hero.id);
    if (fs.existsSync(heroImagesDir)) {
      const imageFiles = await fsPromises.readdir(heroImagesDir);
      for (const file of imageFiles) {
        const filePath = path.join(heroImagesDir, file);
        archive.file(filePath, { name: `images/${file}` });
      }
    }

    // Add the hero's backstory as a markdown file
    const backstoryContent = hero.backstory || 'No backstory available.';
    archive.append(backstoryContent, { name: 'backstory.md' });

    // Add a JSON metadata file
    const metadata = {
      name: hero.name,
      id: hero.id,
      westernZodiac: hero.westernZodiac,
      chineseZodiac: hero.chineseZodiac,
      created: hero.created,
    };
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

    // Finalize the archive
    await archive.finalize();

    // Return the path to the zip file
    return {
      filePath: zipFilePath,
      fileName: zipFileName
    };
  } catch (error) {
    console.error(`Error creating hero zip: ${error.message}`);
    throw error;
  }
}; 
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'profile_images',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const articleStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'article_files',
    resource_type: 'auto', // allows both image and video
    allowed_formats: ['jpg', 'jpeg', 'png', 'mp4', 'mov', 'avi', 'webm'],
  },
});

module.exports = { cloudinary, storage, articleStorage };

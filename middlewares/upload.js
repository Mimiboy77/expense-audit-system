const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Tell Multer to store files in Cloudinary instead of local disk
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "expense-audit/receipts", // Folder name inside your Cloudinary account
    allowed_formats: ["jpg", "jpeg", "png", "pdf"], // Accepted file types
    resource_type: "auto" // Handles both images and PDFs automatically
  }
});

// File size limit of 5MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { upload };
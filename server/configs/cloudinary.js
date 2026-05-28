import { v2 as cloudinary } from 'cloudinary';

const connectCloudinary = async () => {
  console.log("Cloudinary ENV check:", {
    cloud_name: process.env.CLOUDINARY_NAME ? "SET" : "MISSING",
    api_key: process.env.CLOUDINARY_API_KEY ? "SET" : "MISSING",
    api_secret: process.env.CLOUDINARY_SECRET_KEY ? "SET" : "MISSING",
  });

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
  });
};

export default connectCloudinary;
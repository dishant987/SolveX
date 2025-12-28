import cloudinary from "./cloudinary.js";

export const uploadToCloudinary = (file: Express.Multer.File) => {
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "app-images" }, (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      })
      .end(file.buffer);
  });
};

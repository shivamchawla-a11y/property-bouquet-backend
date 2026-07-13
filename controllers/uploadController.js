const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const sharp = require("sharp");

exports.uploadImage = async (req, res) => {
  try {

    console.log("========== UPLOAD START ==========");
    console.log("File:", req.file);

    if (req.file) {
      console.log("Original Name:", req.file.originalname);
      console.log("Mime Type:", req.file.mimetype);
      console.log("Size:", req.file.size);
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Optimize image
    const processedBuffer = await sharp(req.file.buffer)
      .rotate()
      .resize({
        width: 2500,
        height: 2500,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 85,
      })
      .toBuffer();

    // Create SEO-friendly filename
    const originalName = req.file.originalname
      .replace(/\.[^/.]+$/, "") // Remove extension
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-") // Replace spaces/special chars with hyphens
      .replace(/^-+|-+$/g, "") // Remove starting/ending hyphens
      .replace(/-+/g, "-"); // Remove duplicate hyphens

    const streamUpload = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "property-bouquet",
            resource_type: "image",

            // SEO Friendly URL
            public_id: originalName,
            use_filename: true,
            unique_filename: false,
            overwrite: true,

            // Accessibility & SEO
            context: `alt=${originalName}|caption=${originalName}`,

            // Better image optimization
            transformation: [
              {
                fetch_format: "auto",
                quality: "auto",
              },
              {
                overlay: "Property_Bouquet_Logo_g4giud",
                width: 60,
                opacity: 45,
                gravity: "south_east",
                x: 12,
                y: 12,
              },
            ],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        streamifier.createReadStream(processedBuffer).pipe(stream);
      });
    };

    const result = await streamUpload();

    res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      alt: originalName,
    });

  } catch (err) {
    console.error("========== UPLOAD ERROR ==========");
console.error(err);
console.error("Message:", err.message);
console.error("Stack:", err.stack);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
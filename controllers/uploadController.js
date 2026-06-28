const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const sharp = require("sharp");

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Resize & compress image BEFORE uploading to Cloudinary
    const processedBuffer = await sharp(req.file.buffer)
      .rotate() // Fix image orientation from mobile devices
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

    const streamUpload = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "property-bouquet",
            resource_type: "image",

            transformation: [
              {
                quality: "auto:eco",
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
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const streamUpload = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "property-bouquet",

            transformation: [
            {
              fetch_format: "webp",
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
          ]
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const result = await streamUpload();

    res.json({
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
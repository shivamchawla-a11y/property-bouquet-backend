const cloudinary = require("../config/cloudinary");

exports.uploadImage = async (req, res) => {
  try {
    const file = req.file;

    const result = await cloudinary.uploader.upload(file.path, {
      folder: "property-bouquet",

      // 🔥 MAGIC PART (important)
      transformation: [
        { fetch_format: "webp", quality: "auto:eco" }, // compress + convert
        {
          overlay: {
            font_family: "Arial",
            font_size: 40,
            text: "Property Bouquet",
          },
          gravity: "south_east",
          x: 20,
          y: 20,
          color: "white",
          opacity: 60,
        },
      ],
    });

    res.json({
      success: true,
      url: result.secure_url,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

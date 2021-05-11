// Installer et importer Express, Express-Formidable et Mongoose et dotenv et Cors
const express = require("express");
const expressFormidable = require("express-formidable");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

// Importer Cloudinary et spécifier les identifiants
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialiser le serveur et utiliser Express-Formidable et Cors
const app = express();
app.use(expressFormidable());
app.use(cors());

// Création et connexion du serveur à la base de données
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Importer les routes
const userRoutes = require("./routes/users");
const offerRoutes = require("./routes/offers");
const paymentRoutes = require("./routes/payments");
app.use(userRoutes);
app.use(offerRoutes);
app.use(paymentRoutes);

// Création d'une requête vers les routes inexistantes
app.all("*", (req, res) => {
  res.status(404).json("Il n'y a rien par là l'ami !");
});

// Ecouter un port
app.listen(process.env.PORT, () => {
  console.log("Server Started ! 😎");
});

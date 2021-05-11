// Importer Express et utiliser le Router
const express = require("express");
const router = express.Router();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

// Création d'une route POST pour recevoir un stripeToken
router.post("/payment", async (req, res) => {
  try {
    // Recupérer la data from Frontend
    const { stripeToken, dataArticle, userId } = req.fields;
    // Récupérer les infos du produit dans la base de données
    // Envoyer le token à l'API Stripe
    const response = await stripe.charges.create({
      amount: dataArticle.product_price * 100,
      currency: "eur",
      description: dataArticle.product_description,
      source: stripeToken,
    });
    // Récupère la réponse de l'API Stripe et réponse au client / frontend
    if (response.status === "succeeded") {
      res.status(200).json({ message: "Paiement validé" });
    } else {
      res.status(400).json({ message: "An error occured" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Exporter les routes
module.exports = router;

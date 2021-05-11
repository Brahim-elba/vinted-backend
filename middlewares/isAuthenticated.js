// Import des modèles
const User = require("../models/Users");

// Création de la fonction middleWares
const isAuthenticated = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      // Récupérer l'utilisateur à l'aide du token
      const user = await User.findOne({
        token: req.headers.authorization.replace("Bearer ", ""),
      });

      if (user) {
        req.user = user;
        return next();
      } else {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Export du middleware
module.exports = isAuthenticated;

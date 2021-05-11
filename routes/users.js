// Importer Express et utiliser le Router
const express = require("express");
const router = express.Router();

// Importer UID2, SHA 256 et encBase64
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

// Importer Cloudinary et spécifier les identifiants
const cloudinary = require("cloudinary").v2;

// Importer les models
const User = require("../models/Users");
const Offer = require("../models/Offers");

// Créer les routes

// Création d'une route POST pour SIGN UP
router.post("/user/signup", async (req, res) => {
  try {
    const { email, username, phone, password } = req.fields;
    const userExist = await User.findOne({ email: email });
    const usernameExist = await User.findOne({ "account.username": username });

    if (!userExist) {
      // Vérification si l'email de l'utilisateur est déjà associé à un compte
      if (username && password) {
        // Vérification si le username et le password ont bien été renseignés
        if (!usernameExist) {
          // Vérification si ce username est déjà existant dans la BDD
          let avatar = {};
          if (req.files.avatar) {
            avatar = await cloudinary.uploader.upload(req.files.avatar.path, {
              folder: "/vinted/users/avatar",
            });
          }

          const saltUser = uid2(16);
          const newUser = new User({
            email: email,
            account: {
              username: username,
              phone: phone,
              avatar: avatar.secure_url,
            },
            salt: saltUser,
            hash: SHA256(password + saltUser).toString(encBase64),
            token: uid2(64),
          });

          await newUser.save();
          res.status(200).json({
            message: "Votre compte a été créé avec succès",
            id: newUser.id,
            token: newUser.token,
            account: newUser.account,
          });
        } else {
          res.status(400).json({
            message:
              "Ce username est déjà associé à un compte, merci d'en saisir un autre",
          });
        }
      } else {
        res
          .status(400)
          .json({ message: "Merci de saisir un username et un password" });
      }
    } else {
      res
        .status(400)
        .json({ message: "Cet email est déjà associé à un compte !" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Création d'une route POST pour LOGIN
router.post("/user/login", async (req, res) => {
  try {
    const currentUser = await User.findOne({ email: req.fields.email });

    if (currentUser) {
      const newHash = SHA256(req.fields.password + currentUser.salt).toString(
        encBase64
      );
      if (currentUser.hash === newHash) {
        res.status(200).json({
          message: "La connexion à votre compte est établie !",
          id: currentUser.id,
          token: currentUser.token,
          account: currentUser.account,
        });
      } else {
        res.status(400).json({
          message: "La combinaison email/mot de passe est incorrecte",
        });
      }
    } else {
      res
        .status(400)
        .json({ message: "La combinaison email/mot de passe est incorrecte" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Création d'une route pour modifier le mot de passe
router.post("/user/change-password", async (req, res) => {
  try {
    const userAccount = await User.findOne({ email: req.fields.email });
    if (userAccount) {
      const hashCapture = SHA256(
        req.fields.currentPassword + userAccount.salt
      ).toString(encBase64);
      if (userAccount.hash === hashCapture) {
        userAccount.hash = SHA256(
          req.fields.newPassword + userAccount.salt
        ).toString(encBase64);
        await userAccount.save();
        res.status(200).json({ message: "Le mot de passe a bien été modifié" });
      } else {
        res.status(400).json({ message: "Le mot de passe est incorrect" });
      }
    } else {
      res
        .status(400)
        .json({ message: "Il n'existe pas de compte associé à cet email !" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Exporter Router
module.exports = router;

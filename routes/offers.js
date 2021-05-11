// Importer Express et utiliser le Router
const express = require("express");
const router = express.Router();

// Importer Cloudinary
const cloudinary = require("cloudinary").v2;

// Importer les models
const Offer = require("../models/Offers");
const User = require("../models/Users");

// Importer isAuthenticated
const isAuthenticated = require("../middlewares/isAuthenticated");

// Créer les routes

// Création d'une route pour publier une annonce
router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const { title, description, price, condition, city, brand, size, color } =
      req.fields;

    if (title.length < 50) {
      if (description.length < 500) {
        if (price < 100000) {
          const newOffer = new Offer({
            product_name: title,
            product_description: description,
            product_price: price,
            product_details: [
              { ETAT: condition },
              { EMPLACEMENT: city },
              { MARQUE: brand },
              { TAILLE: size },
              { COULEUR: color },
            ],
            owner: req.user,
          });
          let picture = {};
          if (req.files.picture) {
            picture = await cloudinary.uploader.upload(req.files.picture.path, {
              folder: `/vinted/offers/${newOffer.id}`,
            });
          }

          newOffer.product_image = picture;
          await newOffer.save();

          // Modifier le chemin du dossier dans Cloudinary
          //   await cloudinary.uploader.rename(
          //     picture.public_id,
          //     `vinted/offers/${newOffer.id}`
          //   );

          //   console.log(picture);

          res.status(200).json({
            message: "Votre offre a été publiée",
            id: newOffer.id,
            product_name: newOffer.product_name,
            product_description: newOffer.product_description,
            product_details: newOffer.product_details,
            product_image: newOffer.product_image,
            owner: { account: newOffer.owner.account, id: newOffer.owner.id },
            // owner: { account: userOwner.account, id: userOwner.id },
          });
        } else {
          res.status(400).json({
            message: "Veuillez saisir un prix inférieur à 100'000€.",
          });
        }
      } else {
        res.status(400).json({
          message:
            "Veuillez saisir une description dont le nombre de caractères est inférieur à 500.",
        });
      }
    } else {
      res.status(400).json({
        message:
          "Veuillez saisir un titre dont le nombre de caractères est inférieur à 50.",
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Création d'une route pour modifier une annonce
router.put("/offer/update", isAuthenticated, async (req, res) => {
  try {
    const {
      id,
      title,
      description,
      price,
      condition,
      city,
      brand,
      size,
      color,
    } = req.fields;

    const offerUpdate = await Offer.findById(id);

    if (offerUpdate) {
      if (offerUpdate.owner == req.user.id) {
        // offerUpdate.owner est un Object contrairement à req.user.id qui est un String
        if (title.length < 50) {
          if (description.length < 500) {
            if (price < 100000) {
              const picture = await cloudinary.uploader.upload(
                req.files.picture.path,
                {
                  folder: "/vinted/offers",
                }
              );
              offerUpdate.product_name = title;

              offerUpdate.product_description = description;
              offerUpdate.product_price = price;
              offerUpdate.product_details = [
                { ETAT: condition },
                { EMPLACEMENT: city },
                { MARQUE: brand },
                { TAILLE: size },
                { COULEUR: color },
              ];
              offerUpdate.product_image = picture;
              offerUpdate.owner = req.user;

              await offerUpdate.save();

              res.status(200).json({
                message: "Votre offre a été mise à jour",
                id: offerUpdate.id,
                product_name: offerUpdate.product_name,
                product_description: offerUpdate.product_description,
                product_details: offerUpdate.product_details,
                product_image: offerUpdate.product_image,
                owner: {
                  account: offerUpdate.owner.account,
                  id: offerUpdate.owner.id,
                },
                // owner: { account: userOwner.account, id: userOwner.id },
              });
            } else {
              res.status(400).json({
                message: "Veuillez saisir un prix inférieur à 100'000€.",
              });
            }
          } else {
            res.status(400).json({
              message:
                "Veuillez saisir une description dont le nombre de caractères est inférieur à 500.",
            });
          }
        } else {
          res.status(400).json({
            message:
              "Veuillez saisir un titre dont le nombre de caractères est inférieur à 50.",
          });
        }
      } else {
        res.status(400).json({
          message: "Unauthorized",
        });
      }
    } else {
      res.status(400).json({
        message: "L'offre que vous souhaitez mettre à jour n'existe pas",
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Créer une route DELETE pour supprimer une offre
router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    if (req.params.id) {
      const offerToDelete = await Offer.findById(req.params.id);
      if (offerToDelete) {
        if (offerUpdate.owner == req.user.id) {
          const offerToDelete2 = await Offer.findByIdAndDelete(req.params.id);
          res.status(400).json({ message: "L'offre a bien été supprimée" });
        } else {
          res.status(401).json({ error: "Unauthorized" });
        }
      } else {
        res.status(400).json({
          message: "L'offre que vous souhaitez supprimer n'existe pas.",
        });
      }
    } else {
      res.status(400).json({ message: "Veuillez saisir un ID." });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Création d'une route GET pour consulter les offres avec filtres...
router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax } = req.query;
    // Si plusieurs mots dans le titles
    // let keywords = req.query.keywords;
    // console.log(keywords);
    // if (keywords) {
    //   const newKeywords = keywords.split(" ");
    //   keywords = [];
    //   for (let i of newKeywords) {
    //     keywords.push(new RegExp(i, "i"));
    //   }
    // }

    let page = req.query.page;
    !page || page === "0" ? (page = 1) : Number(page);
    let filters = {};

    if (title) {
      filters.product_name = new RegExp(title, "i");
    }
    if (priceMin) {
      filters.product_price = { $gte: Number(priceMin) };
    }
    if (priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = Number(priceMax);
      } else {
        filters.product_price = { $lte: Number(priceMax) };
      }
    }

    let sort = {};
    let limit = undefined;

    if (req.query.sort === "price-desc") {
      sort.product_price = -1; // "desc"
    } else if (req.query.sort === "price-asc") {
      sort.product_price = 1; // "asc"
    }

    const offers = await Offer.find(
      filters
      // { product_description: keywords },
      // { "product_details.EMPLACEMENT": keywords },
    )
      .sort(sort)
      .skip((page - 1) * 5)
      .limit(limit)
      .populate("owner", "-email -__v -salt -token -hash") // ou .populate("owner", "account") => Fonctionne très bien !
      .select(
        "product_name product_description product_price product_details product_image.secure_url"
      );

    const count = await Offer.countDocuments(filters);

    if (offers.length > 0) {
      res.status(200).json({ count, offers });
    } else {
      res.status(400).json({ message: "Aucun résultat pour votre recherche." });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Création d'une requête GET pour consulter les détails concernant une annonce en fonction de son id
router.get("/offer/:id", async (req, res) => {
  try {
    const resultOffer = await Offer.findById(req.params.id).populate(
      "owner",
      "-email -__v -salt -token -hash"
    );
    res.status(200).json(resultOffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Exporter les routes
module.exports = router;

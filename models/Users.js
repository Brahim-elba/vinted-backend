// Importer mongoose
const mongoose = require("mongoose");

// Création du model
const User = mongoose.model("User", {
  email: {
    unique: true,
    type: String,
  },
  account: {
    username: {
      required: true,
      type: String,
    },
    phone: String,
    avatar: Object,
  },
  //   salt: { type: String, select: false },
  //   hash: { type: String, select: false },
  //   token: { type: String, select: false },
  salt: String,
  hash: String,
  token: String,
});

// Exporter le model
module.exports = User;

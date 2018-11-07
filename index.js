//--------------------------require----------------------------------------------------------//

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
var validator = require("validator");
const axios = require("axios");
// axios.get("http://api.themoviedb.org/3/movie/550?api_key=f9f6e52a9fd032c495c933c669ad2b4c");
const mongoose = require("mongoose");

//--------------------------------------------------------------------------------------------//
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/allocine-api",
  { useNewUrlParser: true }
);

//-------------------rechercher un film-------------------------------------------------------//
app.get("/api/search", function(req, res) {
  console.log("bonjour");

  axios
    .get(
      "https://api.themoviedb.org/3/search/movie?api_key=f9f6e52a9fd032c495c933c669ad2b4c&language=fr-FR&query=" +
        req.query.q +
        ""
    )

    .then(function(response) {
      console.log(response.data);

      res.json(response.data);
    })

    .catch(function(error) {
      console.log(error);
    });
});
//-------------------rechercher un film  par type-------------------------------------------//
//Requête GET : /api/movies/:type?p=1
app.get("/api/movies/:type", function(req, res) {
  axios
    .get(
      "https://api.themoviedb.org/3/movie/" +
        req.params.type +
        "?api_key=f9f6e52a9fd032c495c933c669ad2b4c&language=fr-FR"
    )

    .then(function(response) {
      console.log(response.data);

      res.json(response.data);
    })

    .catch(function(error) {
      console.log(error);
    });
});
//--------------------------Création d'une liste de films favoris--------------------------//

//Requête POST : /api/lists/add

//-------------------------------------Création d'un compte utilisateur--------------------//
//Requête POST : /api/sign_up

const UserModel = mongoose.model("User", {
  email: String,
  password: String,
  token: String,
  salt: String,
  hash: String,
  email: String,
  lists: Array
});
app.post("/api/sign_up", function(req, res) {
  const password = req.body.password;
  const salt = uid2(16);
  const hash = SHA256(password + salt).toString(encBase64);
  newUser = new UserModel({
    email: req.body.email,
    token: uid2(16),
    salt: salt,
    hash: hash
  });
  newUser.save(function(err, userSaved) {
    if (err) {
      res.status(400).json({ error: err.message });
    } else {
      res.json({
        _id: newUser._id,
        token: newUser.token,
        email: newUser.email,
        lists: newUser.lists
      });
    }
  });
});

// ------------------------ Démarrer serveur ----------------------------------------------//
app.listen(process.env.PORT || 3000, function() {
  console.log("Server started");
});

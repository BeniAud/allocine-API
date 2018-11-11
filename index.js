const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
const axios = require("axios");

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const mongoose = require("mongoose");
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/allocineAPI-2",
  { useNewUrlParser: true }
);

///////////////////
// MODELES ///
///////////////////

//------------ Modèle USER ------------//
const UserModel = mongoose.model("User", {
  username: {
    type: String
  },
  email: String,
  password: String,
  token: String,
  salt: String,
  hash: String,
  email: String,
  lists: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lists"
  }
});

//------------ Modèle MOVIES ------------//
const MoviesModel = mongoose.model("Movies", {
  id: {
    type: Number
  },
  original_title: String,
  poster_path: String,
  release_date: String
});

//------------ Modèle LISTS ------------//
const ListsModel = mongoose.model("Lists", {
  name: String,
  description: String,
  movies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movies" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

/////////////////////////
// Rechercher un film ///
////////////////////////

const myKey = "f9f6e52a9fd032c495c933c669ad2b4c";

//------------ Route SEARCH ------------//
app.get("/api/search", function(req, res) {
  let movie = req.query.q;
  let page = req.query.p;

  axios
    .get(
      "https://api.themoviedb.org/3/search/movie?api_key=" +
        myKey +
        "&language=fr-FR&query=" +
        encodeURI(movie) +
        "&page=" +
        page
    )
    .then(function(response) {
      res.json(response.data.results);
    })
    .catch(function(err) {
      console.log(err.message);
    });
});

//////////////////////////////////////
//////Lister les films par type//////
/////////////////////////////////////
// types suivants : popular, top_rated, now_playing, latest

app.get("/api/movies/:type", function(req, res) {
  axios
    .get(
      "https://api.themoviedb.org/3/movie/" +
        req.params.type +
        "?api_key=" +
        myKey +
        "&language=fr-FR&page=" +
        req.query.p
    )
    .then(function(response) {
      res.json(response.data.results);
    })
    .catch(function(err) {
      console.log(err.message);
    });
});

/////////////////////////////////////
// Création d'un compte utilisateur//
///////////////////////////////////

app.post("/api/sign_up", function(req, res) {
  const password = req.body.password;
  const salt = uid2(16);
  const hash = SHA256(password + salt).toString(encBase64);

  const newUser = new UserModel({
    email: req.body.email,
    token: uid2(16),
    salt: salt,
    hash: hash
  }); // newUser est une instance du model User

  //------------ Sauvegarde newUser ------------//
  newUser.save(function(err, userSaved) {
    if (err) {
      res.status(400).json({ error: err.message });
    } else {
      res.json({
        _id: userSaved._id,
        token: userSaved.token,
        email: userSaved.email,
        lists: userSaved.lists
      });
    }
  });
});

//////////////////////////////////////////
//Création d'une liste de films favoris //
//////////////////////////////////////////
// Authentifiez l'utilisateur grâce au token.//

app.post("/api/lists/add", function(req, res) {
  UserModel.findOne({ token: req.headers.authorization.slice(7) }).exec(
    function(err, userAuthenticated) {
      if (err) {
        res.json({
          error: {
            message: "Erreur d'authentitification"
          }
        });
      } else {
        let newList = new ListsModel({
          name: req.body.name,
          description: req.body.description,
          movies: [],
          createdBy: userAuthenticated._id
        });
        ListsModel.findOne({
          createdBy: userAuthenticated._id,
          name: req.body.name
        }).exec(function(err, ListFound) {
          if (ListFound !== null) {
            res.json({ error: "cette liste existe déjà" });
          } else {
            newList.save(function(err, Lists) {
              if (err) {
              } else {
                /* userAuthenticated.lists.push(newList._id); */
                res.json(Lists);
              }
            });
          }
        });
      }
    }
  );
});

////////////////////////////////
//Ajout d'un film à une liste //
///////////////////////////////
// Authentifiez l'utilisateur grâce au token.//

app.post("/api/movies/add", function(req, res) {
  UserModel.findOne({ token: req.headers.authorization.slice(7) }).exec(
    function(err, userAuthenticated) {
      if (err) {
        res.json({ error: "Erreur d'authentification" });
      } else {
        let newMovie = new MoviesModel({
          list_id: req.body.list_id,
          id: req.body.id,
          original_title: req.body.original_title,
          poster_path: req.body.poster_path,
          release_date: req.body.release_date
        });
        ListsModel.findOne({
          _id: req.body.list_id
        }).exec(function(err, ListFound) {
          if (ListFound === null) {
            res.json({ error: "Cette liste n'existe pas !" });
          } else {
            MoviesModel.findOne({ id: req.body.id }).exec(function(
              err,
              MovieFound
            ) {
              if (MovieFound !== null) {
                res.json({
                  error: "Le film a déjà été ajouté dans cette liste."
                });
              } else {
                newMovie.save(function(err, Movies) {
                  if (err) {
                  } else {
                    res.json({
                      message: "Le film a bien été ajouté aux favoris."
                    });
                  }
                });
              }
            });
          }
        });
      }
    }
  );
});

///////////////////////////////////////////////////
///Lister les favoris d'une liste particulière/////
///////////////////////////////////////////////////

//---------------------demarrer le serveur------------------------------------------------//
app.listen(process.env.PORT || 3000, function() {
  console.log("hello world");
});

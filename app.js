var express = require("express");

var app = express();

var mainPage = require("./mainPage.js");
var users = require("./users.js");
var database = require("./db.js");
var bodyParser = require('body-parser')
var apiRoot = "/";

// parse application/x-www-form-urlencoded
app.use(bodyParser.json());

database.start();

mainPage.register(app, apiRoot);
users.register(app, apiRoot + "users/");

app.listen(8080);

console.log("App Run");

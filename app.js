var express = require("express");

var app = express();

var mainPage = require("./mainPage.js");
var users = require("./users.js");
var database = require("./db.js");

var apiRoot = "/";

database.start();

mainPage.register(app, apiRoot);
mainPage.register(app, apiRoot + "users/");

app.listen(8080);

console.log("App Run");

var express = require("express");

var app = express();

var bodyParse = require("body-parser");

var mainPage = require("mainPage.js");


var apiRoot = "/";

app.use(bodyParse.json());


mainPage.register(app, apiRoot);

app.listen(7000);

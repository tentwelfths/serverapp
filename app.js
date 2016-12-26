var express = require("express");

var app = express();

var mainPage = require("./mainPage.js");

var apiRoot = "/";

mainPage.register(app, apiRoot);

app.listen(3000);

console.log("App Run");

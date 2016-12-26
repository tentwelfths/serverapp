var mongo = require("mongodb");
var MongoClient = mongo.MongoClient;

var url = "mongodb://localhost:27017/serverApp" + process.env.NODE_ENV;

var myDB = {};

exports.start = function(){
    MongoClient.connect(url, function(err, db){
        if(err){
            myDB = null;
            console.log("AIN'T NO DATABASE");
        }
        else{
            myDB = db;
        }
    })
}

exports.GetDatabase = function(){
    return myDB;
}
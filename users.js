
var database = require("./db.js");
var cryto = require("crypto");
var async = require("async");
var qs = require("qs");

function registerUser(req,res){
    console.log("register called");
    var db = database.GetDatabase();
    if(db != null){
        var querystring = qs.parse(req.url);
        var body = qs.parse(req.body);
        var username = querystring.username || body.username;
        var encryptedPassword = querystring.password || body.password;
        var users = db.collection("users");
        async.waterfall([
            function(callback){
                users.findOne({"username":username}, callback);
            },
            function(obj, callback){
                if(obj){
                    return res.send({status:"FAILED", reason:"USERNAME TAKEN"});
                }
                users.insert({"username":username, "password":encryptedPassword}, callback)
            },
            function(callback){
                callback(null, {status:"SUCCESS", "username":username, "password":encryptedPassword});
            }
        ],
        function(err, result){
            if(err){
                console.log("something is messed up");
            }
            return res.send(result);
        })
    }
}


module.exports.register = function(app, root){
    console.log("users registered");
    app.get(root + "register", registerUser);
    app.post(root + "register", registerUser);
}
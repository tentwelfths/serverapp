
var database = require("./db.js");
var cryto = require("crypto");
var async = require("async");
var qs = require("qs");

function registerUser(req,res){
    console.log("register called");
    var db = database.GetDatabase();
    if(db != null){
        //console.log(req);
        var query = req.query;
        var body = req.body;
        console.log(query);
        console.log(body);
        var username = query.username || body.username;
        var encryptedPassword = query.password || body.password;
        if(!username){
            return res.send({status:"FAILED", reason:"USERNAME NOT PROVIDED"});
        }
        if(!encryptedPassword){
            return res.send({status:"FAILED", reason:"PASSWORD NOT PROVIDED"});
        }
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
            function(obj, callback){
                callback(null, {status:"SUCCESS", "username":obj.username, "password":obj.password});
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
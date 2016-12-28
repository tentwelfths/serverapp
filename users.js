
var database = require("./db.js");
var crpyto = require("crypto");
var async = require("async");
var qs = require("qs");
const pug = require("pug");
var redis = require("redis").createClient();

function registerUser(req,res){
    console.log("register called");
    var db = database.GetDatabase();
    if(db != null){
        //console.log(req);
        var query = req.query || {};
        var body = req.body || {};
        console.log(query);
        console.log(body);
        var username = query.username || body.username;
        var encryptedPassword = query.password || body.password;
        if(!username){
            console.log("Insert failed no name");
            return res.status(200).send({status:"FAILED", reason:"USERNAME NOT PROVIDED"});
        }
        if(!encryptedPassword){
            console.log("Insert failed no pass");
            return res.status(200).send({status:"FAILED", reason:"PASSWORD NOT PROVIDED"});
        }
        var users = db.collection("users");
        async.waterfall([
            function(callback){
                users.findOne({"username":username}, callback);
            },
            function(obj, callback){
                if(obj){
                    console.log("Insert failed taken");
                    return res.status(200).send({status:"FAILED", reason:"USERNAME TAKEN"});
                }
                users.insert({"username":username, "password":encryptedPassword}, callback)
            },
            function(obj, callback){
                console.log("Insert successful");
                callback(null, {status:"SUCCESS", "username":username, "password":encryptedPassword});
            }
        ],
        function(err, result){
            if(err){
                return res.status(200).send({status:"FAILED", reason:"UNKNOWN"});
                console.log("something is messed up");
            }
            return res.status(200).send(result);
        })
    }
}

function loginUser(req,res){
    console.log("login called");
    var db = database.GetDatabase();
    if(db != null){
        //console.log(req);
        var query = req.query || {};
        var body = req.body || {};
        console.log(query);
        console.log(body);
        var username = query.username || body.username;
        var encryptedPassword = query.password || body.password;
        if(!username){
            console.log("login failed no name");
            return res.status(200).send({status:"FAILED", reason:"USERNAME NOT PROVIDED"});
        }
        if(!encryptedPassword){
            console.log("login failed no pass");
            return res.status(200).send({status:"FAILED", reason:"PASSWORD NOT PROVIDED"});
        }
        var users = db.collection("users");
        async.waterfall([
            function(callback){
                users.findOne({"username":username}, callback);
            },
            function(obj, callback){
                if(obj){
                    if(obj.password == encryptedPassword){
                        crypto.randomBytes(20, function(err, id){
                            if(err)callback(err);
                            crypto.randomBytes(20, function(err, token){
                                callback(null, id, token);
                            }); 
                        });
                    }
                }
                callback("failed", {status:"FAILED", reason:"Incorrect credentials"});
            },
            function(id, token, callback){
                redis.rpush(id, token,username);
                redis.expire(id, 3600);
                console.log("Just made an instance for " + username);
                callback(null, {status:"SUCCESS", "id":id, "token":token});
            },
        ],
        function(err, result){
            if(err){
                console.log("something is messed up");
                if(result) return res.status(200).send(result);
                return res.status(200).send({status:"FAILED", reason:"UNKNOWN"});
            }
            return res.status(200).send(result);
        })
    }
}

function displayUser(req,res){
    console.log("display called");
    var db = database.GetDatabase();
    if(db != null){
        if(req.params.name){
            var users = db.collection("users");
            async.waterfall([
                function(callback){
                    console.log("Trying to find " + req.params.name);
                    users.findOne({"username":req.params.name}, callback);
                },
                function(obj, callback){
                    if(obj){
                        console.log("Found " + req.params.name);
                        callback(null);
                    }
                    else{
                        console.log("Couldn't find " + req.params.name);
                        callback("failure");
                    }
                }
            ],
                function(err, result){
                    if(err)
                        return res.status(404).send();
                    else{
                        res.locals.name = req.params.name;
                        return res.render("userPage.pug");
                    }
                }
            );
        }
    }
}

module.exports.register = function(app, root){
    console.log("users registered");
    app.get(root + "register", registerUser);
    app.post(root + "register", registerUser);
    app.get(root + "login", loginUser);
    app.post(root + "login", loginUser);
    app.get(root + ":name", displayUser);
}
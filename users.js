
var database = require("./db.js");
var crypto = require("crypto");
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
                    console.log("Found user " + username);
                    console.log(encryptedPassword + " -- " + obj.password);
                    if(obj.password == encryptedPassword){
                        crypto.randomBytes(20, function(err, id){
                            if(err)callback(err);
                            crypto.randomBytes(20, function(err, token){
                                callback(null, id, token);
                            }); 
                        });
                        return;
                    }
                }
                callback("failed", {status:"FAILED", reason:"Incorrect credentials"});
            },
            function(id, token, callback){
                redis.rpush(id, token, username);
                redis.expire(id, 3600);
                console.log("Just made an instance for " + username);
                callback(null, {status:"SUCCESS", "id":id.toString("hex"), "token":token.toString("hex")});
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

/*
Data:
{
    TotalTestsRun:(int)
    TotalAudioTests:(int)
    TotalVisualTests:(int)
    TotalAVTests:(int)
    TotalSingleSessions:(int)
    TotalAudioSingleSessions:(int)
    TotalVisualSingleSessions:(int)
    TotalAVSingleSessions:(int)
    TotalFiveSessions:(int)
    TotalAudioFiveSessions:(int)
    TotalVisualFiveSessions:(int)
    TotalAVFiveSessions:(int)
    TotalTenSessions:(int)
    TotalAudioTenSessions:(int)
    TotalVisualTenSessions:(int)
    TotalAVTenSessions:(int)
    BestReactionTime:(float)
    BestFiveSet:{
        Times: [(float),(float),(float),(float),(float)]
    }
    BestTenSet:{
        Times: [(float),(float),(float),(float),(float),(float),(float),(float),(float),(float)]
    }
    BestAudioFiveSet:{
        Times: [(float),(float),(float),(float),(float)]
    }
    BestAudioTenSet:{
        Times: [(float),(float),(float),(float),(float),(float),(float),(float),(float),(float)]
    }
    BestVisualFiveSet:{
        Times: [(float),(float),(float),(float),(float)]
    }
    BestVisualTenSet:{
        Times: [(float),(float),(float),(float),(float),(float),(float),(float),(float),(float)]
    }
    BestAVFiveSet:{
        Times: [(float),(float),(float),(float),(float)]
    }
    BestAVTenSet:{
        Times: [(float),(float),(float),(float),(float),(float),(float),(float),(float),(float)]
    }
    AverageTime:(float)
    AverageAudioTime:(float)
    AverageVisualTime:(float)
    AverageAVTime:(float)
    AverageFiveSetTimes:{
        Times: [(float),(float),(float),(float),(float)]
    }
    AverageTenSetTimes:{
        Times: [(float),(float),(float),(float),(float),(float),(float),(float),(float),(float)]
    }
    AverageAudioFiveSetTimes:{
        Times: [(float),(float),(float),(float),(float)]
    }
    AverageAudioTenSetTimes:{
        Times: [(float),(float),(float),(float),(float),(float),(float),(float),(float),(float)]
    }
    AverageVisualFiveSetTimes:{
        Times: [(float),(float),(float),(float),(float)]
    }
    AverageVisualTenSetTimes:{
        Times: [(float),(float),(float),(float),(float),(float),(float),(float),(float),(float)]
    }
    AverageAVFiveSetTimes:{
        Times: [(float),(float),(float),(float),(float)]
    }
    AverageAVTenSetTimes:{
        Times: [(float),(float),(float),(float),(float),(float),(float),(float),(float),(float)]
    }
}

*/

function GetUsernameFromSession(id, token){
    redis.lrange(id, 0, -1, function(err, result){
    if(result.length > 0 && token === result[0])
    {
        return result[1];
    }
}

function storeSession(req, res){
    console.log("Logging session");
    var db = database.GetDatabase();
    if(db != null){
        //console.log(req);
        var query = req.query || {};
        var body = req.body || {};
        console.log(query);
        console.log(body);
        var id = query.id || body.id;
        var token = query.token || body.token;
        var username = GetUsernameFromSession(id, token);
        
        var testType = query.testType || body.testType;
        var testCount = query.testCount || body.testCount;
        var times = query.times || body.times;
        console.log("username: " + username);
        console.log("id: " + id);
        console.log("token: " + token);
        console.log("testType: " + testType);
        console.log("testCount: " + testCount);
        console.log("times: " + times);
        if(username){
            //Mongo shit
        }
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
    app.get(root + "submitSession", storeSession);
    app.post(root + "submitSession", storeSession);
    app.get(root + ":name", displayUser);
}
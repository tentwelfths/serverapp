
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
    BestTime:(float)
    BestFiveSet:{
        Times: [(float),(float),(float),(float),(float)]
    }
    BestTenSet:{
        Times: [(float),(float),(float),(float),(float),(float),(float),(float),(float),(float)]
    }
    BestAudioTime:(float)
    BestAudioFiveSet:{
        Times: [(float),(float),(float),(float),(float)]
    }
    BestAudioTenSet:{
        Times: [(float),(float),(float),(float),(float),(float),(float),(float),(float),(float)]
    }
    BestVisualTime:(float)
    BestVisualFiveSet:{
        Times: [(float),(float),(float),(float),(float)]
    }
    BestVisualTenSet:{
        Times: [(float),(float),(float),(float),(float),(float),(float),(float),(float),(float)]
    }
    BestAVTime: (float)
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

function InitializeStatEntry(obj){
    obj.stats = {
        TotalTestsRun:0,
        TotalAudioTests:0,
        TotalVisualTests:0,
        TotalAVTests:0,
        TotalSingleSessions:0,
        TotalAudioSingleSessions:0,
        TotalVisualSingleSessions:0,
        TotalAVSingleSessions:0,
        TotalFiveSessions:0,
        TotalAudioFiveSessions:0,
        TotalVisualFiveSessions:0,
        TotalAVFiveSessions:0,
        TotalTenSessions:0,
        TotalAudioTenSessions:0,
        TotalVisualTenSessions:0,
        TotalAVTenSessions:0,
        BestTime: 990,
        BestAudioTime: 990,
        BestVisualTime: 990,
        BestAVTime:0,
        AverageTime:0,
        AverageFiveSetTimes:{
            Times: [0,0,0,0,0]
        },
        AverageTenSetTimes:{
            Times: [0,0,0,0,0,0,0,0,0,0]
        },
        AverageAudioTime:0,
        AverageAudioFiveSetTimes:{
            Times: [0,0,0,0,0]
        },
        AverageAudioTenSetTimes:{
            Times: [0,0,0,0,0,0,0,0,0,0]
        },
        AverageVisualTime:0,
        AverageVisualFiveSetTimes:{
            Times: [0,0,0,0,0]
        },
        AverageVisualTenSetTimes:{
            Times: [0,0,0,0,0,0,0,0,0,0]
        },
        AverageAVTime:0,
        AverageAVFiveSetTimes:{
            Times: [0,0,0,0,0]
        },
        AverageAVTenSetTimes:{
            Times: [0,0,0,0,0,0,0,0,0,0]
        }
    }
}

function GetUsernameFromSession(id, token){
    redis.lrange(id, 0, -1, function(err, result){
        if(result.length > 0 && token === result[0])
        {
            return result[1];
        }
    });
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
            var users = db.collection("users");
            async.waterfall([
                function(callback){
                    users.findOne({"username":username}, callback);
                },
                function(obj, callback){
                    if(obj){
                        if(!obj.stats){
                            InitializeStatEntry(obj);
                        }
                        if(testCount.toString() == '1'){
                            obj.stats.TotalTestsRun += 1;
                            obj.stats.TotalSingleSessions += 1;
                            if(Number.parseFloat(times[0]) < obj.stats.BestTime) obj.stats.BestTime = Number.parseFloat(times[0]);
                            obj.stats.AverageTime = ((obj.stats.AverageTime * (obj.stats.TotalTestsRun - 1)) + times[0]) / obj.stats.TotalTestsRun;
                            if(testType == 'A'){
                                if(Number.parseFloat(times[0]) < obj.stats.BestAudioTime) obj.stats.BestAudioTime = Number.parseFloat(times[0]);
                                obj.stats.TotalAudioTests += 1;
                                obj.stats.TotalAudioSingleSessions += 1;
                                obj.stats.AverageAudioTime = ((obj.stats.AverageAudioTime * (obj.stats.TotalAudioTests - 1)) + times[0]) / obj.stats.TotalAudioTests;
                            }
                            if(testType == 'V'){
                                if(Number.parseFloat(times[0]) < obj.stats.BestVisualTime) obj.stats.BestVisualTime = Number.parseFloat(times[0]);
                                obj.stats.TotalVisualTests += 1;
                                obj.stats.TotalVisualSingleSessions += 1;
                                obj.stats.AverageVisualTime = ((obj.stats.AverageVisualTime * (obj.stats.TotalVisualTests - 1)) + times[0]) / obj.stats.TotalVisualTests;
                            }
                            if(testType == 'AV'){
                                if(Number.parseFloat(times[0]) < obj.stats.BestAVTime) obj.stats.BestAVTime = Number.parseFloat(times[0]);
                                obj.stats.TotalAVTests += 1;
                                obj.stats.TotalAVSingleSessions += 1;
                                obj.stats.AverageAVTime = ((obj.stats.AverageAudioTime * (obj.stats.TotalAVTests - 1)) + times[0]) / obj.stats.TotalAVTests;
                            }
                        }
                        else if(testCount.toString() == '5'){
                            obj.stats.TotalFiveSessions += 1;
                            for(var i = 0; i < 5; ++i){
                                if(Number.parseFloat(times[i]) < obj.stats.BestTime) obj.stats.BestTime = Number.parseFloat(times[i]);
                                obj.stats.AverageFiveSetTimes[i] = ((obj.stats.AverageFiveSetTimes[i] * (obj.stats.TotalTestsRun / 5)) + times[i]) / ((obj.stats.TotalTestsRun / 5) + 1);
                            }
                            obj.stats.TotalTestsRun += 5;
                            if(testType == 'A'){
                                var temptime = (obj.stats.AverageAudioTime * obj.stats.TotalAudioTests);
                                for(var i = 0; i < 5; ++i){
                                    if(Number.parseFloat(times[i]) < obj.stats.BestAudioTime) obj.stats.BestAudioTime = Number.parseFloat(times[i]);
                                    temptime += Number.parseFloat(times[i]);
                                    obj.stats.AverageAudioFiveSetTimes[i] = ((obj.stats.AverageAudioFiveSetTimes[i] * (obj.stats.TotalAudioTests / 5)) + times[i]) / ((obj.stats.TotalAudioTests / 5) + 1);
                                }
                                obj.stats.TotalAudioTests += 5;
                                obj.stats.TotalAudioFiveSessions += 1;
                                obj.stats.AverageAudioTime = temptime / obj.stats.TotalAudioTests;
                            }
                            if(testType == 'V'){
                                var temptime = (obj.stats.AverageVisualTime * obj.stats.TotalVisualTests);
                                for(var i = 0; i < 5; ++i){
                                    if(Number.parseFloat(times[i]) < obj.stats.BestVisualTime) obj.stats.BestVisualTime = Number.parseFloat(times[i]);
                                    temptime += Number.parseFloat(times[i]);
                                    obj.stats.AverageVisualFiveSetTimes[i] = ((obj.stats.AverageVisualFiveSetTimes[i] * (obj.stats.TotalVisualTests / 5)) + times[i]) / ((obj.stats.TotalVisualTests / 5) + 1);
                                }
                                obj.stats.TotalVisualTests += 5;
                                obj.stats.TotalVisualFiveSessions += 1;
                                obj.stats.AverageVisualTime = temptime / obj.stats.TotalVisualTests;
                            }
                            if(testType == 'AV'){
                                var temptime = (obj.stats.AverageAVTime * obj.stats.TotalAVTests);
                                for(var i = 0; i < 5; ++i){
                                    if(Number.parseFloat(times[i]) < obj.stats.BestAVTime) obj.stats.BestAVTime = Number.parseFloat(times[i]);
                                    temptime += Number.parseFloat(times[i]);
                                    obj.stats.AverageAVFiveSetTimes[i] = ((obj.stats.AverageAVFiveSetTimes[i] * (obj.stats.TotalAVTests / 5)) + times[i]) / ((obj.stats.TotalAVTests / 5) + 1);
                                }
                                obj.stats.TotalAVTests += 5;
                                obj.stats.TotalAVFiveSessions += 1;
                                obj.stats.AverageAVTime = temptime / obj.stats.TotalAVTests;
                            }
                        }
                        else if(testCount.toString() == '10'){
                            obj.stats.TotalTenSessions += 1;
                            for(var i = 0; i < 10; ++i){
                                if(Number.parseFloat(times[i]) < obj.stats.BestTime) obj.stats.BestTime = Number.parseFloat(times[i]);
                                obj.stats.AverageTenSetTimes[i] = ((obj.stats.AverageTenSetTimes[i] * (obj.stats.TotalTestsRun / 10)) + times[i]) / ((obj.stats.TotalTestsRun / 10) + 1);
                            }
                            obj.stats.TotalTestsRun += 10;
                            if(testType == 'A'){
                                var temptime = (obj.stats.AverageAudioTime * obj.stats.TotalAudioTests);
                                for(var i = 0; i < 10; ++i){
                                    if(Number.parseFloat(times[i]) < obj.stats.BestAudioTime) obj.stats.BestAudioTime = Number.parseFloat(times[i]);
                                    temptime += Number.parseFloat(times[i]);
                                    obj.stats.AverageAudioTenSetTimes[i] = ((obj.stats.AverageAudioTenSetTimes[i] * (obj.stats.TotalAudioTests / 10)) + times[i]) / ((obj.stats.TotalAudioTests / 10) + 1);
                                }
                                obj.stats.TotalAudioTests += 10;
                                obj.stats.TotalAudioTenSessions += 1;
                                obj.stats.AverageAudioTime = temptime / obj.stats.TotalAudioTests;
                            }
                            if(testType == 'V'){
                                var temptime = (obj.stats.AverageVisualTime * obj.stats.TotalVisualTests);
                                for(var i = 0; i < 10; ++i){
                                    if(Number.parseFloat(times[i]) < obj.stats.BestVisualTime) obj.stats.BestVisualTime = Number.parseFloat(times[i]);
                                    temptime += Number.parseFloat(times[i]);
                                    obj.stats.AverageVisualTenSetTimes[i] = ((obj.stats.AverageVisualTenSetTimes[i] * (obj.stats.TotalVisualTests / 10)) + times[i]) / ((obj.stats.TotalVisualTests / 10) + 1);
                                }
                                obj.stats.TotalVisualTests += 10;
                                obj.stats.TotalVisualTenSessions += 1;
                                obj.stats.AverageVisualTime = temptime / obj.stats.TotalVisualTests;
                            }
                            if(testType == 'AV'){
                                var temptime = (obj.stats.AverageAVTime * obj.stats.TotalAVTests);
                                for(var i = 0; i < 10; ++i){
                                    if(Number.parseFloat(times[i]) < obj.stats.BestAVTime) obj.stats.BestAVTime = Number.parseFloat(times[i]);
                                    temptime += Number.parseFloat(times[i]);
                                    obj.stats.AverageAVTenSetTimes[i] = ((obj.stats.AverageAVTenSetTimes[i] * (obj.stats.TotalAVTests / 10)) + times[i]) / ((obj.stats.TotalAVTests / 10) + 1);
                                }
                                obj.stats.TotalAVTests += 10;
                                obj.stats.TotalAVTenSessions += 1;
                                obj.stats.AverageAVTime = temptime / obj.stats.TotalAVTests;
                            }
                        }
                        users.updateOne({_id:obj._id}, obj, callback);
                    }
                    callback("failed", {status:"FAILED", reason:"Incorrect credentials"});
                },
                function(obj, callback){
                    console.log("Insert successful");
                    callback(null, {status:"SUCCESS"});
                }
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
    return res.status(200).send({status:"SUCCESS"});
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
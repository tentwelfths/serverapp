
function loadMainPage(req,res){
    console.log("WEGNOWING");
    var response = {
        status:"It worked!"
    };
    res.status(200).send(JSON.stringify(response));
}

module.exports.register = function(app, root){
    console.log("mainpage registered");
    app.get(root + "index", loadMainPage);
}
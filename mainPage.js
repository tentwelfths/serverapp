
function loadMainPage(req,res){
    var response = {
        status:"It worked!";
    }
    res.send(JSON.stringify(response));
}

exports.register = function(app, root){
    app.get(root, loadMainPage);
}
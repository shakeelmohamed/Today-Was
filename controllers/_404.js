module.exports = function (getViewData) {
    return {
        get: function (req, res) {
            // res.render("404", getViewData("404", "", req.session.userID)); 
            // It's probably better to send them home, but with an error message
            //res.redirect("/");
            res.render("index", getViewData("Home", "home", req.session.userID, req.session.userEmail, "It looks like you tried accessing a page that doesn't exist."));
        }
    };
};
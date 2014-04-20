module.exports = function (getViewData) {
    return {
        get: function (req, res) {
            res.render("about", getViewData("About", "about", req.session.userID, req.session.userEmail));
        }
    };
};
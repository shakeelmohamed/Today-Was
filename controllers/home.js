module.exports = function (getViewData) {
    return {
        get: function (req, res) {
            res.render("index", getViewData("Home", "", req.session.userID, req.session.userEmail));
        }
    };
};
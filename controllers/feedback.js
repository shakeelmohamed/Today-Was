module.exports = function (getViewData, config) {
    return {
        get: function (req, res) {
            var async = require("async");
            var pg = require("pg");

            var viewData = getViewData("Feedback", "feedback", req.session.userID);
            viewData.email = "";

            var client = new pg.Client(config.DATABASE_URL);
            async.waterfall([
                    function (callback) {
                        client.connect(callback);
                    },
                    function (client, callback) {
                        client.query("SELECT * FROM users WHERE LOWER(username)=LOWER($1) LIMIT 1", [req.session.userID], callback);
                    },
                    function (result, callback) {
                        if (result && result.rows && result.rowCount === 1) {
                            var user = result.rows[0];
                            viewData.email = user.email || "";
                        }
                        callback(null);
                    }
                ],
                function () {
                    client.end();
                    res.render("feedback", viewData);
                }
            );
        }
    };
};
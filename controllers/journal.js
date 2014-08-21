module.exports = function (getViewData, config) {
    function getGMTOffset() {
        var offset = new Date().getTimezoneOffset();
        offset = offset / 60;
        if (offset !== 0) {
            offset = offset * -1;
        }
        offset = "GMT" + offset;
        return offset;
    }

    /*
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                return false;
            }
        }
        return true;
    }
    */
    return {
        get: function (req, res) {
            var pg = require("pg");
            var async = require("async");

            var viewData = getViewData("Journal", "journal", req.session.userID, req.session.userEmail, req.session.journalError || null);
            viewData.today = {};

            var asyncStatus = [];
            var client = new pg.Client(config.DATABASE_URL);

            async.waterfall([
                    function (callback) {
                        asyncStatus.push("connect");
                        client.connect(callback);
                    },
                    function (client, callback) {
                        asyncStatus.push("query - today");
                        // TODO: I can simplify this into the second query, then populate viewData.today if necessary
                        //      based on what's returned, basically manually doing an iteration in JS
                        //      which would be more effective from every perspective because I wouldn't have
                        //      multiple queries, or multiple uses of client, thus optimizing everything.
                        var justToday = "SELECT ratings.value, EXTRACT(epoch FROM user_ratings.created_date) AS created_date, user_ratings.entry FROM user_ratings JOIN ratings ON ratings.id = user_ratings.id_ratings WHERE (user_ratings.id_users = (SELECT users.id FROM users WHERE users.username=$1) AND (date_trunc('day', localtimestamp AT TIME ZONE $2) = date_trunc('day', user_ratings.created_date AT TIME ZONE $2))) LIMIT 1;";
                        client.query(justToday, [req.session.userID, getGMTOffset()], callback);
                    },
                    function (result, callback) {
                        asyncStatus.push("query - recent entries");
                        if (result.rows.length === 1) {
                            viewData.today = result.rows[0];
                        }
                        // TODO: consider adding pagination (auto?), or some other way of grouping entries
                        client.query("SELECT user_ratings.entry, ratings.label, EXTRACT(epoch FROM user_ratings.created_date) AS created_date FROM user_ratings JOIN ratings ON user_ratings.id_ratings = ratings.id WHERE user_ratings.id_users = (SELECT users.id FROM users WHERE users.username=$1) ORDER BY user_ratings.created_date DESC;",
                            [req.session.userID], callback);
                    },
                    function (result, callback) {
                        var rows = result.rows;
                        if (rows.length !== 0) {
                            for (var r in rows) {
                                /*jshint camelcase: false */
                                rows[r].created_date = (new Date(rows[r].created_date * 1000)).toLocaleDateString();
                            }
                        }
                        viewData.entries = rows;
                        callback(null);
                    }
                ],
                function (err) {
                    client.end();
                    console.log("Async status", asyncStatus);

                    if (err) {
                        console.log("Error loading the journal page", err);
                        // TODO: think of the best place to send the user.
                        res.redirect("/");
                    }
                    else {
                        res.render("journal", viewData);
                    }
                }
            );
        }
    };
};
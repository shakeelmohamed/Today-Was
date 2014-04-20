module.exports = function (getViewData, config) {
    return {
        post: function (req, res) {
            res.format({
                json: function () {
                    var pg = require("pg");
                    var async = require("async");
                    
                    var userID = req.session.userID;

                    if (userID && userID.length > 0) {
                        var feed = [];
                        var client = new pg.Client(config.DATABASE_URL);
                        // Query for all entries:
                        async.waterfall([
                                function (callback) {
                                    client.connect(callback);
                                },
                                function (client, callback) {
                                    // TODO: consider adding pagination (auto?), or some other way of grouping entries
                                    client.query("select user_ratings.entry, ratings.label, EXTRACT(epoch from user_ratings.created_date) as created_date from user_ratings join ratings on user_ratings.id_ratings = ratings.id where user_ratings.id_users = (select users.id from users where users.username=$1) order by user_ratings.created_date DESC;", [userID], callback);
                                },
                                function (result, callback) {
                                    var rows = result.rows;
                                    if (rows.length !== 0) {
                                        for (var r in rows) {
                                            /*jshint camelcase: false */
                                            rows[r].created_date = (new Date(rows[r].created_date * 1000)).toLocaleDateString();
                                        }
                                        feed = rows;
                                    }
                                    callback(null);
                                }
                            ],
                            function (err) {
                                client.end();
                                if (err) {
                                    res.json({"error": "An error occurred while trying to get your journal entries."});
                                }
                                else {
                                    res.json({"feed": feed});
                                }
                            }
                        );
                    }
                    else {
                        res.json({"error": "It looks like you're not logged in, so we can't get your journal entries."});
                    }
                }
            });
        }
    };
};
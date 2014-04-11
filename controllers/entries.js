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
    function insertEntry(client, userID, rating, journal, done) {
        rating = parseInt(rating, 10);
        client.query("insert into user_ratings values (DEFAULT, (select users.id from users where users.username=$1), $2, $3)",
            [userID, rating, journal],
            done);
    }
    function updateEntry(client, userID, rating, journal, done) {
        rating = parseInt(rating, 10);
        client.query("UPDATE user_ratings SET id_ratings=$2, entry=$3, edited_date=DEFAULT WHERE id = (SELECT id FROM user_ratings WHERE id_users=(select users.id from users where users.username=$1) AND (date_trunc('day', localtimestamp AT TIME ZONE $4) = date_trunc('day', user_ratings.created_date AT TIME ZONE $4)));",
            [userID, rating, journal, getGMTOffset()],
            done);
    }
    return {
        post: function (req, res) {
            var pg = require("pg");
            var async = require("async");
            
            var post = req.body;
            var userID = req.session.userID;

            // TODO: add a check to make sure post.rating and post.entry are also set, otherwise send them back w/ filled in info
            if (userID && userID.length > 0 && (post.submit === "Save" || post.submit === "Update")) {
                var asyncStatus = [];
                var client = new pg.Client(config.DATABASE_URL);
                async.waterfall([
                        function (callback) {
                            asyncStatus.push("connect");
                            client.connect(callback);
                        },
                        function (client, callback) {
                            if (post.submit === "Save") {
                                asyncStatus.push("save");
                                insertEntry(client, userID, post.rating, post.journal, callback);
                            }
                            else if (post.submit === "Update") {
                                asyncStatus.push("update");
                                updateEntry(client, userID, post.rating, post.journal, callback);
                            }
                        },
                        function (result, callback) {
                            asyncStatus.push("successful journal entry");
                            callback(null);
                        }
                    ],
                    function (err) {
                        client.end();
                        console.log("Async status", asyncStatus);

                        if (err) {
                            console.log("Error on journal entry insertion:", err);
                            // TODO: do a fully manual rendering of the journal page, pass back an error and the new values (maybe reload to revert the unsaved changes?)
                            // Pass in the args necessary to getViewData, then I can "refill" the unsaved changes, add a button or something to
                            // say keep unsaved changes, or dump them.
                        }
                        res.redirect("journal"); //TODO: I should send them back to the page, and remember their rating + journal if not saved

                    }
                );
            }
            else {
                req.session.unsaved = {};
                if (post.rating) {
                    req.session.unsaved.ratings = post.rating;
                }
                if (post.journal) {
                    req.session.unsaved.ratings = post.journal;
                }
                //TODO: I should send them back to the page, and remember their rating + journal if not saved
                res.redirect("journal");
            }
        }
    };
};
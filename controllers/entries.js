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
        //client.query("INSERT INTO user_ratings (id, id_users, id_ratings, entry) VALUES (DEFAULT, (SELECT users.id FROM users WHERE users.username=$1), $2, $3)",
        client.query("SELECT upsert_rating($1, $2, $3, $4);",
            [userID, rating, journal, getGMTOffset()],
            done);
    }
    function updateEntry(client, userID, rating, journal, done) {
        rating = parseInt(rating, 10);
        //client.query("UPDATE user_ratings SET id_ratings=$2, entry=$3, edited_date=DEFAULT WHERE id=(SELECT id FROM user_ratings WHERE id_users=(SELECT users.id FROM users WHERE users.username=$1) AND (date_trunc('day', localtimestamp AT TIME ZONE $4) = date_trunc('day', user_ratings.created_date AT TIME ZONE $4)));",
        client.query("SELECT upsert_rating($1, $2, $3, $4);",
            [userID, rating, journal, getGMTOffset()],
            done);
    }
    return {
        post: function (req, res) {
            var pg = require("pg");
            var async = require("async");
            
            var post = req.body;
            var userID = req.session.userID;

            console.log("req accepted", req.accepted);
            if (post.ajax) {
                console.log(post.ajax, "posting as ajax");
            }

            // TODO: replace all routing with res.format();
            // in doing so, shove everything into a function and REALLY clean everything up.

            // TODO: I can make this more specific, and do more specific error handling
            // TODO: add a check to make sure post.rating and post.entry are also set, otherwise send them back w/ filled in info
            if (userID && userID.length > 0 && (post.submit === "Save" || post.submit === "Update") && post.rating && post.journal) {
                var asyncStatus = [];
                var client = new pg.Client(config.DATABASE_URL);
                async.waterfall([
                        function (callback) {
                            asyncStatus.push("connect");
                            client.connect(callback);
                        },
                        function (client, callback) {
                            if (post.submit === "Save") {
                                // TODO: if there's a funky HTML error or post.submit is set incorrectly
                                // there's a STRONG chance of duplicating entries for a given day.
                                // We want to prevent this, so add some async code do double check
                                // that there really isn't already an entry, and if so throw an error?
                                // or update it anyways??? Look into some possible use cases.
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
                        if (post.ajax && err) {
                            // TODO: handle his case when can't connect to DB: Error on journal entry insertion: { [Error: getaddrinfo ENOTFOUND] code: 'ENOTFOUND', errno: 'ENOTFOUND', syscall: 'getaddrinfo' }
                            res.json({error: "Woah! The database did not like that data at all. Your entry hasn't been saved."});
                        }
                        else if (post.ajax) {
                            res.json({status: "success"});
                        }
                        else {
                            //res.redirect("journal"); //TODO: I should send them back to the page, and remember their rating + journal if not saved
                            req.session.journalError = "Woah! The database did not like that data at all. Your entry hasn't been saved.";
                            res.redirect("journal");
                        }
                        

                    }
                );
            }
            else {
                //TODO: I should send them back to the page, and remember their rating + journal if not saved
                if (post.ajax) {
                    res.json({error: "Woah! We didn't get the data we expected, please try saving your entry again."});
                }
                else {
                    res.redirect("journal");
                }
                
            }
        }
    };
};
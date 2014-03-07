module.exports = function (getViewData, config) {
    return {
        post: function (req, res) {
            var pg = require("pg");
            var async = require("async");
            
            var post = req.body;
            var userID = req.session.userID
            /**
            {
              "rating": "3",
              "journal": "JOHAN",
              "submit": "Save"
            }
            **/
            //insert into user_ratings values(DEFAULT, (select users.id from users where username='JOHAN') ,3, 'foobar hehe');
            //insert into user_ratings values(DEFAULT, (select users.id from users where username=$1) , $2, $3);
            ///*
            pg.connect(config.DATABASE_URL, function (err, client) {
                if (err) {
                    return console.error("could not connect to postgres", err);
                }
                if (post.submit == "Save")
                {
                    //TODO: sanitize before doing the insert
                    // Handle registration process,
                    //Insert query must be run asynch, to get the callback for errors like non-unique values, etc.
                    async.waterfall([
                            function (callback) {
                                client.query("insert into user_ratings values (DEFAULT, (select users.id from users where users.username=$1), $2, $3)", [userID, parseInt(post.rating), post.journal], callback);
                            },
                            function (result, callback) {
                                /*
                                if (!post.user || !post.email || !post.password) {
                                    callback(true);
                                }
                                else {
                                    console.log("Entry insertion worked for", post.user);
                                    req.session.userID = post.user;
                                    res.redirect("account");
                                }
                                */
                                res.redirect("account");
                            }
                        ],
                        function (err) {
                            if (err || err === true) {
                                console.log("ERROR ON entry insertion:", err);
                                res.redirect("account"); //TODO: I should send them back to the page, w/ and remember their rating + journal if not saved
                            }
                        }
                    );
                }
                else {
                    res.redirect("account"); //TODO: I should send them back to the page, w/ and remember their rating + journal if not saved
                }
            });
            //*/
        }
    };
};
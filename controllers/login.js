function areFieldsSet(postObject) {
    // Define your custom validation here
    if (postObject.user && postObject.password) {
        return true;
    }
    else {
        return false;
    }
}

function getClientIp(req) {
  var ipAddress;
  // Amazon EC2 / Heroku workaround to get real client IP
  var forwardedIpsStr = req.header('x-forwarded-for'); 
  if (forwardedIpsStr) {
    // 'x-forwarded-for' header may return multiple IP addresses in
    // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
    // the first one
    var forwardedIps = forwardedIpsStr.split(',');
    ipAddress = forwardedIps[0];
  }
  if (!ipAddress) {
    // Ensure getting client IP address still works in
    // development environment
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
}

module.exports = function (getViewData, config) {
    return {
        get: function (req, res) {
            if (req.session.userID) {
                //Send user to the account page if they're authorized
                res.redirect("account");
            }
            else {
                res.render("login", getViewData("Login", "login"));
            }
        },
        post: function (req, res) {
            var async = require("async");
            var bcrypt = require("bcrypt-nodejs");
            var pg = require("pg");

            var post = req.body;
            
            //TODO: add some data validation: email, password format, string length, SQL sanitize
            if (!areFieldsSet(post)) {
                res.render("login", getViewData("Login", "login", req.session.userID, "Error: login failed"));
            }
            else {
                pg.connect(config.DATABASE_URL, function (err, client) {
                    if (err) {
                        return console.error("could not connect to postgres", err);
                    }
                    if (post.login == "login")
                    {
                        async.waterfall([
                                function (callback) {
                                    client.query("SELECT * FROM users WHERE LOWER(username)=LOWER($1) OR LOWER(email)=LOWER($1) LIMIT 1", [post.user], callback);
                                },
                                function (result, callback) {
                                    if (!result || !result.rows || result.rows.length === 0) {
                                        //TODO: learn more about each of these cases, and why they occur
                                        //      at least one of these is due to post.user being an invalid user
                                        callback(true);
                                    }
                                    else {
                                        if (bcrypt.compareSync(post.password, result.rows[0].secret)) {
                                            console.log("Login worked for", result.rows[0].username);
                                            var username = result.rows[0].username;
                                            client.query("INSERT INTO logins VALUES (DEFAULT, $1, DEFAULT, $2)", [getClientIp(req), result.rows[0].id], function(err, result){
                                                if (err) {
                                                    callback(err);
                                                }
                                                else {
                                                    req.session.userID = username;
                                                    res.redirect("account");
                                                }
                                            });
                                        }
                                        else {
                                            callback(true);
                                        }
                                    }
                                }
                            ],
                            function (err) {
                                if (err || err === true) {
                                    res.render("login", getViewData("Login", "login", req.session.userID, "Error: login failed"));
                                }
                            }
                        );
                    }
                    else {
                        res.render("login", getViewData("Login", "login", req.session.userID, "Error: login failed, unexpected form data"));
                    }
                });
            }
        }
    };
};
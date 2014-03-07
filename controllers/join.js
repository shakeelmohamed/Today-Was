function areFieldsSet(postObject) {
    // Define your custom validation here
    if (postObject.user && postObject.email && postObject.password) {
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
                res.render("join", getViewData("Join", "join"));
            }
        },
        post: function (req, res) {
            var async = require("async");
            var bcrypt = require("bcrypt-nodejs");
            var pg = require("pg");

            var post = req.body;

            //TODO: add some data validation: email, password format, string length, SQL sanitize
            if (!areFieldsSet(post)) {
                res.render("join", getViewData("Join", "join", req.session.userID, "Error: user registration failed"));
            }
            else {
                pg.connect(config.DATABASE_URL, function (err, client) {
                    if (err) {
                        return console.error("could not connect to postgres", err);
                    }
                    if (post.register == "register")
                    {
                        //TODO: sanitize before doing the insert
                        // Handle registration process,
                        //Insert query must be run asynch, to get the callback for errors like non-unique values, etc.
                        async.waterfall([
                                function (callback) {
                                    client.query("insert into users (id, username, email, secret, registration_ip, registration_timestamp) values (DEFAULT, $1, $2, $3, $4, DEFAULT)", [post.user, post.email, bcrypt.hashSync(post.password), getClientIp(req)], callback);
                                },
                                function (result, callback) {
                                    if (!post.user || !post.email || !post.password) {
                                        callback(true);
                                    }
                                    else {
                                        console.log("Registration worked for", post.user);
                                        req.session.userID = post.user;
                                        res.redirect("account");
                                    }
                                }
                            ],
                            function (err) {
                                if (err || err === true) {
                                    console.log("ERROR ON REGISTRATION:", err);
                                    res.render("join", getViewData("Join", "join", req.session.userID, "Error: user registration failed"));
                                }
                            }
                        );
                    }
                    else {
                        res.render("join", getViewData("Join", "join", null, "Error: registration failed, unexpected form data"));
                    }
                });
            }
        }
    };
};
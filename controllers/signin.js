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
    var forwardedIpsStr = req.header("x-forwarded-for");
    if (forwardedIpsStr) {
        // 'x-forwarded-for' header may return multiple IP addresses in
        // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
        // the first one
        var forwardedIps = forwardedIpsStr.split(",");
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
                //Send user to the journal page if they're authorized
                res.redirect("journal");
            }
            else {
                res.render("signin", getViewData("Sign In", "signin"));
            }
        },
        post: function (req, res) {
            var async = require("async");
            var bcrypt = require("bcrypt-nodejs");
            var pg = require("pg");

            var post = req.body;
            
            //TODO: add some data validation: email, password format, string length, SQL sanitize
            if (!areFieldsSet(post) && post.signin !== "signin") {
                res.render("sign in", getViewData("Sign In", "signin", req.session.userID, "Error: sign in failed"));
            }
            else {
                var asyncStatus = [];
                var client = new pg.Client(config.DATABASE_URL);
                var user;

                async.waterfall([
                        function (callback) {
                            asyncStatus.push("connect");
                            client.connect(callback);
                        },
                        function (client, callback) {
                            asyncStatus.push("client");
                            client.query("SELECT * FROM users WHERE LOWER(username)=LOWER($1) OR LOWER(email)=LOWER($1) LIMIT 1", [post.user], callback);
                        },
                        function (result, callback) {
                            asyncStatus.push("select user");
                            if (result && result.rows && result.rowCount === 1 &&  bcrypt.compareSync(post.password, result.rows[0].secret)) {
                                user = result.rows[0];
                                console.log("Sign in worked for", user.username);
                                // Insert the login entry
                                client.query("INSERT INTO logins (id, ip, timestamp, id_users) VALUES (DEFAULT, $1, DEFAULT, $2)", [getClientIp(req), user.id], callback);
                            }
                            else {
                                callback("Invalid user.");
                            }
                        },
                        function (result, callback) {
                            asyncStatus.push("sign in success");
                            req.session.userID = user.username;
                            req.session.userEmail = user.email;
                            callback(null);
                        }
                    ],
                    function (err) {
                        client.end();
                        console.log("Async status", asyncStatus);

                        if (err) {
                            console.log("ERROR", err);
                            res.render("signin", getViewData("Sign in", "signin", req.session.userID, req.session.userEmail, "Error: sign in failed"));
                        }
                        res.redirect("journal");
                    }
                );
            }
        }
    };
};
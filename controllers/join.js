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
                res.render("join", getViewData("Join", "join"));
            }
        },
        post: function (req, res) {
            var async = require("async");
            var bcrypt = require("bcrypt-nodejs");
            var pg = require("pg");

            var post = req.body;

            //TODO: add some data validation: email, password format, string length, SQL sanitize
            if (!areFieldsSet(post) && post.register !== "register") {
                res.render("join", getViewData("Join", "join", req.session.userID, req.session.userEmail, "Error: user registration failed"));
            }
            else {
                var asyncStatus = [];
                var client = new pg.Client(config.DATABASE_URL);

                async.waterfall([
                        function (callback) {
                            asyncStatus.push("connect");
                            client.connect(callback);
                        },
                        function (client, callback) {
                            asyncStatus.push("client - insert");
                            client.query("INSERT INTO users (id, username, email, secret, registration_ip, registration_timestamp) VALUES (DEFAULT, $1, $2, $3, $4, DEFAULT)", [post.user, post.email, bcrypt.hashSync(post.password), getClientIp(req)], callback);
                        },
                        function (result, callback) {
                            asyncStatus.push("successful registration");
                            console.log("Registration worked for", post.user);
                            // TODO: send the confirmation email, also set a variable for confirmed=false
                            req.session.userID = post.user;
                            req.session.userEmail = post.email;
                            callback(null);
                        }
                    ],
                    function (err) {
                        client.end();
                        console.log("Async status", asyncStatus);

                        if (err) {
                            console.log("ERROR ON REGISTRATION:", err);
                            res.render("join", getViewData("Join", "join", null, "Error: user registration failed"));
                        }
                        else {
                            res.redirect("journal");
                        }
                    }
                );
            }
        }
    };
};
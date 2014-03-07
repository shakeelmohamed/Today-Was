function getTimeSinceNowStr(start){
        var end = new Date();
    var duration = end - start;     
    var msg;
    
        var years = Math.floor(duration / (1000 * 60 * 60 * 24 * 30 * 12));
        var months = Math.floor(duration / (1000 * 60 * 60 * 24 * 30));
    var days = Math.floor(duration / (1000 * 60 * 60 * 24));
    var hours = Math.floor(duration / (1000 * 60 * 60));
    var mins = Math.floor(duration / (1000 * 60));
    var secs = Math.floor(duration / (1000));
    
    // Get a string that represents how much time has passed
    if (secs > 0) {
        msg = secs + " Second" + (secs > 1 ? "s" : "");
        if (mins > 0) {
            msg = mins + " Minute" + (mins > 1 ? "s" : "");
            if(hours > 0) {
                msg = hours + " Hour" + (hours > 1 ? "s" : "");
                if(days >  0) {
                    msg = days + " Day" + (days > 1 ? "s" : "");
                                if(months > 0) {
                                    msg = months + " Month" + (months > 1 ? "s" : "");
                                    if(years > 0) {
                                            msg = years + " Year" + (years > 1 ? "s": "");
                                    }
                                }
                }
            }
        }
    }
    else {
        return "Just Now"; //Don't append ago
    }
    return msg + " ago.";
}

function parseTime(input){
    input = input.replace(/Date(.)*?/, /$1/);
    input = input.replace(/(\(|\))?/g, "");
    input = input.replace(/(\/|\\)?/g, "");
    input = new Date(parseInt(input));
    return input;
}

function fixMonth(input){ //Where input is the month indexed from 0 to 11
    input++;
    switch(input){
        case 1:
            return 'Jan';
        case 2:
            return 'Feb';
        case 3:
            return 'Mar';
        case 4:
            return 'Apr';
        case 5:
            return 'May';
        case 6:
            return 'Jun';
        case 7:
            return 'Jul';
        case 8:
            return 'Aug';
        case 9:
            return 'Sep';
        case 10:
            return 'Oct';
        case 11:
            return 'Nov';
        case 12:
            return 'Dec';
    }
}

function fixTime(hrs, mins){ //Formats hours & mins properly
    if(hrs >= 12)
        return hrs-12+":"+mins+" pm";
    if(hrs==0)
        hrs = 12;
    return hrs+":"+mins+" am";
}

module.exports = function (getViewData, config) {
    return {
        get: function (req, res) {
            var pg = require("pg");
            var async = require("async");


            var viewData = getViewData("Account", "account", req.session.userID);

            pg.connect(config.DATABASE_URL, function (err, client) {
                if (err) {
                    return console.error("could not connect to postgres", err);
                }
                async.waterfall([
                        function (callback) {
                            //EXTRACT(epoch from (select registration_timestamp from users
                            //"select user_ratings.entry, ratings.label, user_ratings.created_date, user_ratings.edited_date from user_ratings join ratings on user_ratings.id_ratings = ratings.id order by user_ratings.created_date DESC"
                            //select user_ratings.entry, ratings.label, user_ratings.created_date, user_ratings.edited_date from user_ratings  join ratings on user_ratings.id_ratings = ratings.id where user_ratings.id_users = $1 order by user_ratings.created_date DESC
                            client.query("select user_ratings.entry, ratings.label, EXTRACT(epoch from user_ratings.created_date) as created_date from user_ratings join ratings on user_ratings.id_ratings = ratings.id where user_ratings.id_users = (select users.id from users where users.username=$1) order by user_ratings.created_date DESC", [req.session.userID], callback);
                        },
                        function (result, callback) {
                            if (!result || !result.rows || result.rows.length === 0) {
                                //TODO: learn more about each of these cases, and why they occur
                                //      at least one of these is due to post.user being an invalid user
                                callback(true);
                            }
                            else {
                                var rows = result.rows;
                                for (var r in rows) {
                                    rows[r].created_date = (new Date(rows[r].created_date * 1000)).toLocaleDateString();
                                }
                                viewData.entries = rows;
                                res.render("account", viewData);
                            }
                        }
                    ],
                    function (err) {
                        if (err || err === true) {
                            console.error(err);
                            res.render("account", viewData);
                        }
                    }
                );
            });
        }
    };
};
exports.init = function (app) {
    var controllers = require("../controllers")(getViewData, app.locals);
    
    // Lovely controller routing
    app.get("/", controllers.home.get);

    app.get("/404", controllers._404.get);

    app.get("/signout", controllers.signout.get);

    app.get("/signin", controllers.signin.get);
    app.post("/signin", controllers.signin.post);

    app.get("/join", controllers.join.get);
    app.post("/join", controllers.join.post);

    app.get("/about", controllers.about.get);

    // Pass in middleware for pages that require a user to be logged in
    app.get("/journal", isUserLoggedIn, controllers.journal.get); //TODO: rename

    app.post("/entries", isUserLoggedIn, controllers.entries.post);

    app.post("/feed", controllers.feed.post);

    function getViewData(title, pathSuffix, userID, email, message) {
        // Set app.locals in web.js; this function gets passed around to all controllers
        return {
            siteName: app.locals.siteName,
            author: app.locals.siteAuthor,
            title: title,
            feedbackForm: app.locals.feedbackForm,
            loc: pathSuffix,
            user: userID,
            userEmail: email,
            msg: message
        };
    }

    function isUserLoggedIn(req, res, next) {
        if (!req.session.userID) {
            //Send user to the login page if they're not authorized
            res.redirect("signin");
        }
        else {
            next();
        }
    }
};
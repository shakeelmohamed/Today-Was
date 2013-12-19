exports.init = function (app) {
    var pg = require('pg'),
    jade = require('jade'),
    bcrypt = require('bcrypt-nodejs');

    /** Static pages **/
    app.get('/', function (req, res) {
        res.render('index', {title: 'Home', loc: 'home', user: req.session.user_id});
    });
    app.get('/about', function (req, res) {
        res.render('about', {title: 'About', loc: 'about', user: req.session.user_id});
    });

    app.get('/login', function (req, res) {
        if (req.session.user_id) {
            //Send user to the journal page if they're authorized
            //TODO: make this a middleware function for code reuse
            res.redirect('journal');
        }
        else {
            res.render('login', {title: 'Login', loc: 'login', user: req.session.user_id});
        }
    });

    app.post('/login', function (req, res) {
        var post = req.body;

        //TODO: add some data validation: email, password format, string length, sql sanitize
        pg.connect(process.env.DATABASE_URL, function (err, client) {
            if (err) {
                return console.error('could not connect to postgres', err);
            }
            if(post.login == 'login')
            {
                client.query("SELECT * from subject where nicename='"+post.user+"'", function (err, result) {
                    if (err || result.rows.length === 0) {
                        res.render('login', {title: 'Login', loc: 'login', msg: 'Error: login failed'});
                        client.end();
                    }
                    else {
                        if ( bcrypt.compareSync(post.password, result.rows[0].secret) ) {
                            req.session.user_id = post.user;
                            res.redirect('/journal');
                        }
                        else {
                            res.render('login', {title: 'Login', loc: 'login', msg: 'Error: login failed'});
                        }
                        client.end();
                    }
                });
            }
            else {
                res.render('login', {title: 'Login', loc: 'login', msg: 'Error: login failed, unexpected form data'});
            }
        });
    });

    app.get('/join', function (req, res) {
        if (req.session.user_id) {
            //Send user to the journal page if they're authorized
            res.redirect('journal');
        }
        else {
            res.render('join', {title: 'Join', loc: 'join', user: req.session.user_id});
        }
    });

    app.post('/join', function (req, res) {
        var post = req.body;
        //TODO: add some data validation: email, password format, string length, sql sanitize
        pg.connect(process.env.DATABASE_URL, function (err, client) {
            if (err) {
                return console.error('could not connect to postgres', err);
            }
            if(post.register == 'register')
            {
                //TODO: handle registration processs, sanitize before doing the insert.
                //TODO: insert query must be run asynch, to get the callback for errors like non-unique values, etc.
                client.query("insert into subject (subjectid, nicename, email, secret) values (DEFAULT, '"+post.user+"', '"+post.email+"', '"+bcrypt.hashSync(post.password)+"')", function (err, result) {
                    if (err) {
                        console.log("ERROR ON REGISTRATION: "+err);
                    }
                    else {
                        console.log("I think registration worked.");
                        res.redirect('join');
                    }
                });
            }
            else {
                res.render('join', {title: 'Join', loc: 'join', msg: 'Error: login failed, unexpected form data'});
            }
        });
    });

    app.get('/logout', function (req, res) {
        delete req.session.user_id;
        res.redirect('/login');
    });

    /**Function to check if a user is logged in**/
    function checkAuth(req, res, next) {
        if (!req.session.user_id) {
            //Send user to the login page if they're not authorized
            res.redirect('login');
        }
        else {
            next();
        }
    }

    //TODO: implement, and/or merge with checkAuth
    function skipAuth(req, res, next) {
        //The goal of this function is to send the user to the journal page if they're logged in already
        if(req.session.user_id) {
            //TODO: This will do a double redirect back to journal, inefficient
            res.redirect('join');
        }
    }

    /**Pages that require user to be logged in**/
    app.get('/journal', checkAuth, function(req, res){
        //res.send('TODO: this is a journal page for '+ req.session.user_id);
        res.render('journal', {title: 'Journal', loc: 'journal', user: req.session.user_id});
    });
};
exports.init = function (app) {
    var pg = require('pg'),
    jade = require('jade'),
    bcrypt = require('bcrypt-nodejs');

    app.get('/', function (req, res) {
        res.render('index', {title: 'Home', loc: 'home', user: req.session.user_id});
    });

    app.get('/about', function (req, res) {
        res.render('about', {title: 'About', loc: 'about', user: req.session.user_id});
    });


    app.get('/login', function (req, res) {
        res.render('login', {title: 'Login', loc: 'login', user: req.session.user_id});
    });

    app.post('/login', function (req, res) {
        var post = req.body;

        pg.connect(process.env.DATABASE_URL, function (err, client) {
            if (err) {
                return console.error('could not connect to postgres', err);
            }
            client.query("SELECT * from subject where nicename='"+post.user+"'", function (err, result) {
                if (err || result.rows.length == 0) {
                    res.render('login', {title: 'Login', loc: 'login', msg: 'Error: login failed'});
                    client.end();
                }
                else {
                    //TODO: remove the sync function from the db result, it should already be hashed
                    //if ( bcrypt.compareSync( bcrypt.hashSync(result.rows[0]['secret']), bcrypt.hashSync(post.password) ) ) {
                    if(post.password == result.rows[0]['secret']) {
                        req.session.user_id = post.user;
                        res.redirect('/journal');
                    } else {
                        res.render('login', {title: 'Login', loc: 'login', msg: 'Error: login failed'});
                    }
                }
                client.end();
            });
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

    /**Pages that require user to be logged in**/
    app.get('/journal', checkAuth, function(req, res){
        //res.send('TODO: this is a journal page for '+ req.session.user_id);
        res.render('journal', {title: 'Journal', loc: 'journal', user: req.session.user_id});
    });
};
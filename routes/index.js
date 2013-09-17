exports.init = function (app) {
    var pg = require('pg'),
    jade = require('jade');

    app.get('/', function (req, res) {
        res.render('index', {title: 'Home', loc: ''});
    });

    app.get('/about', function (req, res) {
        res.render('about', {title: 'About', loc: 'about'});
    });

    app.get('/pg', function (request, response, done){
        pg.connect(process.env.DATABASE_URL, function (err, client) {
            if (err) {
                return console.error('could not connect to postgres', err);
            }
            client.query('SELECT * FROM subject ORDER BY subjectid DESC limit 10', function (err, result) {
                if (err) {
                    return console.error('error running query', err);
                }
                var tenNewestUsers = [];
                for (var x in result.rows) {
                    tenNewestUsers.push({
                        nicename: result.rows[x]['nicename']
                    });
                }

                response.render('pg', {title: 'Postgres test', users: JSON.stringify(tenNewestUsers)});
                done();
            });
        });
    });
};
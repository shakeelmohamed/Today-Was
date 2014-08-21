var pg = require("pg");
var async = require("async");
var fs = require("fs");

function getEnvironmentVariables(filepath, existingVariables) {
    var vars = {};

    // Copy over existing variables
    for (var key in existingVariables) {
        vars[key] = existingVariables[key];
    }
    if (fs.existsSync(filepath)) {
        var fileOfVariables = fs.readFileSync(filepath, "utf8").split("\n");
        
        // For every line in the .env file, parse out the key-value pairs
        // and add them to the vars object.
        fileOfVariables.forEach(function (variable) {
            var key = variable.substring(0, variable.indexOf("="));
            var value = variable.substring(variable.indexOf("=") + 1);
            if (key && value) {
                vars[key.replace(" ", "")] = value;
            }
        });
    }
    else {
        console.log("ERROR", filepath, "not found");
        // This should only happen on Travis CI
        if (process.env.DATABASE_URL) {
            vars.DATABASE_URL = process.env.DATABASE_URL;
        }
    }
    
    return vars;
}

module.exports = function (grunt) {
    var packageFile = grunt.file.readJSON("package.json");
    
    grunt.initConfig({
        pkg: packageFile,
        jshint: {
            all: [
                "Gruntfile.js",
                "app.js",
                "config.js",
                "controllers/*.js",
                "controllers/validators/*.js",
                "public/js/egress-*.js",
                "routes/*.js",
                "test/*.js"
            ],
            options: packageFile.jshintConfig
        },
        jade: {
            "temp/jade": ["jade/*.jade", "jade/*/*.jade"]
        },
        clean: {
            jade: "temp" // Remove the temp directory containing the compiled jade file from above
        }
    });
    
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-jade");
    grunt.loadNpmTasks("grunt-contrib-clean");

    grunt.registerTask("default", ["jshint", "jade", "clean"]);

    grunt.registerTask("postgres:init", "Used to run any SQL scripts for a Postgres database.", function () {
        var callback = this.async();
        // TODO: check that the tables already exist before creating them...

        var config = require("./config");
        config = getEnvironmentVariables(".env", config);

        var scripts = {
            create: fs.readFileSync("databases/create-tables.sql", "utf8"),
            functions: fs.readFileSync("databases/functions.sql", "utf8"),
            init: fs.readFileSync("databases/init-tables.sql", "utf8")
        };

        if (!config.DATABASE_URL) {
            grunt.fail.fatal("The DATABASE_URL environment variable was not set. Found the following config object:\n" + JSON.stringify(config, null, 4));
            callback(false);
        }
        else {
            // TODO: check that tables exist with a query like so: var checkTableQuery = "select * from information_schema.tables where table_name='users'";
            var client = new pg.Client(config.DATABASE_URL);
            async.waterfall([
                    function (done) {
                        client.connect(done);
                    },
                    function (client, done) {
                        console.log("Running create scripts");
                        client.query(scripts.create, done);
                    },
                    function (result, done) {
                        console.log("Running init scripts");
                        client.query(scripts.init, done);
                    },
                    function (result, done) {
                        console.log("Running functions scripts");
                        client.query(scripts.functions, done);
                    },
                    function (result, done) {
                        console.log("All done.");
                        done();
                    }
                ],
                function (err) {
                    if (err) {
                        grunt.fail.warn("Found an error:" + err);
                    }
                    callback(err ? false : null);
                }
            );
        }
    });

    grunt.registerTask("dist", ["postgres:init"]); // When deploying, run the PG scripts.
};
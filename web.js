var express = require("express");
var jade = require('jade');

var app = express();
app.configure(function(){
	app.use(express.logger());
	app.use(express.static(__dirname + '/public'));
});

app.get('/', function(request, response) {
  response.send(jade.renderFile('index.jade'));
});

app.get('/about', function(request, response){
	response.send(jade.renderFile('about.jade'));
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
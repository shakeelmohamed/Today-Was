var express = require("express");
var jade = require('jade');

var app = express();
app.configure(function(){
	app.use(express.logger());
	app.use(express.static(__dirname + '/public'));
});

var html = jade.renderFile('index.jade');


app.get('/', function(request, response) {
  response.send(html);
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
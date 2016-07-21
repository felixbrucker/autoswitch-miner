'use strict';
global.__basedir = __dirname + '/';
var express = require('express');
var bodyParser = require('body-parser');
var colors = require('colors/safe');
var app = express();

app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb'
}));
app.use(bodyParser.json({
  limit: '50mb'
}));

app.use(express.static(__dirname + '/app'));

require(__basedir + 'api/routes')(app);

// wildcard route to get angular app loaded before angular takes over client-side routing
app.route('*').get(function(req, res) {
  res.sendFile('index.html', {
    root: './'
  });
});



var listener = app.listen(8080, function(){
  console.log(colors.green('server running: http://' + listener.address().address+':'+listener.address().port)); //Listening on port 8888
});
/// <reference path="typings/index.d.ts" />
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var ioRequests = require('./ioRequests');

///// Routing /////
app.use('/', express.static(__dirname + '/client'));
app.use('/uploads', express.static(__dirname + '/uploads'));

// To overwrite the routing you can do the following
// app.get('/', function(req, res){
//   res.sendFile(__dirname + '/client/chat.html');
// });

//// API Stuff ////
require("./api")(app);

//// Socket.io ////
io.on('connection', function(socket){
  console.log("Client: " + socket.request.headers['x-forwarded-for'] + " has connected");
  // Pass on request
  ioRequests.routes(socket, io);
});

// Start Server ///
var port : number = 8080;
var ip : string = "0.0.0.0";
http.listen(port, ip, function() {
  console.log('listening on ' + ip + ':' + port);
});

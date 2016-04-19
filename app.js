var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//// API Stuff ////
require("./api")(app);



// io.on('connection', function(socket){
//   socket.on('chat message', function(msg){
//     io.emit('chat message', msg);
//   });
// });

var port = process.env.PORT || 8080;
var ip = process.env.IP || "0.0.0.0"
http.listen(port, ip, function() {
  console.log('listening on ' + ip + ':' + port);
});

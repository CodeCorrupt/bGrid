var db = require("./framework");

module.exports.routes = function (socket, io) {
  // Chat example stuff
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  // Return a job.
  socket.on('get_job', function() {
    // Get next job
    var res = "";
    db.Job.findOne({"dispatch" : "true"}, function (err, obj) {
      if (err) {
        console.log(err);
        res = {"success":"0", "cause":"Error when getting job from db"};
        socket.emit('get_job_res', res);
      }
      else if (!obj) {
        console.log("No object found in DB");
        res = {"success":"0", "cause":"No object found in DB"};
        socket.emit('get_job_res', res);
      }
      else {
        obj.sent();
        obj.save(function(err) {
          if (err) {
            console.log(err);
            res = {"success":"0", "cause":"Could not save updated object"};
            socket.emit('get_job_res', res);
          }
          else {
            console.log('Job retrived and updated!');
            // Convert to JSON object so I can add the success key and then send
            res = obj.toJSON();
            res.success = "1";
            socket.emit('get_job_res', res);
          }
        });
      }
    });
  });

  socket.on('job_return', function(msg) {
    db.Job.findById(msg.id, function(err, obj) {
      if (err) {
        var res = {"success":"0", "cause":"Error finding by id"};
        socket.emit('job_return_res', res);
      }
      else {
        obj.returned(msg.retValue);
        obj.save(function(err) {
          if (err) {
            var res = {"success":"0", "cause":"Could not save updated obj"};
            socket.emit('job_return_res', res);
          }
          else {
            var res = {"success":"1"};
            socket.emit('job_return_res', res);
          }
        });
      }
    });
  })
};
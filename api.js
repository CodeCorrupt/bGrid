var bodyParser = require('body-parser')
// Require Job framework
var db = require("./framework");


module.exports = function(app) {
  // configure app to use bodyParser()
  // this will let us get the data from a POST
  app.use(bodyParser.json());

  app.get('/api/ping', function(req, res) {
    res.json({
      'message': 'pong'
    })
  })

  app.post('/api/echo', function(req, res) {
    // Get a job from the client
    res.json(req.body);
  });

  // API call to look at next job from db
  app.get('/api/jobs/show', function(req, res) {
    // Get next job
    db.Job.findOne({"dispatch" : "true"}, function (err, obj){
      if (err) {
        console.log(err);
        res.json({"success":"0", "cause":"Error when getting job from db"})
      }
      else if (!obj) {
        console.log("No object found in DB");
        res.json({"success":"0", "cause":"No object found in DB"})
      }
      else {
        console.log('Job retrived!');
        // Convert to JSON object so I can add the success key and then send
        var jObj = obj.toJSON();
        jObj.success = "1";
        res.json(jObj);
      }
    });
  });

  // API call to remove a job from db
  app.get('/api/jobs/remove', function(req, res) {
    // Get next job
    db.Job.findOne({}, function (err, obj){
      if (err) {
        console.log(err);
        res.json({"success":"0", "cause":"Error when getting job from db"})
      }
      else if (!obj) {
        console.log("No object found in DB");
        res.json({"success":"0", "cause":"No object found in DB"})
      }
      else {
        // Dequeue the job
        obj.remove(function(err) {
          if (err) {
            console.log(err);
            res.json({"success":"0", "cause":"Error when dequeueing job in db"})
          }
          else {
            console.log("Sucessfully dequeued job");
            // Convert to JSON object so I can add the success key and then send
            var jObj = obj.toJSON();
            jObj.success = "1";
            res.json(jObj);
          }
        });
      }
    });
  });

  // API call to send client all jobs
  app.get('/api/jobs/show_all', function(req, res) {
    // Get next job
    db.Job.find({}, function (err, obj){
      if (err) {
        console.log(err);
        res.json({"success":"0", "cause":"Error when getting jobs from db"})
      }
      else if (obj.length == 0) {
        console.log("No object found in DB");
        res.json({"success":"0", "cause":"No objects found in DB"})
      }
      else {
        res.json(obj);
      }
    });
  });

  // API call to send a job from db to the client
  app.get('/api/jobs/get', function(req, res) {
    // Get next job
    db.Job.findOne({"dispatch" : "true"}, function (err, obj){
      if (err) {
        console.log(err);
        res.json({"success":"0", "cause":"Error when getting job from db"})
      }
      else if (!obj) {
        console.log("No object found in DB");
        res.json({"success":"0", "cause":"No object found in DB"})
      }
      else {
        obj.sent();
        obj.save(function(err) {
          if (err) {
            console.log(err);
            res.json({"success":"0", "cause":"Could not save updated object"})
          }
          else {
            console.log('Job retrived and updated!');
            // Convert to JSON object so I can add the success key and then send
            var jObj = obj.toJSON();
            jObj.success = "1";
            res.json(jObj);
          }
        });
      }
    });
  });

  // API call to save a job posted by a client
  app.post('/api/jobs/send', function(req, res) {
    // Validate the job has all required parts
    if (!req.body.hasOwnProperty("code")) {
      res.json({"success": "0", "cause" : "Missing \"code\" property"});
    }
    else if (!req.body.hasOwnProperty("author")) {
      res.json({"success": "0", "cause" : "Missing \"author\" property"});
    }
    else if (!req.body.hasOwnProperty("name")) {
      res.json({"success": "0", "cause" : "Missing \"name\" property"});
    }
    else if (!req.body.hasOwnProperty("numRedundancy")) {
      res.json({"success": "0", "cause" : "Missing \"numRedundancy\" property"});
    }
    else if (!req.body.hasOwnProperty("dispatch")) {
      res.json({"success": "0", "cause" : "Missing \"dispatch\" property"});
    }
    // Creade the job object
    else {
      var newJob = db.Job({
        name: req.body.name,
        author: req.body.author,
        code: req.body.code,
        numRedundancy: req.body.numRedundancy,
        dispatch: req.body.ispatch
      });
      // save the job
      newJob.save(function(err) {
        if (err) {
          console.log(err);
          res.json({"success":"0", "cause":"Error when saving job to db"})
        }
        else {
          console.log('Job created!');
          res.json({"success": "1"});
        }
      });
    }
  });
};
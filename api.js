var bodyParser = require('body-parser')
// Require Job framework
var Job = require("./framework");


module.exports = function(app) {
  // configure app to use bodyParser()
  // this will let us get the data from a POST
  app.use(bodyParser.json());
  
  app.get('/api/ping', function(req, res) {
    res.json({
      'res': 'pong'
    })
  })
  
  app.post('/api/echo', function(req, res) {
    // Get a job from the client
    res.json(req.body);
  });
  
  // API call to send a job from db to the client
  app.get('/api/jobs/dequeue', function(req, res) {
    // Get next job
    Job.findOne({}, function (err, obj){
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
  
  // Peek at next job
  app.post('/api/jobs/peek', function(req, res) {
    // Get next job
    Job.findOne({}, function (err, obj){
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
        // Dequeue the job
        console.log("Sucessfully peeked at job");
        // Convert to JSON object so I can add the success key and then send
        var jObj = obj.toJSON();
        jObj.success = "1";
        res.json(jObj);
      }
    });
  });
  
  // API call to save a job posted by a client
  app.post('/api/jobs/enqueue', function(req, res) {
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
    // Creade the job object
    else {
      var newJob = Job({
        name: req.body.name,
        author: req.body.author,
        code: req.body.code,
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
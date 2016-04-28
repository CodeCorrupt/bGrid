var bodyParser = require('body-parser')
// Require Job framework
var db = require("./framework");


module.exports = function(app) {
  // configure app to use bodyParser()
  // this will let us get the data from a POST
  app.use(bodyParser.json());

  // API call to ping the server, ensure it's running
  app.get('/api/ping', function(req, res) {
    res.json({
      'message': 'pong'
    })
  })

  /************************************
   * Stuff for Jobs
   ***********************************/
  // API call to show all jobs in db
  app.get('/api/jobs/show_all', function(req, res) {
    // Get next job
    db.Job.find({}, function (err, obj){
      if (err) {
        console.log(err);
        res.json({"success":"0", "cause":"Error when getting jobs from db"})
      }
      else if (obj.length == 0) {
        res.json({"success":"0", "cause":"No objects found in DB"})
      }
      else {
        res.json(obj);
      }
    });
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
        res.json({"success":"0", "cause":"No object found in DB"})
      }
      else {
        // Convert to JSON object so I can add the success key and then send
        var jObj = obj.toJSON();
        jObj.success = "1";
        res.json(jObj);
      }
    });
  });

  // API call to remove a job from db
  app.delete('/api/jobs/remove', function(req, res) {
    // Get next job
    db.Job.findOne({}, function (err, obj){
      if (err) {
        console.log(err);
        res.json({"success":"0", "cause":"Error when getting job from db"})
      }
      else if (!obj) {
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
            // Convert to JSON object so I can add the success key and then send
            var jObj = obj.toJSON();
            jObj.success = "1";
            res.json(jObj);
          }
        });
      }
    });
  });

  // API call to get a job from db
  app.get('/api/jobs/get', function(req, res) {
    // Get next job
    db.Job.findOne({"dispatch" : "true"}, function (err, obj){
      if (err) {
        console.log(err);
        res.json({"success":"0", "cause":"Error when getting job from db"})
      }
      else if (!obj) {
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
            // Convert to JSON object so I can add the success key and then send
            var jObj = obj.toJSON();
            jObj.success = "1";
            res.json(jObj);
          }
        });
      }
    });
  });

  // API call to send a job to db
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
      // If requested specific number of instances then count
      var numInstances = 1;
      if (req.body.hasOwnProperty("numInstances")) {
        if (req.body.numInstances >= 1) {     // Also ensure that it's a num
          numInstances = req.body.numInstances;
        }
      }

      // We want to create one job per instance
      // Need a semaphore to make sure everything is a success
      var semaphore = 0;
      var successCount = 0;
      for (var i = 1; i <= numInstances; i++) {
        var newJob = db.Job({
          name:           req.body.name,
          author:         req.body.author,
          code:           req.body.code,
          numInstances:   numInstances,
          instanceNum:    i,
          numRedundancy:  req.body.numRedundancy,
          dispatch:       req.body.ispatch
        });
        // Process the new job (Replace the things)
        newJob.process();
        // save the job
        semaphore++;
        newJob.save(function(err) {
          if (err) {
            console.log(err);
            semaphore--;
          }
          else {
            successCount++;
            semaphore--;
          }
          // If this perticular call back was the last one, then return
          if (semaphore == 0) {
            // If success count is not the same as the numInstances
            if (successCount != numInstances) {
              console.log('Error creating job(s)');
              res.json({"success":"0", "cause":"Error when saving job(s) to db"})
            }
            else {
              res.json({"success": "1"});
            }
          }
        });
      } // End of for loop
    }
  });
};

function isJSON (something) {
    if (typeof something != 'string')
        something = JSON.stringify(something);

    try {
        JSON.parse(something);
        return true;
    } catch (e) {
        return false;
    }
}
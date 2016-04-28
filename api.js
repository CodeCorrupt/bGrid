var bodyParser = require('body-parser')
// Require Job framework
var db = require("./framework");

var fs = require('fs');
var busboy = require('connect-busboy');
var crypto = require('crypto');


module.exports = function(app) {
  // configure app to use bodyParser()
  // parse application/json
  app.use(bodyParser.json())
  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }))

  app.use(busboy());

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

  // API call to upload job file
  app.post('/api/jobs/upload', function(req, res) {
    var values = {};
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
      values.file = __dirname + '/uploads/' + randomValueBase64(8) + ".js"; // TODO: Instead of random, make this hash of file
      console.log("Uploading: " + filename + " as:");
      console.log("     " + values.file);
      fstream = fs.createWriteStream(values.file);
      file.pipe(fstream);
    });
    // Parse all fields into json object values
    req.busboy.on('field', function(fieldname, val) {
      values[fieldname] = val;
    });
    // When all is parsed (finished)
    req.busboy.on('finish', function() {
      // Change checkbox value to t/f instead of on off
      values.dispatch = (values.dispatch == "on") ? true : false;
      // Validate the job has all required parts
      if (!values.hasOwnProperty("file")) {
        res.json({"success": "0", "cause" : "Missing \"file\" property"});
      }
      else if (!values.hasOwnProperty("author")) {
        res.json({"success": "0", "cause" : "Missing \"author\" property"});
      }
      else if (!values.hasOwnProperty("name")) {
        res.json({"success": "0", "cause" : "Missing \"name\" property"});
      }
      else if (!values.hasOwnProperty("numRedundancy")) {
        res.json({"success": "0", "cause" : "Missing \"numRedundancy\" property"});
      }
      else if (!values.hasOwnProperty("dispatch")) {
        res.json({"success": "0", "cause" : "Missing \"dispatch\" property"});
      }
      // Creade the job object
      else {
        // If requested specific number of instances then count
        var numInstances = 1;
        if (values.hasOwnProperty("numInstances")) {
          if (values.numInstances >= 1) {     // Also ensures that it's a num
            numInstances = values.numInstances;
          }
        }

        // We want to create one job per instance
        // Need a semaphore to make sure everything is a success
        var semaphore = 0;
        var successCount = 0;
        for (var i = 1; i <= numInstances; i++) {
          var newJob = db.Job({
            name:           values.name,
            author:         values.author,
            file:           values.file,
            numInstances:   numInstances,
            instanceNum:    i,
            numRedundancy:  values.numRedundancy,
            dispatch:       values.ispatch
          });
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
                //res.json({"success": "1"});
                res.redirect('back'); //TODO: Make this redirect somewhere uselful
              }
            }
          });
        } // End of for loop
      }
    });
  });

  /************************************
   * Stuff for Data
   ***********************************/

  // API Call to submit Data for user
  app.post('/api/data/send', function(req, res) {
    if (!req.body.hasOwnProperty("forUser")) {
      res.json({"success": "0", "cause" : "Missing \"forUser\" property"});
    }
    else if (!req.body.hasOwnProperty("forJob")) {
      res.json({"success": "0", "cause" : "Missing \"forJob\" property"});
    }
    else if (!req.body.hasOwnProperty("forInstance")) {
      res.json({"success": "0", "cause" : "Missing \"forInstance\" property"});
    }
    else if (!req.body.hasOwnProperty("data")) {
      res.json({"success": "0", "cause" : "Missing \"data\" property"});
    }
    else {
      if (!isJSON(req.body.data)) {
        res.json({"success": "0", "cause" : "data is not JSON"});
      }
      else {
        var stringyJSON = JSON.stringify(req.body.data);
        var objJSON = JSON.parse(stringyJSON);

        var newUserData = new db.UserData({
          forUser:      req.body.forUser,
          forJob:       req.body.forJob,
          forInstance:  req.body.forInstance,
          data:         objJSON
        });
        newUserData.save(function(err) {
          if (err) {
            console.log(err);
            res.json({"success": "0", "cause" : "newUserData could not be saved to DB"});
          }
          else {
            res.json({"success": "1"});
          }
        });
      }
    }
  });

  // API Call to get data from db
  app.get('/api/data/get', function(req, res) {
    if (!req.query.hasOwnProperty("forUser")) {
      res.json({"success": "0", "cause" : "Missing \"forUser\" property"});
    }
    else if (!req.query.hasOwnProperty("forJob")) {
      res.json({"success": "0", "cause" : "Missing \"forJob\" property"});
    }
    else if (!req.query.hasOwnProperty("forInstance")) {
      res.json({"success": "0", "cause" : "Missing \"forInstance\" property"});
    }
    else {
      db.UserData.findOne({
        "forUser"     : req.query.forUser,
        "forJob"      : req.query.forJob,
        "forInstance" : req.query.forInstance
      }, function (err, obj){
        if (err) {
          console.log(err);
          res.json({"success": "0", "cause" : "Error finding data in DB"});
        }
        else if (!obj) {
          res.json({"success":"0", "cause":"No object found in DB"});
        }
        else if (!obj.data) {
          res.json({"success":"0", "cause":"Object had no data"});
        }
        else {
          res.json(obj.data);
        }
      });
    }
  });

  // API Call to remove data
  app.delete('/api/data/remove', function(req, res) {
    if (!req.query.hasOwnProperty("forUser")) {
      res.json({"success": "0", "cause" : "Missing \"forUser\" property"});
    }
    else if (!req.query.hasOwnProperty("forJob")) {
      res.json({"success": "0", "cause" : "Missing \"forJob\" property"});
    }
    else if (!req.query.hasOwnProperty("forInstance")) {
      res.json({"success": "0", "cause" : "Missing \"forInstance\" property"});
    }
    else {
      db.UserData.findOne({
        "forUser"     : req.query.forUser,
        "forJob"      : req.query.forJob,
        "forInstance" : req.query.forInstance
      }, function (err, obj){
        if (err) {
          console.log(err);
          res.json({"success": "0", "cause" : "Error finding data in DB"});
        }
        else if (!obj) {
          res.json({"success":"0", "cause":"No object found in DB"})
        }
        else {
          obj.remove(function(err) {
            if (err) {
              console.log(err);
              res.json({"success": "0", "cause" : "Error removing data"});
            }
            else {
              res.json({"success" : "1"});
            }
          });
        }
      });
    }
  });
};

// Ensures whatever you give it is JSON
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

// Generate a random base64 string of given length
function randomValueBase64 (len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
        .toString('base64')   // convert to base64 format
        .slice(0, len)        // return required number of characters
        .replace(/\+/g, '0')  // replace '+' with '0'
        .replace(/\//g, '0'); // replace '/' with '0'
}
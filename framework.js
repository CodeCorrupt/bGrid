var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var connected = false;

mongoose.connect('mongodb://localhost/bgrid');

mongoose.connection.on('open', function(ref) {
  connected = true;
  console.log('open connection to mongo server.');
});

mongoose.connection.on('connected', function(ref) {
  connected = true;
  console.log('connected to mongo server.');
});

mongoose.connection.on('disconnected', function(ref) {
  connected = false;
  console.log('disconnected from mongo server.');
});

mongoose.connection.on('close', function(ref) {
  connected = false;
  console.log('close connection to mongo server');
});

mongoose.connection.on('error', function(err) {
  connected = false;
  console.log('error connection to mongo server!');
  console.log(err);
});

mongoose.connection.db.on('reconnect', function(ref) {
  connected = true;
  console.log('reconnect to mongo server.');
});


//Schemas
var jobSchema = new Schema({
  name:           String,
  author:         String,
  code:           String,
  returnValue:    [String],
  numStarted: {               // Number of clientes that have started
    type:         Number,
    default:      0
  },
  numFinished: {              // Number of clientes to return a result
    type:         Number,
    default:      0
  },
  numRedundancy: {            // Number of duplicates to run
    type:         Number,
    default:      1
  },
  dispatch: {
    type:         Boolean,
    default:      true
  },
  submitted: {
    type:         Date,
    default:      Date.now
  }
});

//Metods
jobSchema.methods.sent = function() {
  this.numStarted++;
  this.dispatch = this.numStarted < this.numRedundancy;
}

jobSchema.methods.returned = function(value) {
  this.returnValue.push(value);
  this.numFinished++;
}

//  This takes the jobSchema and creates a collection/model in mongodb named 'jobs'
var Job = mongoose.model('jobs', jobSchema);

// make this available publically
module.exports.Job = Job;
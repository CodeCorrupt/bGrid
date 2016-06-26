/// <reference path="typings/index.d.ts" />
import * as mongoose from 'mongoose';

// Constants
const host = process.env.MONGO_HOST || "localhost";
const port = process.env.MONGO_PORT || "27017";
const dbname = process.env.MONGO_DBNAME || "bgrid";

var connected : boolean = false;

mongoose.connect('mongodb://' + host + "/" + dbname + ":" + port);

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
var jobSchema = new mongoose.Schema({
  author:         String,
  name:           String,
  file:          String,
  returnValue:    [String],
  dispatch: {
    type:         Boolean,
    default:      true
  },
  numInstances: {
    type:         Number,
    default:      1
  },
  instanceNum: {
    type:         Number,
    default:      1
  },
  numRedundancy: {            // Number of duplicates to run
    type:         Number,
    default:      1
  },
  numStarted: {               // Number of clientes that have started
    type:         Number,
    default:      0
  },
  numFinished: {              // Number of clientes to return a result
    type:         Number,
    default:      0
  },
  submitted: {
    type:         Date,
    default:      Date.now
  }
});
jobSchema.index({"author" : 1, "name" : 1, "instanceNum" : 1}, { "unique" : true });

var userDataSchema = new mongoose.Schema({
  forUser:      String,
  forJob:         String,
  forInstance:    Number,
  data:           JSON        // JSON String
});
userDataSchema.index({"forUser" : 1, "forJob" : 1, "forInstance" : 1}, { "unique" : true });

//Metods
jobSchema.methods.sent = function() {
  this.numStarted++;
  this.dispatch = this.numStarted < this.numRedundancy;
}

jobSchema.methods.returned = function(value) {
  this.returnValue.push(value);
  this.numFinished++;
}

//  This takes schemas and creates a collection/model in mongod
export var Job = mongoose.model('jobs', jobSchema);
export var UserData = mongoose.model('userdata', userDataSchema);
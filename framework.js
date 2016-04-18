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
    submitted: {
        type:       Date,
        default:    Date.now
    },
    code:           String,
    returnValue:    String
});

//  This takes the jobSchema and creates a collection/model in mongodb named 'jobs'
var Job = mongoose.model('jobs', jobSchema);

// make this available publically
module.exports = Job;

// Test Data //////
/*
for (var i = 1; i < 10; i++) {
 var testobject = {};
 testobject['code'] = "alert('hello world #" + i + "');";
 testobject['status'] = "waiting";
 
 var ajob = new Jobs(testobject)
 ajob.save(function(err) {
    if (err) throw err;
 
    console.log('User saved successfully!');
 });
}
*/
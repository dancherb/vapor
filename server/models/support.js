var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    username: String,
    name: String,
    email: String,
    message: String
});

var Support = mongoose.model('Support', schema);

module.exports = Support;
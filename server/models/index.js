var mongoose = require('mongoose');
mongoose.set('debug', true);
mongoose.Promise = global.Promise;

const official = true

if(official === true) {
    mongoose.connect('XXX');
} else {
    mongoose.connect('XXX');   
}

module.exports.User = require("./user");
module.exports.Chat = require("./chat");
module.exports.Support = require("./support");
module.exports.Invites = require("./invites");

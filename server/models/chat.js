var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    users: [],

    messages: [{ date: String, username: String, text: String, image: String, initiate: Boolean }],

    // allows for objects with any properties. will look like: { "vaporapp": true, "otherguy": false }
    read: { type: mongoose.Schema.Types.Mixed, default: {} }, 
});

var Chat = mongoose.model('Chat', schema);

module.exports = Chat;
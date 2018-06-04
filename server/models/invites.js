// store friend invite information in one doc, with payout value

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    name: String,
    payout: Number,
    note: String,
    invites: { type: mongoose.Schema.Types.Mixed, default: {} },
    emails: [],
    completed: { type: mongoose.Schema.Types.Mixed, default: {} }
});

var Invites = mongoose.model('Invites', schema);

module.exports = Invites;
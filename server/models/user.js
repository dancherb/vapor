var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, lowercase: true },

    deviceId: { type: String },
    
    notifications: [
        { 
            read: { type: Boolean, default: false},
            date: { type: String },
            user: String,
            notificationType: String,
            customMessage: String, // use notificationType: "custom" and fill customMessage to show news, etc
            itemText: String,
            itemAuthor: String,
            itemPermlink: String,
            rootPostAuthor: String,
            rootPostPermlink: String
        }      
    ],
    settings: {
        notifications: {
            messages: { type: Boolean, default: true },
            mentions: { type: Boolean, default: true },
            follows: { type: Boolean, default: true },
            comments: { type: Boolean, default: true },
            likes: { type: Boolean, default: true },
            reposts: { type: Boolean, default: true},
            replies: { type: Boolean, default: true},
            news: { type: Boolean, default: true }
        },
        blocks: []
    },
});

const User = mongoose.model('User', schema);

module.exports = User;


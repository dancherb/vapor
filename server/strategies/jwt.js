const db = require('../models');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;


const jwtOptions = {
    // look for a header in the GET request labelled "authorization" (this should have a jwt token as a value)
    jwtFromRequest: ExtractJwt.fromHeader('authorization'), 
    // provide the secret from our .env file
    secretOrKey: process.env.SECRET_KEY,
    // pass req parameters to the function as req.params, meaning we can check e.g. which room is being accessed
    passReqToCallback: true
}

// standard user access - require a token
exports.access = new JwtStrategy(jwtOptions, (req, payload, done) => {
    // check database to see if there's a user ID matching the decoded jwt token (payload)
    db.User.findOne({username: payload.username}, (err, user) => {
        // first param of done is whether there's an error, second is whether there's a user found
        if(err) {
            return done(err, false);
        }
        // check whether user exists with matching ID (and therefore has authorization)
        if(user) {
            done(null, user);
        } else {
            done(null, false);
        }
    })
});


// access/modify a specific user - require the username being accessed match the username given in the token
exports.accessID = new JwtStrategy(jwtOptions, (req, payload, done) => {
    // make sure a user exists with the id provided in the token
    db.User.findOne({username: payload.username}, (err, user) => {
        if(err) {
            return done(err, false)
        }
        // check that the user ID from the route to be accessed matches this ID from the token
        if(req.params.username === payload.username) {
            done(null, user); // grant access
        } else {
            done(null, false); // otherwise, reject
        }
    })
});

exports.accessChat = new JwtStrategy(jwtOptions, (req, payload, done) => {
    // find chat by ID
    db.Chat.findById({ _id: req.params.chatId }, (err, chat) => {
        if(err) {
            return done(err, false)
        }
        // check a username in the chat matches the username in the token
        if(chat.users.indexOf(payload.username) >= 0) {
            req.params.username = payload.username // store this to access if we need
            done(null, chat); // grant access
        } else {
            done(null, false); // otherwise, reject
        }
    })
});

exports.accessSendMessage = new JwtStrategy(jwtOptions, (req, payload, done) => {
    // find username
    db.User.findOne({username: payload.username}, (err, user) => {
        if(err) {
            return done(err, false)
        }
        // make sure username in req body (as sender) matches token
        if(req.body.username === payload.username) {
            done(null, user); // grant access
        } else {
            done(null, false); // otherwise, reject
        }
    })
});

module.exports = exports;
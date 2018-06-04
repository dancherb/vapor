const passport = require('passport');

// jwt strategy - for authorizing using a jwt token
const jwt = require('./jwt');
passport.use('access', jwt.access)
passport.use('accessID', jwt.accessID)
passport.use('accessChat', jwt.accessChat)
passport.use('accessSendMessage', jwt.accessSendMessage)

// these are imported in /routes/index.js



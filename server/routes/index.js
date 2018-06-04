var express = require('express');
var router = express.Router();
var passport = require('passport')

require('../strategies');

var users = require('../helpers/users')
var support = require("../helpers/support");
var activity = require("../helpers/activity");
var notifications = require("../helpers/notifications");
var images = require("../helpers/images");


const strategyConfig = {
  session: false, // indicates not to create a cookie-based session (we're using tokens instead)
  failureRedirect: '/unauthorized' // our route that provides some custom json and a status code
}

const access = passport.authenticate('access', strategyConfig) // reqire authorization header with token
const accessID = passport.authenticate('accessID', strategyConfig) // token's ID matches entry being accessed
const accessChat = passport.authenticate('accessChat', strategyConfig) // username in chat doc matches user's token
const accessSendMessage = passport.authenticate('accessSendMessage', strategyConfig) // token username matches 'from' username


router.route('/').get((req, res) => {
  res.send("Server.")
})

router.route('/unauthorized').get((req, res) => {
  res.status(401).send({unauthorized: true})
})

// SIGN IN
router.route('/signin')
.post(users.signIn)


// USER INFO
router.route('/user/:username')
.get(accessID, users.getUser)
.post(accessID, users.updateUser)

router.route('/check/:username')
.get(access, users.checkUser) // check a user has registered. requires any valid user token

router.route('/user/:username/removeDeviceId') // stop sending notifications when user logs out
.post(accessID, users.removeDeviceId)

router.route('/invite') // invite a friend - takes username, friend, email
.post(users.inviteFriend)


// SUPPORT
router.route('/support')
.post(support.sendMessage) // send support message


// CHATS, ACTIVITY AND  NOTIFICATIONS

router.route('/activity/:username/')
.get(accessID, activity.getActivity) // get all chats and notifications for user
.post(accessID, notifications.handleActivity) // deals with steem activity reports, sending out notifications

router.route('/activity/:username/read')
.get(accessID, activity.readNotifications) // mark all notifications read

router.route('/chat/:chatId/:messageCount')
.get(accessChat, activity.getChat) // get chat by Id - send client message count param for polling (send whole chat if greater length)

router.route('/chat')
.post(accessSendMessage, activity.sendMessage) // send message to recipient - creates new chat if none exists


// IMAGES
router.route('/image/send')
.post(activity.sendImage) // send image via chat - get S3 upload URL and add sent image to messages data

router.route('/image/view/:imageName')
.get(activity.viewImage) // get S3 view URL for image

router.route('/image/upload')
.post(images.uploadImage) // upload image (for profiles and posts) - get S3 upload URL. client will handle the rest. no viewing URL needed as images are in public bucket

// export for use in server.js
module.exports = router;

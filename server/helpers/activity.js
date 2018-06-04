var https = require('https');
var db = require('../models');
var AWS = require('aws-sdk');

var s3 = new AWS.S3({accessKeyId:'XXX', secretAccessKey:'XXX', region:'XXX'});
var bucket = 'XXX'


exports.getActivity = (req, res) => {
    db.Chat.find({ users: req.params.username }).lean()
    .then(chats => {
        db.User.findOne({ username: req.params.username }).lean()
        .then(user => {
            const notifications = user.notifications
            res.send({ 
                notifications: notifications.slice(notifications.length-25, notifications.length), // last 25 
                chats: chats })
        })
        .catch(error => {
            res.send(error)
        })
    })
    .catch(error => {
        res.send(error)
    });
}

exports.readNotifications = (req, res) => {
    db.User.findOne({ username: req.params.username })
    .then(user => {
        const notifications = user.notifications
        for(let i=0; i<notifications.length; i++) {
            if(notifications[i].read !== true) {
                notifications[i].read = true
            }
        }
        
        user.save()
        .then(user => {
            res.send({ notifications: user.notifications.length })
        })
        .catch(error => {
            res.send(error)
        })
    })
    .catch(error => {
        res.send(error)
    })
}

// when making a request for a specific chat, marks property "read"
exports.getChat = (req, res) => {
    db.Chat.findById({ _id: req.params.chatId })
    .then(chat => {
        // if no current message count given or current message count less than on server, send all messages
        if(!req.params.messageCount || req.params.messageCount < chat.messages.length) {
            // first, mark this chat as read (stored token username in req.params in jwt function)
            // as read = {} is a mixed type field, we update it like this
            chat.read[req.params.username] = true
            chat.markModified('read');

            chat.save()
            .then(chat => {
                res.send(chat)
            })
            .catch(error => res.send(error))
        } else {
            if(chat.read[req.params.username] !== true) {
                chat.read[req.params.username] = true
                chat.markModified('read');
            }

            chat.save()
            .then(() => {
                res.send({ upToDate: true }) // just send up-to-date heads up
            })
        }
    })
    .catch((err) => {
        res.send(err);
    })
}


exports.sendMessage = (req, res) => {
    // search for existing chats between these two 
    db.Chat.findOne({ "users": { $all: [req.body.username, req.body.recipient] }})
    .then(chat => {
        // chat found - proceed to send message
        if(chat) {
            return processMessage(req, res, chat)
        }
        // no chat found - make sure users exist
        db.User.findOne({ username: req.body.username })
        .then(user => {
            if(!user) {
                return res.send({error: "userNotFound"})
            }
            // make sure recipient exists
            db.User.findOne({ username: req.body.recipient })
            .then(recipient => {
                if(!recipient) {
                    return res.send({error: "recipientNotFound"})
                }
                // they exist - create chat
                db.Chat.create({ 
                    users: [req.body.username, req.body.recipient],
                    messages: [],
                    read: { [req.body.username]: true, [req.body.recipient]: true } // initiate with read: true, so no-one gets notified until an actual message is sent
                })
                .then(chat => {
                    // proceed to send message
                    return processMessage(req, res, chat)
                })     
                .catch(error => {
                    return res.send(error)
                })
            })
            .catch(error => {
                console.log(error)
                return res.send({error: "recipientNotFound"})
            })
        })
        .catch(error => {
            console.log(error)
            return res.send({error: "userNotFound"})
        })
    })
    .catch(err => {
        res.send(err)
    })
}

function processMessage(req, res, chat) {
    // chat found or created - next step: create message object
    const body = {}

    if(req.body.image) { 
        body.image = req.body.image;
    } else if(req.body.text) { 
        body.text = req.body.text;
    } else if(req.body.initiate) {
        body.initiate = true // for starting a new empty chat
    } else {
        return res.send({error: "noContent"})
    }

    if(req.body.username) {
        body.username = req.body.username; // could also take userId from token
    } else {
        return res.send({error: "no username"})
    }

    body.date = new Date()

    // add message to chat messages array
    chat.messages.unshift(body)
    
    // if text or image (i.e. not "initiate"), mark unread for this user
    if(req.body.image || req.body.text) {
        chat.read[req.body.recipient] = false
        chat.markModified('read');
    }
    
    // save
    chat.save()
    .then(chat => {
        // create push notification
        if(!req.body.initiate) {
            sendPush(
                req.body.user,
                req.body.recipient, 
                req.body.image ? `Image sent.` : `${req.body.text}`
            )
        }

        return res.send(chat)
    })
    .catch(error => {
        return res.send(error)
    })
}


// get URL for uploading image of given name - uploads images to S3 named <chatID-Date.jpg
exports.sendImage = (req, res) => {
    const file = `images/${req.body.image}.jpg`
    const params = {Bucket: bucket, Key: file, ContentType: 'image/jpeg'};
    
    // generate URL for uploading image
    s3.getSignedUrl('putObject', params, (err, url) => {
        if(!err) {
            // send upload URL - client side will now upload to this image, and when successful reload the chat
            res.send({URL: url})
            // call sendMessage() as if we were sending a text message, passing in the body
            // as we've already called res.send(), pass in our own res.send that just console logs
            const newRes = {
                send: function(message) {
                    console.log(message)
                }
            }
            exports.sendMessage(req, newRes, true)
        } else {
           console.log(err)
           res.send(err)
        }       
    });
}

// get URL for viewing image of given id
exports.viewImage = (req, res) => {
    const file = `images/${req.params.imageName}.jpg`
    const params = {Bucket: bucket, Key: file, Expires: "XXX"};

    // generate and send URL - app then downloads image from this address
    s3.getSignedUrl('getObject', params, (err, url) => {
        res.json({URL: url})
    });
}

function sendPush(user, recipient, message) {
    db.User.findOne({ username: recipient }).lean()
    .then(user => {
        // make sure we have a device ID
        if(user.deviceId) {
            // if "silent", we send the push notification without an alert (just to tell app to re-fetch)
            const silent = !user.settings.notifications.messages

            // create message
            const data = {
                app_id: "XXX",
                android_group: "general",
                // android_group_message: "$[notif_count] new messages.",
                content_available: silent ? true : undefined,
                headings: silent ? undefined : { "en": user.username },
                contents: silent ? undefined : {"en": message },
                data: {"type": "message" },
                include_player_ids: [user.deviceId],
            }
            
            var headers = {
                "Content-Type": "XXX",
                "Authorization": "XXX"
            };

            // destination of request
            var options = {
                host: "XXX",
                port: "XXX",
                path: "XXX",
                method: "POST",
                headers: headers
            };
            
            // create and send off
            var req = https.request(options, function(res) {  
                res.on('data', function(data) {
                    console.log("Response:");
                    console.log(JSON.parse(data));
                });
            });
            
            req.on('error', function(e) {
                console.log("ERROR:");
                console.log(e);
            });
            
            req.write(JSON.stringify(data));
            req.end();
        }            
    })
    .catch(error => console.log(error))
}

module.exports = exports;
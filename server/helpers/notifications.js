var db = require('../models');
var https = require('https');

// controls whether you receive notifications from your own actions (e.g. liking your own post)
const notifySelf = false

exports.handleActivity = (req, res) => {
    const type = req.body.notificationType

    if(type === "likePost" || type === "likeComment") {
        processLike(req, res)
    }
    // commentPost, replyComment, mentionComment
    else if(type === "comment") {
        processCommentPost(req, res)
    }
    
    else if(type === "reblog") {
        processReblog(req, res)
    }

    else if(type === "follow") {
        processFollow(req, res)
    }

    else if(type === "post") {
        processPost(req, res)
    }
}

function processLike(req, res) {
    // only send notification if owner of thing being liked ISN'T same as the person doing the liking
    if(req.body.itemAuthor === req.params.username && !notifySelf) {
        return res.send({sentNotification: 0, sameUser: true})
    }

    db.User.update(
        { username: req.body.itemAuthor },
        { $push: { notifications: { 
            date: new Date(),
            notificationType: req.body.notificationType,
            user: req.params.username,
            itemText: req.body.itemText || "comment",
            itemAuthor: req.body.itemAuthor,
            itemPermlink: req.body.itemPermlink,
            // likeComment only
            rootPostAuthor: req.body.rootPostAuthor || false,
            rootPostPermlink: req.body.rootPostPermlink || false,
        }}}
    )
    .then(result => {
        console.log(result)

        const message = `${req.params.username} liked ${req.body.rootPostAuthor ? "your comment." : "your post."}`

        sendPush(req.body.itemAuthor, "likes", message) // user, setting (e.g. settings.notifications.likes), message

        res.send({sentNotification: result.n})
    })
    .catch(error => {
        console.log(error)
        res.send({error})
    });
}

function processCommentPost(req, res) {
    let sent = 0

    if(req.body.rootPostAuthor === req.params.username && !notifySelf) {
        return processCommentMentions(req, res, sent)
    }

    db.User.update(
        { username: req.body.rootPostAuthor }, // notification for creator of main post
        { $push: { notifications: { 
            date: new Date(),
            notificationType: "commentPost",

            user: req.params.username,
            itemText: req.body.rootPostTitle, // display the title of the post
            itemAuthor: req.body.rootPostAuthor, // link to the post itself
            itemPermlink: req.body.rootPostPermlink,

            rootPostAuthor: req.body.rootPostAuthor,
            rootPostPermlink: req.body.rootPostPermlink
        }}}
    )
    .then(result => {
        console.log(result)

        sent += result.n
        console.log("sent total", sent)

        const message = `${req.params.username} commented on your post.`
        sendPush(req.body.rootPostAuthor, "comments", message)

        processCommentMentions(req, res, sent)
    })
    .catch(error => {
        console.log(error)

        processCommentMentions(req, res, sent)
    })
}

function processCommentMentions(req, res, sent) {
    // if user is found in mentions, remove (so no notification)
    const userMention = req.body.mentions.indexOf(req.params.username);
    if(userMention > -1 && !notifySelf) {
        req.body.mentions.splice(userMention, 1);
    }
    // then, check for mentions
    if(req.body.mentions && req.body.mentions.length > 0) {
        // add notifications
        db.User.update(
            { username: req.body.mentions },
            { $push: { notifications: { 
                date: new Date(),
                notificationType: "mentionComment",

                user: req.params.username,
                itemText: req.body.itemText || "comment",
                itemAuthor: req.body.itemAuthor,
                itemPermlink: req.body.itemPermlink,

                rootPostAuthor: req.body.rootPostAuthor,
                rootPostPermlink: req.body.rootPostPermlink
            }}},
            { multi: true }
        )
        .then(result => {
            console.log(result)

            sent += result.n
            console.log("sent total", sent)

            const message = `${req.params.username} mentioned you in a comment.`
            sendPush(req.body.mentions, "mentions", message)

            processReplyComment(req, res, sent)
        })
        .catch(error => {
            console.log(error)

            processReplyComment(req, res, sent)
        });
    } else {
        console.log("no mentions")
        processReplyComment(req, res, sent)
    }
}

function processReplyComment(req, res, sent) {
    // only valid if replied to a comment - check for parentPermlink, and make sure it's not just the post permlink
    if(req.body.parentPermlink && req.body.parentPermlink !== req.body.rootPostPermlink) {
        // don't notify if replier to comment is same as parent comment author
        if(req.body.parentAuthor === req.params.username && !notifySelf) {
            return res.send({sentNotification: sent})
        }
        // send notification
        db.User.update(
            { username: req.body.parentAuthor },
            { $push: { notifications: { 
                date: new Date(),
                notificationType: "replyComment",

                user: req.params.username,
                itemText: "comment",
                itemAuthor: req.body.parentAuthor, // let's use parentAuthor to link to the comment someone replied to, instead of focusing the comment itself
                itemPermlink: req.body.parentPermlink,

                rootPostAuthor: req.body.rootPostAuthor,
                rootPostPermlink: req.body.rootPostPermlink
            }}}
        )
        .then(result => {
            console.log(result)

            sent += result.n

            const message = `${req.params.username} replied to your comment.`
            sendPush(req.body.parentAuthor, "replies", message)

            res.send({sentNotification: sent})
        })
        .catch(error => {
            console.log(error)

            res.send({sentNotification: sent})
        })
    } else {
        console.log("no parent comment/author")
        res.send({sentNotification: sent})
    }
}

function processReblog(req, res) {
    db.User.update(
        { username: req.body.itemAuthor },
        { $push: { notifications: { 
            date: new Date(),
            notificationType: "repost",

            user: req.params.username,
            itemText: req.body.itemTitle,
            itemAuthor: req.body.itemAuthor,
            itemPermlink: req.body.itemPermlink,
        }}}
    )
    .then(result => {
        console.log(result)

        const message = `${req.params.username} resteemed your post.`
        sendPush(req.body.itemAuthor, "reposts", message)

        res.send({sentNotification: result.n})
    })
    .catch(error => {
        console.log(error)
        res.send(error)
    })
}

function processFollow(req, res) {
    db.User.update(
        { username: req.body.targetUser },
        { $push: { notifications: { 
            date: new Date(),
            notificationType: "follow",
            user: req.params.username, // also found in req.body.user
        }}}
    )
    .then(result => {
        console.log(result)

        const message = `${req.params.username} followed you.`
        sendPush(req.body.targetUser, "follows", message)

        res.send({sentNotification: result.n})
    })
    .catch(error => {
        console.log(error)
        res.send(error)
    })
}

function processPost(req, res) {
    // if user is found in mentions, remove (so no notification)
    const userMention = req.body.mentions.indexOf(req.body.itemAuthor);
    if(userMention > -1 && !notifySelf) {
        req.body.mentions.splice(userMention, 1);
    }
    // if mentions exist, add
    // seems to only register once for each user, even if appears multiple times in array
    if(req.body.mentions && req.body.mentions.length > 0) {
        db.User.update(
            { username: req.body.mentions },
            { $push: { notifications: { 
                date: new Date(),
                notificationType: "mentionPost",

                user: req.body.itemAuthor,
                itemText: req.body.itemTitle,
                itemAuthor: req.body.itemAuthor,
                itemPermlink: req.body.itemPermlink,
            }}},
            { multi: true }
        )
        .then(result => {
            console.log(result)

            const message = `${req.body.itemAuthor} mentioned you in a post.`
            sendPush(req.body.mentions, "mentions", message)

            res.send({sentNotification: result.n})
        })
        .catch(error => {
            console.log(error)

            res.send(error)
        });
    } else {
        res.send({sentNotification: 0})
    }
}

// default type is notification, pass in "message" otherwise
function sendPush(usernames, setting, message) {
    // if given just one username, make it into an array
    if(usernames.constructor !== Array) {
        usernames = [usernames]
    }

    // for each user (usually just one)...
    for(let i=0; i<usernames.length; i++) {
        // find the user
        db.User.findOne({ username: usernames[i] }).lean()
        .then(user => {
            // make sure we have a device ID
            if(user.deviceId) {
                // if "silent", we send the push notification without an alert (just to tell app to re-fetch)
                const silent = !user.settings.notifications[setting]

                // create message
                const data = {
                    app_id: "XXX",
                    android_group: "general",
                    // android_group_message: "$[notif_count] new notifications.",
                    content_available: silent ? true : undefined,
                    headings: silent ? undefined : { "en": message },
                    contents: silent ? undefined : {"en": "New notification." },
                    data: {"type": "notification" },
                    include_player_ids: [user.deviceId]
                }
                
                var headers = {
                    "Content-Type": "application/json; charset=utf-8",
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
}
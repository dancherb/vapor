var db = require('../models');
var jwt = require('jsonwebtoken');
var steem = require('steem');
var https = require('https');

const apiKey = 'XXX';
const domain = 'XXX';
const mailgun = require('mailgun-js')({apiKey, domain});

function getToken(user) {
    const token = jwt.sign({ 
        username: user.username,
        timestamp: new Date().getTime() 
    }, process.env.SECRET_KEY);
    return token;
}

// server is sent either posting or private active key as password
exports.signIn = (req, res) => {
    // first, verify key on steem
    steem.api.getAccounts([req.body.username], (err, response) => {
        if(err || !response) {
            res.send({connectionError: true})
            return
        }
        
        if(response.length === 0) {
            res.send({notFound: true})
            return
        }

        const publicActiveKey = response[0].active.key_auths[0][0];
        const publicPostingKey = response[0].posting.key_auths[0][0];

        try { 
            const valid = steem.auth.wifIsValid(req.body.password, publicActiveKey); 

            if(valid === true) {
                checkDatabase(req, res)
                return
            }

            // try as posting key
            try { 
                const validPostingKey = steem.auth.wifIsValid(req.body.password, publicPostingKey); 

                if(validPostingKey === true) {
                    checkDatabase(req, res)
                    return
                }
                res.send({unauthorized: true})
            }
            catch(e) {
                console.log(e)
                res.send({unauthorized: true})
            }
        }
        catch(e) { 
            console.log(e)
            res.send({unauthorized: true, incorrectFormat: true})
        }
    })
}

// we actually don't need to store any key information - when they sign in, the back-end will have verified it's a correct private key, and give them a token to access messages etc as a result
const checkDatabase = (req, res) => {
    db.User.findOne({username: req.body.username})
    .then(user => {
        if(req.body.deviceId && (!user.deviceId || user.deviceId !== req.body.deviceId)) {
            user.deviceId = req.body.deviceId
        }

        user.save()
        .then(user => {
            res.send({ 
                token: getToken(user),
                user: user
            });
        })
        .catch(error => {
            res.send(error)
        })
    })
    .catch(() => {
        console.log("user not found - creating user")

        db.User.create({ 
            username: req.body.username, 
            deviceId: req.body.deviceId ? req.body.deviceId : false,
            notifications: [{
                date: new Date(),
                read: false,
                notificationType: "custom",
                user: "vaporapp",
                customMessage: "Welcome to Vapor! Interactions with other Vapor users will pop up here."
            }]
        })
        .then((newUser) => {
            checkIfInvited(req.body.username)
            res.send({ 
                token: getToken(newUser),
                user: newUser,
                newUser: true
            });
        })
        .catch((err) => {
            res.send(err);
        })
    })
}

exports.getUser = (req, res) => {
    db.User.findOne({ username: req.params.username }).lean()
    .then(user => res.send(user))
    .catch(error => res.send(error))
}

exports.updateUser = (req, res) => {
    db.User.findOne({ username: req.params.username })
    .then(user => {
        if(req.body.settings) {
            user.settings = req.body.settings
        }
        user.save()
        .then((user) => res.send(user))
        .catch(error => res.send(error))
    })
    .catch(error => res.send(error))
}

exports.checkUser = (req, res) => {
    db.User.findOne({ username: req.params.username }).lean()
    .then(user => {
        if(user) {
            res.send({exists: true})
        } else {
            res.send({exists: false})
        }
    })
    .catch(error => res.send(error))
}

exports.removeDeviceId = (req, res) => {
    db.User.findOne({ username: req.params.username })
    .then(user => {
        if(req.body.deviceId && req.body.deviceId === user.deviceId) {
            user.deviceId = false 
        }
        user.save()
        .then((user) => res.send({newDeviceId: user.deviceId}))
        .catch(error => res.send(error))
    })
    .catch(error => res.send(error))
}

// invites

exports.inviteFriend = (req, res) => {
    // look up invites collection
    db.Invites.findOne({ name: "invites" })
    .then(result => {
        // if only email given...
        if(!req.body.friend) {
            console.log("no friend given - just sending email")
            // check if email sent here before
            if(result.emails.find(item => item === req.body.email)) {
                return res.send({ alreadyInvitedEmail: true })
            } 
            // if not, send email
            else {
                return sendInviteEmail(req, res, result)
            }
        }

        // check if friend already in username invites list
        if(result.invites[req.body.friend]) {
            return res.send({ alreadyInvited: true })
        }
        else {
            console.log("sending steem transaction memo")

            const memo = `${req.body.username} has invited you to Vapor, an app for exploring the Steem network. Find us on the Apple and Play stores!`

            steem.broadcast.transfer(
                "XXX", 
                "vaporapp", 
                req.body.friend,
                "0.001 SBD", 
                memo, 
                (err, transferResult) => {
                    if(err) {
                        res.send({usernameNotFound: true})
                    }
                    if(transferResult) {
                        // add friend to invited list
                        result.invites[req.body.friend] = req.body.username
                        result.markModified('invites');
                        result.save()
                        .then(saveResult => {
                            console.log(saveResult)
                            
                            // if email given...
                            if(req.body.email) {
                                // if email sent here before, end now
                                if(result.emails.find(item => item === req.body.email)) {
                                    console.log("username invited (email given but already invited)")
                                    return res.send({ invited: true })
                                } 
                                // otherwise, send email
                                else {
                                    return sendInviteEmail(req, res, result)
                                }
                            } else {
                                console.log("invited without email")
                                return res.send({ invited: true })
                            }
                        })
                        .catch(error => res.send(error))                    
                    }
                }
            )
        }
    })
    .catch(error => res.send(error))
}

function sendInviteEmail(req, res, result) {
    // send email
    const emailData = {
        from: "Vapor Robot <robot@spellbook.cc>",
        to: req.body.email,
        subject: `${req.body.username} has invited you to Vapor!`,
        html: `You have been invited to Vapor! Vapor is a social network app based on the Steem blockchain. Find us on the app stores below:<br/><br/>
        
        iOS:<br/>
        https://itunes.apple.com/us/app/vapor-a-steem-app/id1359525246
        <br/><br/>
        Android:<br/>
        https://play.google.com/store/apps/details?id=com.vapor`
    }
    mailgun.messages().send(emailData, (error, body) => {
        if(body) {
            console.log(result)
            // add email to invited emails data
            result.emails.push(req.body.email)
            result.save()
            .then(() => res.send({invited: true}))
            .catch(error => res.send(error))
        }
        if(error) {
            return res.send(error)
        }
    });
}

function checkIfInvited(username) {
    db.Invites.findOne({ name: "invites" })
    .then(result => {
        if(result.invites[username] && !result.completed[username]) {
            const inviter = result.invites[username]

            // delete key from "invites"
            delete result.invites[username]

            // create key to "completed" 
            result.completed[username] = inviter

            result.markModified('invites');
            result.markModified('completed');

            // send email in parallel
            const emailData = {
                from: "Vapor Robot <robot@spellbook.cc>",
                to: ["XXX", "XXX"],
                subject: `${username} signed up after being invited by ${inviter}.`,
                html: `Hello - ${username} signed up after being invited by ${inviter}.`
            }
            mailgun.messages().send(emailData, (error, body) => {
                if(body) {
                   console.log("email sent")
                }
                if(error) {
                    console.log(error)
                }
            });

            // save user object
            result.save()
            .then(result => {
                // send push notification to inviter
                db.User.update(
                    { username: inviter },
                    { $push: { notifications: { 
                        date: new Date(),
                        notificationType: "custom",
                        user: "vaporapp",
                        customMessage: `${username} has signed up to Vapor after you invited them! Send them a message, and look out for a gift from us.`
                    }}}
                )
                .then(result => {
                    // find user to get user ID
                    db.User.findOne({ username: inviter })
                    .then(user => {
                        // set up push notification
                        const data = {
                            app_id: "XXX",
                            android_group: "general",
                            headings: { "en": `${username} has signed up!` },
                            contents: {"en": "Thanks for inviting them." },
                            data: {"type": "notification" },
                            include_player_ids: [user.deviceId]
                        }
                        var headers = {
                            "Content-Type": "application/json; charset=utf-8",
                            "Authorization": "XXX"
                        };
                        var options = {
                            host: "XXX",
                            port: "XXX",
                            path: "XXX",
                            method: "POST",
                            headers: headers
                        };
                        var req = https.request(options, function(res) {  
                            res.on('data', function(data) {
                                console.log(JSON.parse(data));
                            });
                        }); 
                        req.on('error', function(e) {
                            console.log(e);
                        });
                        
                        req.write(JSON.stringify(data));
                        req.end();
                    })
                    .catch(error => console.log(error))
                })
                .catch(error => console.log(error))
            })
            .catch(error => console.log(error))
        } else {
            console.log("not invited (or already invited and signed up)")
        }
    })
    .catch(error => console.log(error))
}

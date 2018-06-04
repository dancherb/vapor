const db = require('../models');

const apiKey = 'XXX';
const domain = 'XXX';
const mailgun = require('mailgun-js')({apiKey, domain});

exports.sendMessage = function(req, res) {
    if(!req.body.username) {
        req.body.username = "(not signed in)"
    }
    if(!req.body.name) {
        req.body.name = "(no name given)"
    }
    if(!req.body.email) {
        req.body.email = "(no email given)"
    }
    const data = {
        from: "Vapor Robot <robot@spellbook.cc>",
        to: ["XXX", "XXX"],
        subject: `support request from ${req.body.username}`,
        html: `Hello - you've received a support request from ${req.body.username} in the Vapor app.<br/>
        <br/>
        Name: ${req.body.name}<br/>
        Email: ${req.body.email}<br/>
        <br/>
        Here's the message:<br/>
        <br/>${req.body.message}`
    }
    mailgun.messages().send(data, (error, body) => {
        console.log(body)
        if(error) {
            console.log(error)
        }
    });
    
    // also create support entry in db (parallel API call incase either one fails).
    db.Support.create(req.body)
    .then(item => {
        res.send(item)
    })
    .catch(err => {
        res.send(err);
    })
}
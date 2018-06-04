// for public images (profile picture, post pictures). private images handled in activity.js

var AWS = require('aws-sdk');
var s3 = new AWS.S3({accessKeyId:'XXX', secretAccessKey:'XXX', region:'XXX'});
var bucket = 'XXX'

// get URL for uploading image of given name - uploads images to S3 named <author-Date.jpg
exports.uploadImage = (req, res) => {   
    const file = `images/${req.body.imageName}.jpg`
    // if image name begins with "profile", delete the old image name (i.e. old profile picture) 
    if(req.body.oldPictureName) {
        const oldFile = `images/${req.body.oldPictureName}` // given with the .jpg already
        // delete from S3 bucket
        s3.deleteObject({
            Bucket: bucket,
            Key: oldFile
        }, (err) => {
            if(err) {
                res.send(err) 
                return
            } 
            sendImageURL(req, res, file)
        })
    } else {
        sendImageURL(req, res, file)
    }
}

function sendImageURL(req, res, file) {
    const params = {Bucket: bucket, Key: file, ContentType: 'image/jpeg'};
    // generate URL for uploading image
    s3.getSignedUrl('putObject', params, (err, url) => {
        if(!err) {
            // send upload URL - client side will now upload to this image, and when successful reload the chat
            res.send({URL: url})
        } else {
           console.log(err)
           res.send(err)
        }       
    });
}
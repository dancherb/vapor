/* global fetch:false XMLHttpRequest:false */
import '../../shim.js'
import steem from 'steem'
import axios from 'axios'

import { ROOTURL, headers } from './'

const bucketURL = "XXX"


export function updateProfile(metadata, callback, errorCallback) { 
    return (dispatch, getState) => { 
        const publicMemoKey = getState().persist.publicMemoKey;
        const privateActiveKey = getState().persist.privateActiveKey;
        const username = getState().persist.username;
        
        steem.broadcast.accountUpdate(
            privateActiveKey,
            username,
            undefined, // Set to undefined so account authority dont change
            undefined,
            undefined,
            publicMemoKey,
            metadata,
            function (err,  result) {
              if(result) {
                    console.log("update success")
                    callback()
                }
                if(err) {
                    console.log(err)
                    errorCallback()
                }
            }
        )
    }
}


export function uploadProfilePicture(uri, callback, errorCallback, oldPicture) { 
    return (dispatch, getState) => {          
        const publicMemoKey = getState().persist.publicMemoKey;
        const privateActiveKey = getState().persist.privateActiveKey;
        const username = getState().persist.username;
        const imageName = `${username}-${new Date().getTime()}`

        const URL = `${ROOTURL}/image/upload`
        const token = null

        // check if the old picture was on our server (so we can delete it)
        const oldPictureName = oldPicture ? oldPicture.split(bucketURL)[1] : false
            
        const body = {
            imageName: imageName,
            oldPictureName: oldPictureName || false
        }

        // make request to our server for the upload URL
        axios.post(URL, body, headers(token))
        .then(response => {
            // take the upload URL
            const uploadURL = response.data.URL

            const values = getState().values
            
            // create the upload request and send it off
            const uploadRequest = new XMLHttpRequest()
        
            uploadRequest.open('PUT', uploadURL)
            uploadRequest.onreadystatechange = function() {
                if (uploadRequest.readyState === 4) {
                    if (uploadRequest.status === 200) {
                        // take the originally loaded profile metadata and attach the new profile image (text fields are updated separately)
                        const viewURL = `${bucketURL}${imageName}.jpg`
                        const metadata = getState().values.originalProfileMetadata
                        metadata.profile.profile_image = viewURL

                        console.log(metadata)

                        steem.broadcast.accountUpdate(
                            privateActiveKey,
                            username,
                            undefined, // Set to undefined so account authority dont change
                            undefined,
                            undefined,
                            publicMemoKey,
                            metadata,
                            function (err,  result) {
                              if(result) {
                                    console.log("update success")
                                    callback()
                                }
                                if(err) {
                                    console.log(err)
                                    errorCallback()
                                }
                            }
                        )
                    } else {
                        console.log(uploadRequest.responseText)
                        errorCallback()
                    }
                }
            }
            uploadRequest.setRequestHeader('Content-Type', 'image/jpeg')
            uploadRequest.send({ uri: uri, type: 'image/jpeg', name: imageName})
        })
        .catch(err => {
            console.log(err)
            errorCallback()
        })
    }
}
/* global XMLHttpRequest:false */
import 'core-js/es6/symbol'; 
import 'core-js/fn/symbol/iterator';

import '../../shim.js'
import steem from 'steem'
import axios from 'axios'

import { ROOTURL, recordActivity, removeArrayDuplicates } from './'

// we use this in commentOptions operations (atm just in making a post) to add ourselves as 1% beneficiaries
const extensions = [[0, { beneficiaries: [{ account: 'XXX', weight: 100 }] }]]

export function getUserVotesList() {
    return (dispatch, getState) => {
        const username = getState().persist.username

        steem.api.getAccountVotes(username, (err, result) => {
            if(err) console.log(err)
            if(result) {
                // loop through votes array, creating an object so we can check votesList.CoolArticle === true?
                const votesObject = {}
                for(let i=0; i<result.length; i++) {
                    // check percent (i.e. input weight) > 0 (i.e. it hasn't been un-voted)
                    if(result[i].percent > 0) {
                        votesObject[result[i].authorperm] = true
                    }
                }

                // console.log(result.splice(result.length-5, 5)) // log last 5 results
                dispatch({ type: "change_value", payload: { label: "userVotesList", value: votesObject}})
            }
        });
    }
}

export function upvote(author, permlink, alreadyLiked, callback, errorCallback, title, rootPostAuthor, rootPostPermlink) {
    return (dispatch, getState) => {
        const username = getState().persist.username
        const key = getState().persist.privateActiveKey
        
        // if already liked, set weight to 0 to unlike
        const weight = alreadyLiked ? 0 : 10000

        console.log("weight", weight)

        steem.broadcast.vote(key, username, author, permlink, weight, (err, result) => {
            if(err) {
                console.log("Unsuccessful vote.")
                console.log(err)
                if(errorCallback) {
                    errorCallback()
                }
            }
            if(result) {
                console.log("Successful vote.")
                console.log(result)

                if(!alreadyLiked) {
                    // if title passed in, we're liking a post
                    // otherwise (passed in rootPostAuthor, rootPostPermlink) we're liking comment
                    const recordBody = {
                        notificationType: title ? "likePost" : "likeComment",
                        itemText: title || false,
                        itemAuthor: author,
                        itemPermlink: permlink,
                        rootPostAuthor: rootPostAuthor || false,
                        rootPostPermlink: rootPostPermlink || false,
                    }
                    dispatch(recordActivity(recordBody))
                }

                if(callback) {
                    callback()
                }
            }
        });
    }
}

export function comment(parentAuthor, parentPermlink, body, callback, errorCallback, rootPostTitle, rootPostAuthor, rootPostPermlink) {
    return (dispatch, getState) => {
        const username = getState().persist.username
        const key = getState().persist.privateActiveKey
        const commentPermlink = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();

        steem.broadcast.comment(key, parentAuthor, parentPermlink, username, commentPermlink, "", body, { tags: [], app: 'vapor' }, function(err, result) {
            if(err) {
                console.log(err)
                if(errorCallback) {
                    errorCallback()
                }
            }
            if(result) {
                console.log("Successful comment.")

                // RECORDING ACTIVITY
                // parse for mentions
                const pattern = /\B@[a-z0-9_-]+/gi;
                const usersMatched = body.match(pattern) || []
                const mentions = usersMatched.map(item => item.slice(1));
                const uniqueMentions = removeArrayDuplicates(mentions)

                const recordBody = {
                    notificationType: "comment", // could either by commentPost, replyComment or mentionComment
                    itemAuthor: username, // the comment itself and its link
                    itemPermlink: commentPermlink,
                    parentAuthor: parentAuthor, // the comment being replied to (incase of replyComment)
                    parentPermlink: parentPermlink,
                    rootPostTitle: rootPostTitle, // the root post being commented on 
                    rootPostAuthor: rootPostAuthor, 
                    rootPostPermlink: rootPostPermlink,
                    mentions: uniqueMentions
                }
                dispatch(recordActivity(recordBody))

                if(callback) {
                    callback()
                }
            }            
        });
    }
}

export function reblog(author, permlink, errorCallback, title) {
    return (dispatch, getState) => {
        const username = getState().persist.username
        const key = getState().persist.privateActiveKey

        const json = JSON.stringify(['reblog', {
            account: username,
            author: author,
            permlink: permlink
        }]);
          
        steem.broadcast.customJson(key, [], [username], 'follow', json, (err, result) => {
            if(err) {
                console.log("Unsuccessful reblog.")
                console.log(err)
                if(errorCallback) {
                    errorCallback()
                }
            }
            if(result) {
                console.log("Successful reblog.")
                console.log(result)

                const recordBody = {
                    notificationType: "reblog",
                    user: username, 
                    itemAuthor: author,
                    itemPermlink: permlink,
                    itemTitle: title
                }
                dispatch(recordActivity(recordBody))
            }
        });
    }
}

export function follow(user, type, errorCallback) {
    return (dispatch, getState) => {
        const username = getState().persist.username
        const key = getState().persist.privateActiveKey

        dispatch({ type: "change_value", payload: { label: "followProgress", value: true}})

        var json = JSON.stringify(['follow', {
            follower: username,
            following: user,
            what: type === "follow" ? ["blog"] : []
        }]);
        
        steem.broadcast.customJson(
            key,
            [], // Required_auths
            [username], // Required Active Auths
            'follow', // Id
            json, //
            function(err, result) {
                dispatch({ type: "change_value", payload: { label: "followProgress", value: false}})
                if(err) {
                    console.log("Unsuccessful (un?)follow.")
                    console.log(err)    
                    if(errorCallback) {
                        errorCallback()
                    }
                }
                if(result) {
                    console.log("Successful (un?)follow.")

                    if(type === "follow") {
                        const recordBody = {
                            notificationType: "follow",
                            user: username, 
                            targetUser: user
                        }
                        dispatch(recordActivity(recordBody))
                    }
                }
            }
        );
    }
}

export function getUserFollowingList() {
    return (dispatch, getState) => {
        const username = getState().persist.username
        const followersList = []

        // max 100 each time so we need to loop through until we get them all
        requestFollowing(username, followersList, null, dispatch)
    }
}

function requestFollowing(username, followersList, startUser, dispatch) {
    // startUser will be null if this is the first one
    steem.api.getFollowing(username, startUser, "blog", 100, (err, result) => {
        if(err) console.log(err)

        if(result) {
            // unless the first run, remove the last item from the original list (matches the result's first item)
            if(followersList.length > 0) {
                followersList.pop()
            }

            // add the results (up to 100) to the list
            const currentList = followersList.concat(result)

            console.log("current following length", currentList.length)

            // if there's a 100th person in the result, we need to request the next batch starting from this person
            if(result[99]) {
                startUser = result[99].following
                requestFollowing(username, currentList, startUser, dispatch)
            } else {
                // if there isn't a 99th person in this result, we're done
                dispatchFollowingList(username, currentList, dispatch)
            }
        }
    });
}

function dispatchFollowingList(username, list, dispatch) {
    // now, loop through the final list creating an object, so we can ask following.CoolUser === true?
    const followersObject = {}
    for(let i=0; i<list.length; i++) {
        followersObject[list[i].following] = true
    }

    dispatch({ type: "change_value", payload: { label: "userFollowingList", value: followersObject}})
}

// const body = {
//     inputPostTitle: this.props.inputPostTitle,
//     inputPostBody: this.props.inputPostBody,
//     inputPostTags: this.props.inputPostTags,
//     inputPostRewards: this.props.inputPostRewards,
//     inputPostUpvote: this.props.inputPostUpvote,
//     imageUri1: this.props.imageUri1,
//     imageUri2: this.props.imageUri2,
//     imageUri3: this.props.imageUri3
// }

export function makePost(body, callback) {
    return (dispatch, getState) => {
        const username = getState().persist.username
        const key = getState().persist.privateActiveKey

        console.log(body)
                
        let tags = body.inputPostTags.toLowerCase()
        tags = tags.replace(/,/g, ""); // remove any commas from tags input
        const tagsList = tags.split(" ") // separate by spaces to create array of tags

        if(tagsList.length > 5) {
            tagsList.length = 5 // no more than 5 items
        }

        const permlink = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();

        // create an array of our images
        const imageUris = []
        if(body.imageUri1) imageUris.push(body.imageUri1)
        if(body.imageUri2) imageUris.push(body.imageUri2)
        if(body.imageUri3) imageUris.push(body.imageUri3)

        console.log(imageUris)

        // generate a name for each image
        const imageNames = []
        for(let i=0; i<imageUris.length; i++) {
            const name = `${username}-post-${i+1}-${permlink}`
            imageNames.push(name)
        }

        console.log("names")
        console.log(imageNames)

        // predict the links for each image
        const rootImageURL = "XXX"
        const imageLinks = []
        for(let i=0; i<imageNames.length; i++) {
            imageLinks.push(rootImageURL+imageNames[i]+".jpg")
        }

        console.log("links")
        console.log(imageLinks)

        // get the post body, to parse for user tags and to add our images to
        let postBody = body.inputPostBody
        
        const pattern = /\B@[^\s]+/gi; // @([^\s]+)
        const usersMatched = postBody.match(pattern) || [] // parse for tagged users - empty array if no tags
        const mentions = usersMatched.map(item => item.slice(1));// remove the @ from the start of each user's name
        const users = removeArrayDuplicates(mentions)

        console.log(users)

        // embed our image links to to the end of the body in html
        for(let i=0; i<imageLinks.length; i++) {
            postBody = postBody +`<p><img src="${imageLinks[i]}"></img></p>`
        }

        // now before we start the image API calls, prepare and declare the broadcast function we're going to call later
        const metadata = { 
            tags: tagsList, 
            app: "vapor",
            image: imageLinks,
            format: "html",
            users: users
        }

        const broadcast = () => steem.broadcast.comment(key,
            '', // Leave parent author empty
            tagsList[0], // Main tag
            username, // Author
            permlink, // Permlink
            body.inputPostTitle, // Title
            postBody, // Body
            metadata, // Json Metadata
            (err, result) => {
                if(err) {
                    console.log(err)
                    dispatch({ type: "change_value", payload: { label: "submittingPostFailure", value: "Please try again in a few minutes."}})
                }
                if(result) {
                    // record activity in back-end
                    const recordBody = {
                        notificationType: "post", // only used for mentionPost and mentions atm
                        itemAuthor: username, 
                        itemPermlink: permlink,
                        itemTitle: body.inputPostTitle,
                        mentions: users,
                    }
                    dispatch(recordActivity(recordBody))

                    // fetch our post and navigate there
                    console.log(result)
                    steem.api.getContent(username, permlink, (err, result) => {
                        if(err) console.log(err)
                        if(result) {
                            console.log(result)
                            // set comment options - extensions defined at top of page
                            const percent = body.inputPostRewards === "powerUp" ? 0 : 10000
                            const maxPayout = body.inputPostRewards === "decline" ? '0.000 SBD' : '1000000.000 SBD'

                           // broadcast options - can continue without waiting for this to return
                            steem.broadcast.commentOptions(key, username, permlink, maxPayout, percent, true, true, extensions, (err, result) => {
                                console.log("comment options response")
                                if(err) console.log(err)
                                if(result) console.log(result)
                            });
                            // trigger creation of object in our local post store and mark as reblogged
                            dispatch({ type: "change_post", 
                            payload: { 
                                object: `${username}-${permlink}`, 
                                label: "reblogged", 
                                value: true
                            }})
                            // all finished - load and navigate to the post
                            dispatch({ type: "change_value", payload: { label: "submittingPost", value: false}})
                            dispatch({ type: "change_value", payload: { label: "viewingPost", value: result}})
                            dispatch({ type: "visit_screen", payload: "PostScreen"})
                            
                            // this callback clears the new post inputs
                            if(callback) {
                                callback()
                            }
                        }
                    });
                }   
            }
        );

        // all ready - now count the number of API calls to upload images we're about to start
        let imageCalls = imageNames.length

        console.log("imagecalls")
        console.log(imageCalls)
        // if it's none, we can just broadcast the post
        if(imageCalls === 0) {
            console.log("no images found - broadcast")
            broadcast()
            return
        }
        
        const URL = `${ROOTURL}/image/upload`

        // make a request. once it's finished we can minus 1 from imageCalls. once imageCalls is 0, we can broadcast
        for(let i=0; i<imageNames.length; i++) {
            const imageBody = { 
                imageName: imageNames[i] 
            }
            axios.post(URL, imageBody)
            .then(response => {
                // take the upload URL
                const uploadURL = response.data.URL

                // create the upload request and send it off
                const uploadRequest = new XMLHttpRequest()
                    
                uploadRequest.open('PUT', uploadURL)
                uploadRequest.onreadystatechange = function() {
                    if (uploadRequest.readyState === 4) {
                        if (uploadRequest.status === 200) {
                            // success - reduce the number of API calls by one
                            imageCalls = imageCalls - 1
                            // if we've now finished all our image calls, it's time to make the steem broadcast
                            if(imageCalls === 0) {
                                console.log("images finished - broadcast")
                                broadcast()
                                return
                            }
                        } else {
                            // error - image may no longer be on phone, so reset image selections
                            console.log(uploadRequest.responseText)
                            dispatch({ type: "change_value", payload: { label: "submittingPostFailure", value: "Please re-attach your images."}})
                            dispatch({ type: "persist_value", payload: { label: "imageUri1", value: false}})
                            dispatch({ type: "persist_value", payload: { label: "imageUri2", value: false}})
                            dispatch({ type: "persist_value", payload: { label: "imageUri3", value: false}})
                            dispatch({ type: "persist_value", payload: { label: "image1", value: false}})
                            dispatch({ type: "persist_value", payload: { label: "image2", value: false}})
                            dispatch({ type: "persist_value", payload: { label: "image3", value: false}})

                            dispatch({ type: "change_value", payload: { label: "submittingPost", value: false}})
                            return
                        }
                    }
                }
                uploadRequest.setRequestHeader('Content-Type', 'image/jpeg')
                uploadRequest.send({ uri: imageUris[i], type: 'image/jpeg', name: imageNames[i]})
            })
            .catch(error => console.log(error))
        }
    }
}



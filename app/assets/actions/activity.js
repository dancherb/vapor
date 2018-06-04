/* global fetch:false XMLHttpRequest:false */
import axios from 'axios'
import '../../shim.js'
import steem from 'steem'

import { ROOTURL, headers, sortByField, sortByNewestMessage, signOut } from './'
import { getCurrentScreen } from '../screens'

// we call this when receiving silent push notifications while the app is already open (we get these even if "loud" app-is-closed push notifications are turned off from settings.
// to be safe, we also call it on entering certain screens (notifications/messages) and on "pull-down" refresh
export function getActivity(callback) {
    return (dispatch, getState) => {
        console.log("getting activity")

        const username = getState().persist.username
        const token = getState().persist.token

        const activityURL = `${ROOTURL}/activity/${username}`
        const userURL = `${ROOTURL}/user/${username}`

        axios.get(activityURL, headers(token))
        .then(response => {
            // if something went wrong, don't proceed
            if(!response.data.notifications) {
                return
            }

            const notifications = response.data.notifications
            let unreadNotifications = 0

            // loop through the notifications to find out how many are unread
            for(let i=0; i<notifications.length; i++) {
                if(!notifications[i].read) {
                    unreadNotifications += 1
                }
            }

            // sort notifications
            const sortedNotifications = sortByField(notifications, "date", "reverse")

            dispatch({ type: "change_value", payload: { label: "notifications", value: sortedNotifications }})
            dispatch({ type: "change_value", payload: { label: "unreadNotifications", value: unreadNotifications }})

            dispatch(getNotificationProfilePictures(sortedNotifications))

            // sort chats by order of most recent message
            const sortedChats = sortByNewestMessage(response.data.chats)

            // now, get user settings (for blocks)
            axios.get(userURL, headers(token))
            .then(response => {
                const blocks = response.data.settings.blocks

                // for each chat we've receieved, take some item in the chat's users array 
                // check if the blocks list includes it. if it does, match is "true"
                // return false if there's a match, so that items with a match are filtered
                const filteredChats = sortedChats.filter(item => {
                    const match = item.users.some(user => blocks.includes(user))
                    return !match
                })

                dispatch({ type: "change_value", payload: { label: "chatList", value: filteredChats }})
                dispatch({ type: "change_value", payload: { label: "loadingChats", value: false }})

                let unreadChats = 0

                // loop through the chats to find out how many are unread
                for(let i=0; i<filteredChats.length; i++) {
                    if(!filteredChats[i].read[username]) {
                        unreadChats += 1

                        // if marked as unread, BUT is the chat we're currently viewing, undo this 
                        // (this will have been marked as read when re-fetched, but maybe this call came back first)
                        if(getCurrentScreen(getState().nav) === "ChatScreen") {
                            if(getState().values.chat && getState().values.chat._id === filteredChats[i]._id) {
                                unreadChats -= 1
                            }
                        }
                    }
                }

                dispatch({ type: "change_value", payload: { label: "unreadChats", value: unreadChats }})

                // refreshingActivity is set to true when a user manually "pull down" refreshes - now we turn it off
                dispatch({ type: "change_value", payload: { label: "refreshingActivity", value: false }})

                // if we click "message" from someone's profile, we run getActivity before jumping into a chat with that profile
                // this is the optional callback for proceeding with that process
                if(callback) {
                    callback(filteredChats)
                }
                return
            })
            .catch(error => {
                console.log(error)
                dispatch({ type: "change_value", payload: { label: "gettingActivity", value: false }})
                if(error.response.data.unauthorized === true) {
                    dispatch(signOut())
                }
            })
        })
        .catch(error => {
            console.log(error)
            dispatch({ type: "change_value", payload: { label: "gettingActivity", value: false }})
            if(error.response.data.unauthorized === true) {
                dispatch(signOut())
            }
        })
    }
}

function getNotificationProfilePictures(notifications) {
    return(dispatch, getState) => {
        const images = getState().images

        const fetchList = {}

        // populate fetchList with profiles we need to fetch
        for(let i=0; i<notifications.length; i++) {
            const user = notifications[i].user
            const reference = images[`profile-${user}`]
            if(!reference && !fetchList[user]) {
                fetchList[user] = true
            }
        }

        const profileImages = {}

        let callCount = Object.keys(fetchList).length

        // fetch them
        Object.keys(fetchList).forEach(user => {
            steem.api.getAccounts([user], (err, result) => {  
                if(result && result[0] && result[0].json_metadata) {
                    const metadata = JSON.parse(result[0].json_metadata)
                    const image = metadata.profile && metadata.profile.profile_image ? metadata.profile.profile_image 
                    : false
                     
                    profileImages[user] = image

                    callCount -= 1
                    
                    // all images fetched - dispatch
                    if(callCount < 1) {
                        dispatch({ type: "batch_add_images", payload: profileImages})
                    }

                }
                if(err) console.log(err)
            });  
        })        
    }
}

export function readNotifications() {
    return (dispatch, getState) => {
        const username = getState().persist.username
        const token = getState().persist.token

        const URL = `${ROOTURL}/activity/${username}/read`
        
        axios.get(URL, headers(token))
        .then(response => {
            // fetch activity again, to update the "read" values for when we visit notifications again. we also call readNotifications when pull-down refreshing notifications, knowing it calls getActivity after
            dispatch(getActivity())
            console.log(response.data)
        })
        .catch(error => {
            console.log(error.response.data)
        })
    }
}

export function loadChat(chatId, messageCount) {
    return (dispatch, getState) => {
        // if no chatId supplied, this was called from App.js on receiving a notification
        if(!chatId) {
            // if we're not currently viewing a chat, no need to refresh - end the function
            if(getCurrentScreen(getState().nav) !== "ChatScreen") {
                return
            } 
            // otherwise, fetch the chat ID to refresh
            chatId = chatId || getState().values.chat._id
        }

        const token = getState().persist.token
        const URL = `${ROOTURL}/chat/${chatId}/${messageCount || 0}`

        // loading this full chat also marks it as read - though sometimes getActivity may call before this
        axios.get(URL, headers(token))
        .then(response => {
            if(!response.data.upToDate) {
                dispatch({ type: "change_value", payload: { label: "chat", value: response.data }})
                loadChatImages(response.data.messages, dispatch, getState) // adds any sent and unloaded image URLs into global state for display
            }
        })
        .catch(error => {
            console.log(error.response.data)
        })
    }
}

// this is called when the user initially opens a chat, and also when that chat data is updated (to re-check it)
export function loadImages(messages) {
    return (dispatch, getState) => {
        const images = getState().images
        const token = getState().persist.token

        for(let i=0; i<messages.length; i++) {
            // if a message has an image and its viewing URL is not stored in the global state
            if(messages[i].image && !images[messages[i].image]) {
                // fetch the S3 viewing URL from our server
                const URL = `${ROOTURL}/image/view/${messages[i].image}`

                axios.get(URL, headers(token))
                .then(response => {
                    return dispatch({ type: "add_image", payload: { label: messages[i].image, value: response.data.URL }})
                })
                .catch(error => console.log(error.response.data))
            }
        }
    }
}

export function loadChatImages(messages, dispatch, getState) {
    const images = getState().images
    const token = getState().persist.token

    for(let i=0; i<messages.length; i++) {
        // if a message has an image and its viewing URL is not stored in the global state
        if(messages[i].image && !images[messages[i].image]) {
            // fetch the S3 viewing URL from our server
            const URL = `${ROOTURL}/image/view/${messages[i].image}`

            console.log("requesting image "+messages[i].image)
            axios.get(URL, headers(token))
            .then(response => {
                console.log(response.data)
                return dispatch({ type: "add_image", payload: { label: messages[i].image, value: response.data.URL }})
            })
            .catch(error => console.log(error.response.data))
        }
    }
}

export function sendMessage(body, callback, notFoundCallback) {
    return (dispatch, getState) => {
        const token = getState().persist.token
        const URL = `${ROOTURL}/chat`

        axios.post(URL, body, headers(token))
        .then(response => {
            console.log(response.data)
            if(response.data.error) {
                if(response.data.error === "recipientNotFound" && notFoundCallback()) {
                    notFoundCallback()
                }
                return
            }
            if(callback) {
                callback(response.data)
            }
            dispatch({ type: "change_value", payload: { label: "inputMessage", value: "" }})
        })
        .catch(error => {
            console.log(error.response.data)
        })
    }
}

export function sendImage(chatId, body, uri, callback) { 
    return (dispatch, getState) => {     
        // generate a name for this image based on the chat ID and time
        const imageName = `${chatId}-${new Date().toString()}`

        // add this to message body
        body.image = imageName

        const URL = `${ROOTURL}/image/send`
        const token = getState().persist.token 

        // make request to our server for the upload URL - also adds the image message to the chat data
        axios.post(URL, body, headers(token))
        .then(response => {
            // take the upload URL
            const uploadURL = response.data.URL
            console.log(uploadURL)

            // create the upload request and send it off
            const uploadRequest = new XMLHttpRequest()
        
            uploadRequest.open('PUT', uploadURL)
            uploadRequest.onreadystatechange = function() {
                if (uploadRequest.readyState === 4) {
                    if (uploadRequest.status === 200) {
                        // event listener for success - re-fetch avatar
                        if(callback) {
                            callback()
                        }
                    } else {
                        console.log(uploadRequest.responseText)
                    }
                }
            }
            uploadRequest.setRequestHeader('Content-Type', 'image/jpeg')
            uploadRequest.send({ uri: uri, type: 'image/jpeg', name: imageName})
        })
        .catch(err => {
            console.log(err)
        })
    }
}
import axios from 'axios'
import { ROOTURL, headers, on, off, change, clear, visit } from './'

// for loading notifications, see getActivity in /chats.js

// this sends off activity (e.g. likes, follows, reposts) to our own back-end to handle notifications
export function recordActivity(body) {
    return (dispatch, getState) => {
        const username = getState().persist.username
        const token = getState().persist.token

        const URL = `${ROOTURL}/activity/${username}`

        console.log(body)

        axios.post(URL, body, headers(token))
        .then(response => {
            console.log(response.data)
            console.log("RECORD SUCCESS")
        })
        .catch(error => {
            console.log(error)
            console.log("RECORD ERROR")
        })   
    }
}

export function sendInvite(friend, email) {
    return (d, getState) => {
        const username = getState().persist.username
        const token = getState().persist.token

        const body = {
            username: username,
            friend: friend || false,
            email: email || false
        }

        console.log("body")
        console.log(body)

        const URL = `${ROOTURL}/invite`

        d(on("friendInviteProgress"))
        d(off("friendInviteSuccess"))
        d(off("friendAlreadyRegistered"))

        // first, will check if already a user
        // if success, coninue to invite friend
       const notFoundCallback = () => {
            axios.post(URL, body, headers(token))
            .then(response => {
                console.log(response.data)
                if(response.data.invited === true) {
                    d(clear("inputNewRecipient"))
                    d(clear("inviteFriendUsername"))
                    d(clear("inviteFriendEmail"))
                    d(on("friendInviteSuccess"))
                }
                else if(response.data.alreadyInvited === true) {
                    d(change("friendInviteError", `${friend} has already been invited!`))
                    d(off("friendInviteSuccess"))
                }
                else if(response.data.alreadyInvitedEmail === true) {
                    d(change("friendInviteError", "This email has already been invited!"))
                    d(off("friendInviteSuccess"))
                }
                else if(response.data.usernameNotFound === true) {
                    d(change("friendInviteError", "Steem username not found!"))
                    d(off("friendInviteSuccess"))
                }

                d(off("friendInviteProgress"))
            })
            .catch(error => {
                console.log(error.response.data)
                d(off("friendInviteProgress"))
                d(off("friendInviteSuccess"))
            })
        }

        const existsCallback = () => {
            d(change("friendInviteError", `${friend} is already on Vapor!`))
            d(off("friendInviteProgress"))
            d(off("friendInviteSuccess"))
        }

        if(friend) {
            d(checkVaporUser(friend, existsCallback, notFoundCallback))
        } else {
            notFoundCallback()
        }
    }
}

export function checkVaporUser(user, existsCallback, notFoundCallback) {
    return (d, getState) => {
        const token = getState().persist.token

        const URL = `${ROOTURL}/check/${user}`

        axios.get(URL, headers(token))
        .then(response => {
            console.log(response.data)
            if(response.data.exists === true) {
                if(existsCallback) {
                    existsCallback()
                }
            } else {
                if(notFoundCallback) {
                    notFoundCallback()
                }
            }
        })
        .catch(error => {
            console.log(error.data)
            if(notFoundCallback) {
                notFoundCallback()
            }
        })
    }
}

export function loadSettings() {
    return (d, getState) => {
        const username = getState().persist.username
        const token = getState().persist.token

        const URL = `${ROOTURL}/user/${username}`

        d(on("loadingSettings"))

        axios.get(URL, headers(token))
        .then(response => {
            console.log(response.data)
            const notifications = response.data.settings.notifications

            d(change("notifyMessages", notifications.messages))
            d(change("notifyMentions", notifications.mentions))
            d(change("notifyFollows", notifications.follows))
            d(change("notifyComments", notifications.comments))
            d(change("notifyLikes", notifications.likes))
            d(change("notifyReposts", notifications.reposts))
            d(change("notifyNews", notifications.news))
            d(change("notifyReplies", notifications.replies))

            d(change("blocks", response.data.settings.blocks))

            d(off("loadingSettings"))
        })
        .catch(error => {
            console.log(error.response.data)
            visit("HomeScreen")
            d(off("loadingSettings"))
        })
    }
}

export function saveSettings(body) {
    return (d, getState) => {
        console.log("saving settings")

        const username = getState().persist.username
        const token = getState().persist.token

        const URL = `${ROOTURL}/user/${username}`

        axios.post(URL, body, headers(token))
        .then(response => {
            console.log(response)
        })
        .catch(error => {
            console.log(error)
        })
    }
}


// remove device ID on sign-out, so one device doesn't receive notifications for different accounts
export function signOut() {
    return (dispatch, getState) => {
        const username = getState().persist.username
        const token = getState().persist.token
        const deviceId = getState().values.deviceId

        const URL = `${ROOTURL}/user/${username}/removeDeviceId`

        dispatch({ type: "persist_value", payload: { label: "username", value: ""}})
        dispatch({ type: "persist_value", payload: { label: "token", value: ""}})
        dispatch({ type: "persist_value", payload: { label: "privateActiveKey", value: ""}})
        dispatch({ type: "persist_value", payload: { label: "publicMemoKey", value: ""}})
        dispatch({ type: "persist_value", payload: { label: "postingKeyGiven", value: false}})

        dispatch({ type: "persist_value", payload: { label: "inputSearch", value: ""}})
        dispatch({ type: "change_vale", payload: { label: "inputSearchUser", value: ""}})

        dispatch({ type: "visit_screen", payload: "WelcomeScreen" })

        axios.post(URL, {deviceId: deviceId}, headers(token))
        .then(response => {
            console.log(response.data)
        })
        .catch(error => {
            console.log(error)
        })   
    }
}
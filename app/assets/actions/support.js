import axios from 'axios'

import { ROOTURL } from './'

export function sendSupportMessage(username, name, email, message) {
    return (dispatch) => {
        const URL = `${ROOTURL}/support`
 
        const body = { 
            username: username,
            name: name === "" ? false : name, 
            email: email === "" ? false : email,
            message: message
        }
        
        axios.post(URL, body)
        .then(response => {
            console.log(response.data)
            dispatch({ type: "change_value", payload: { label: "sendingSupportMessage", value: false }})
            dispatch({ type: "change_value", payload: { label: "sentSupportMessage", value: true }})
            dispatch({ type: "persist_value", payload: { label: "inputSupportName", value: "" }})
            dispatch({ type: "persist_value", payload: { label: "inputSupportEmail", value: "" }})
            dispatch({ type: "persist_value", payload: { label: "inputSupportMessage", value: "" }})
        })
        .catch(error => {
            console.log(error)
        })
    }
}

export function reportItem(currentScreen, profile, post) {
    return (dispatch, getState) => {

        const username = getState().persist.username
        const URL = `${ROOTURL}/support`

        const type = currentScreen==="PostScreen" ? "post" 
        : currentScreen === "ProfileScreen" ? "profile" 
        : "N/A"

        const item = currentScreen==="PostScreen" ? post : profile
 
        const body = { 
            username: `${username} (flagged a ${type})`,
            message: `I flagged a ${type}. This ${type}:

            ${JSON.stringify(item, null, 4)}`
        }
        
        axios.post(URL, body)
        .then(response => {
            console.log(response.data)
        })
        .catch(error => {
            console.log(error.respose.data)
        })
    }
}
/* global XMLHttpRequest:false */
import 'core-js/es6/symbol'; 
import 'core-js/fn/symbol/iterator';

import '../../shim.js'
import steem from 'steem'
import axios from 'axios'

import { ROOTURL, getActivity } from './'

// use active private key for voting
// use memo public key for updating profile
export function signIn() {
    return (dispatch, getState) => {
        dispatch({ type: "change_value", payload: { label: "signInMessage", value: ""}})
        dispatch({ type: "change_value", payload: { label: "signingIn", value: true}})

        const username = getState().persist.username
        const password = getState().values.password
  
        // if username starts with STM, warn that this is public key
        if(password.substring(0, 3) === "STM") {
            dispatch({ type: "change_value", payload: { label: "signingIn", value: false}})

            return dispatch({ type: "change_value", payload: { label: "signInMessage", value: 'This code is your public key - you may have to click "Show Private Key".'}})
        }

        let publicMemoKey
        let privateActiveKey

        console.log("starting", username)
        
        // look up account name to get public and memo key
        steem.api.getAccounts([username], (err, response) => {
            console.log("returned getAccounts")
            if(err) {
                console.log(err)
                dispatch({ type: "change_value", payload: { label: "signingIn", value: false}})

                return dispatch({ type: "change_value", payload: { label: "signInMessage", value: "Couldn't connect."}})
            }
            if(response) {
                if(response.length === 0) {
                    dispatch({ type: "change_value", payload: { label: "signingIn", value: false}})

                    return dispatch({ type: "change_value", payload: { label: "signInMessage", value: "Username not found."}})
                }

                // successfully found account and memo key
                console.log("Found account.")
                console.log(response[0])
                publicMemoKey = response[0].memo_key
                const publicActiveKey = response[0].active.key_auths[0][0];
                const publicPostingKey = response[0].posting.key_auths[0][0];
                
                let valid;

                try { 
                    valid = steem.auth.wifIsValid(password, publicActiveKey); 

                    if(valid === true) {
                        // success
                        console.log("Private Active Key verified.")
                        dispatch({ type: "change_value", payload: { label: "signingIn", value: false}})
                        dispatch({ type: "persist_value", payload: { label: "publicMemoKey", value: publicMemoKey}})
                        dispatch({ type: "persist_value", payload: { label: "privateActiveKey", value: password}})
                        dispatch({ type: "track_like", payload: { label: "initial", value: true, username: username}})
                        dispatch({ type: "visit_screen", payload:"HomeScreen"})

                        serverSignIn(username, password, dispatch, getState)
                        return
                    }

                    // try treating this as a public posting key
                    
                    console.log("Correct format but not private active key - trying as private posting key.")

                    try { 
                        valid = steem.auth.wifIsValid(password, publicPostingKey); 
    
                        if(valid === true) {
                            // success
                            console.log("Private Posting Key verified.")
                            dispatch({ type: "change_value", payload: { label: "signingIn", value: false}})
                            dispatch({ type: "persist_value", payload: { label: "publicMemoKey", value: publicMemoKey}})

                            // add the private posting key as privateActiveKey (as this is what everything looks for), but set postingKeyGiven=true to block off editing profile
                            dispatch({ type: "persist_value", payload: { label: "privateActiveKey", value: password}})
                            dispatch({ type: "persist_value", payload: { label: "postingKeyGiven", value: true}})

                            dispatch({ type: "track_like", payload: { label: "initial", value: true, username: username}})
                            dispatch({ type: "visit_screen", payload:"HomeScreen"})
    
                            serverSignIn(username, password, dispatch, getState)
                            return
                        }

                        console.log("Correct format but neither private active key or posting key.")
                        dispatch({ type: "change_value", payload: { label: "signingIn", value: false}})
                        dispatch({ type: "change_value", payload: { label: "signInMessage", value: "Incorrect key."}})

                        return
                    }
                    catch(e) {
                        dispatch({ type: "change_value", payload: { label: "signingIn", value: false}})
                        dispatch({ type: "change_value", payload: { label: "signInMessage", value: "Could not verify."}})
                    }
                }
                catch(e) { 
                    // if that doesn't work, interpret the password as owner key and generate the active private key from it
                    console.log("Incorrect format - trying to interpet as Owner Key.")
                    privateActiveKey = steem.auth.toWif(username, password, 'active');

                    try { 
                        valid = steem.auth.wifIsValid(privateActiveKey, publicActiveKey); 
                        if(valid === true) {
                            // success
                            console.log("Successfully verified Private Key from Owner Key.")
                            dispatch({ type: "change_value", payload: { label: "signingIn", value: false}})
                            dispatch({ type: "persist_value", payload: { label: "publicMemoKey", value: publicMemoKey}})
                            dispatch({ type: "persist_value", payload: { label: "privateActiveKey", value: privateActiveKey}})
                            dispatch({ type: "track_like", payload: { label: "initial", value: true, username: username}})
                            dispatch({ type: "visit_screen", payload:"HomeScreen"})
                            
                            serverSignIn(username, privateActiveKey, dispatch, getState)
                            return
                        }
                        console.log("Could not verify as owner key.")
                        dispatch({ type: "change_value", payload: { label: "signingIn", value: false}})
                        dispatch({ type: "change_value", payload: { label: "signInMessage", value: "Incorrect key."}})
                        return
                    }
                    catch(e) {
                        console.log(e)
                        dispatch({ type: "change_value", payload: { label: "signingIn", value: false}})
                        dispatch({ type: "change_value", payload: { label: "signInMessage", value: "Could not verify."}})
                    }
                }
            }
        });
    }
}

// sign in and get a token from our server
function serverSignIn(username, password, dispatch, getState) {
    const deviceId = getState().values.deviceId
    const URL = `${ROOTURL}/signin/`

    axios.post(URL, {username, password, deviceId})
    .then(response => {
        console.log(response.data)
        console.log("~~~~~~~~~~~~~~~")
        console.log(response.data.token)
        dispatch({ type: "persist_value", payload: { label: "token", value: response.data.token}})
        dispatch(getActivity())
    })
    .catch(error => {
        console.log(error)
        console.log("SIGN IN ERROR ####################")
    })
}
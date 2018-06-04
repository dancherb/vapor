const initialState = {
}

// load images from chats to the global state, if they're not there already
export default (state = initialState, action) => {
    switch(action.type) {
        case "add_image": {
            // if the label is "name" and the value "Daniel", this sets state.values.name = "Daniel"
            // console.log(`Image reducing ${action.payload.label} = ${action.payload.value}`)
            return {...state, [action.payload.label]: action.payload.value}
        }

        // change a load of keys at once, as described in an object
        case "batch_add_images": {
            const payload = action.payload

            const newState = {...state}

            Object.keys(payload).forEach(user => {
                newState[`profile-${user}`] = payload[user]
            })

            console.log("batch image reducing")
            console.log(Object.keys(payload))

            return newState
        }

        default: return state;
    }
}
  
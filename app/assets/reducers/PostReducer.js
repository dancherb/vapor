const initialState = {
}

export default (state = initialState, action) => {
    switch(action.type) {
        case "change_post": {
            // if the object is "article1", the label "votes" and the value 5, this sets state.article1.likes = 5
            const { object, label, value } = action.payload

            // get or create the current object
            const currentObject = state[object] || {}

            // change the property on it
            currentObject[label] = value

            // console.log(`Post value reducing ${object}.${label} = ${value}`)
            return {...state, [object]: currentObject}
        }

        // change a load of values at once, as described in an object
        case "change_batch_posts": {
            const payload = action.payload
            
            // initialize new state object
            const newState = {...state} 

            // loop through the data passed in the payload, adding it to the new state object
            for(let i=0; i<payload.length; i++) {
                const reference = `${payload[i].author}-${payload[i].permlink}`

                if(!newState[reference]) {
                    newState[reference] = {}
                }

                newState[reference].net_votes = payload[i].net_votes
                newState[reference].children = payload[i].children
            }
            
            // set newState object
            return newState
        }
        default: return state;
    }
}
  
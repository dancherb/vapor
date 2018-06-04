const initialState = {
    userVotesList: [],
    userFollowingList: [],
}

export default (state = initialState, action) => {
    switch(action.type) {
        case "change_value": {
            // if the label is "name" and the value "Daniel", this sets state.values.name = "Daniel"
            const { label, value } = action.payload

            console.log(`Value reducing ${label} = ${value}`)
            return {...state, [label]: value}
        }

        case "change_object_value": {
            // if the object is "cats", the label "simba" and the value "cool", this sets state.cats.simba = "cool"
            const { object, label, value } = action.payload

            const currentObject = state[object]
            currentObject[label] = value

            console.log(`Object value reducing ${object}.${label} = ${value}`)
            return {...state, [object]: currentObject}
        }
        default: return state;
    }
}
  
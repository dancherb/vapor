const initialState = {
    feedType: "hot",
    inputPostUpvote: true // this can also be false, so passing in || true where we usually would means we'd ignore the false value
}

export default (state = initialState, action) => {    
    switch(action.type) {
        case "persist_value": {
            const { label, value } = action.payload
            
            // if the label is "name" and the value "Daniel", this sets state.persist.name = "Daniel"
            console.log(`Persisting ${label} = ${value}`)
            return {...state, [label]: value}
        }

        // use persistObject("gifts", { name: "hamster" })
        case "persist_object": {
            const { label, value } = action.payload

            // create a new list, adding to current state (e.g. state.persist.events)
            let newList = [...state[label], value]

            // if our object matches a given type, send it for sorting
            if(label === "friends" || label === "events") {
                newList = sortList(newList, label)
            }

            // return the new list in place of the label
            return { 
                ...state,
                [label]: newList
            }
        }

        // updates object based on it having a name field that matches "object" value passed in
        // updatePersistObject("gifts", "hat", "description", "sick hat")
        case "update_persist_object": {
            const { label, object, field, value } = action.payload

            // declare in advance
            let indexToUpdate;
            
            // for every item in the labelled array in this slice of state...
            for (let i = 0; i < state[label].length; i++) {
                // if the item's name is equal to the object name passed in...
                if (state[label][i].name === object) {
                    indexToUpdate = i;
                }
            }

            // create new array that maps over objects in the existing array
            const newList = state[label].map((item, index) => {
                if(index !== indexToUpdate) {
                    // if index doesn't match, return unchanged item
                    return item;
                }
                // if it does, return updated object
                return {
                    ...item,
                    [field]: value
                };    
            });

            // update state with this new list
            return {
                ...state,
                [label]: newList
            }
        }  

        // deletes object based on its name value matching the value passed in
        // removePersistObject("gifts", "hat")
        case "remove_persist_object": {
            const { label, value } = action.payload
            
            // declare in advance
            let indexToDelete;
            
            // for every item in the labelled array in this slice of state...
            for (let i = 0; i < state[label].length; i++) {
                // if the items name is equal to the value passed in...
                if (state[label][i].name === value) {
                    indexToDelete = i;
                    console.log(indexToDelete)
                }
            }

            // look at the slice of state based on the label. go through and remove any items whose index matches the index we want to delete.
            return { 
                ...state, 
                [label]: state[label].filter((item, index) => index !== indexToDelete)                
           };
        }
        default: return state;
    }
}

// if sent here, re-ordering the array based on what it is
// if "friend", by name. if "event", by sortDate (e.g. 2017-10-30)

function sortList(list, label) {
        const sortedList = label === "friends" ? list.slice().sort(sortFriend)
        : list.slice().sort(sortEvent)
        return sortedList
}

function sortEvent(a, b) {
    if (a.sortDate < b.sortDate) {
    return -1;
    }
    if (a.sortDate > b.sortDate) {
    return 1;
    }
    return 0;
}

function sortFriend(a, b) {
    // console.log("sorting friends")
    if (a.name.toLowerCase() < b.name.toLowerCase()) {
    return -1;
    }
    if (a.name.toLowerCase() > b.name.toLowerCase()) {
    return 1;
    }
    return 0;
}
  
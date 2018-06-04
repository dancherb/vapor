export function change(label, value) {
    return (dispatch) => {
        dispatch({ type: "change_value", payload: { label: label, value: value }})
    }
}

export function persist(label, value) {
    return (dispatch) => {
        dispatch({ type: "persist_value", payload: { label: label, value: value }})
    }
}

export function on(value) {
    return (dispatch) => {
        dispatch({ type: "change_value", payload: { label: value, value: true }})
    }
}

export function off(value) {
    return (dispatch) => {
        dispatch({ type: "change_value", payload: { label: value, value: false }})
    }
}

export function clear(value) {
    return (dispatch) => {
        dispatch({ type: "change_value", payload: { label: value, value: "" }})
    }
}

export function visit(screen) {
    return (dispatch) => {
        dispatch({ type: "visit_screen", payload: screen})
    }
}

export function sortByField(array, field, order) {
    return array.sort((a, b) => {
      if (a[field] < b[field]) {
          if(order === "reverse") {
            return 1
          } else {
            return -1;
          }
      }
      if (a[field] > b[field]) {
          if(order === "reverse") {
            return -1
          } else {
            return 1;
          }
      }
      return 0;
    })
}
  
export function sortByNewestMessage(array) {
    return array.sort((a, b) => {
        if (a.messages[0].date < b.messages[0].date) {
            return 1;
        }
        if (a.messages[0].date > b.messages[0].date) {
            return -1;
        }
        return 0;
    })
}

export function removeArrayDuplicates(array) {
    const uniques = {}

    for(let i=0; i<array.length; i++) {
        if(!uniques[array[i]]) {
            uniques[array[i]] = true
        }
    }

    const filtered = []

    Object.keys(uniques).forEach(key => {
        filtered.push(key)
    })

   return filtered
}
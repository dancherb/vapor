import Navigator, { firstScreen } from '../screens'

const initialState = goTo(firstScreen);

export default (state = initialState, action) => {
    let nextState;
    
    switch (action.type) {
        case 'visit_screen':
            nextState = goTo(action.payload)
            break;

        default:
            nextState = Navigator.router.getStateForAction(action, state);
            break;
    }

    return nextState || state;
}

function goTo(screen) {
    return Navigator.router.getStateForAction(Navigator.router.getActionForPathAndParams(screen))
}
import React, { Component } from 'react';
import { View, Platform, UIManager, StatusBar } from 'react-native';
import { createStore, applyMiddleware } from 'redux'
import { Provider, connect } from 'react-redux'
import { addNavigationHelpers } from 'react-navigation';
import { createReduxBoundAddListener, createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';
import Notifications from 'react-native-onesignal';
import ReduxThunk from 'redux-thunk';
import { persistStore } from 'redux-persist';

import Navigator from './assets/screens'
import reducers from './assets/reducers'

import { getActivity, loadChat } from './assets/actions'

import Background from './assets/c/Background'
import Header from './assets/c/Header'

console.disableYellowBox = true;


// set up redux middleware with react-navigation
const NavMiddleware = createReactNavigationReduxMiddleware("root", state => state.nav);
const addListener = createReduxBoundAddListener("root");

// create redux store
const store = createStore(
    reducers, // pass in reducers index file
    {},  // pass in initial state
    applyMiddleware(ReduxThunk, NavMiddleware) // pass in store enhancers, e.g. applyMiddleware(ReduxThunk)
)

// enable redux persist. use persistStore(store).purge() to reset any saved state 
persistStore(store)
// .purge()

// enable LayoutAnimation.spring for Android
if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// wire up a navigator component with Redux
class SetupNavigator extends Component {
    render() {
        return(
            <Navigator 
                navigation={addNavigationHelpers({
                dispatch: this.props.dispatch,
                state: this.props.nav,
                addListener
            })} />
        )
    }
}

const mapStateToProps = (state) => ({
    nav: state.nav
});

// rebuild it as ReduxNavigator, which we can now pass into our main app
const ReduxNavigator = connect(mapStateToProps)(SetupNavigator);

export default class App extends Component {
     
    constructor() {
        super()
        this.store = store

        Notifications.inFocusDisplaying(0);
        Notifications.addEventListener('received', this.onReceived);
        Notifications.addEventListener('opened', this.onOpened);
        Notifications.addEventListener('ids', this.onIds);
    }

    onReceived = (notification) => {
        this.store.dispatch(getActivity())
        this.store.dispatch(loadChat())
    }

    onOpened = (openResult) => {
      const type = openResult.notification.payload.additionalData.type 
      const destination = type === "message" ? "ChatListScreen" : "NotificationsScreen"
      this.store.dispatch({type: "change_value", payload: { label: "notificationDestination", value: destination }})
    }

    onIds = (device) => {
        this.store.dispatch({type: "change_value", payload: { label: "deviceId", value: device.userId}}) 
    } 

    render() {
        return (
            <Provider store={this.store}>
                <View style={{flex: 1}}>
                    <StatusBar barStyle="light-content" backgroundColor='rgba(255,255,255,0)' translucent hidden={false}/>
                    <Background>
                        <Header/>
                        <ReduxNavigator/>
                    </Background>
                </View>
            </Provider>
        );
    }
}
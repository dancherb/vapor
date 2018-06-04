import React, { Component } from 'react';
import { View, ActivityIndicator, LayoutAnimation } from 'react-native';

import { connect } from 'react-redux'
import { visitScreen, changeValue, persistValue, signIn, confirmKey, getActivity } from '../actions'

import T from '../c/T'
import Bubble from '../c/Bubble'
import Row from '../c/Row'
import Input from '../c/Input'

class Screen extends Component {
    componentDidMount() {
        // store toggleDrawer function in global state for components outside of ReduxNavigator (i.e. header) to access
        this.props.changeValue("toggleDrawer", () => this.props.navigation.navigate("DrawerToggle"))
        
        // clear password
        this.props.changeValue("password", "")

        setTimeout(() => {
            if(!this.props.welcomeScreenLoaded) {
                if(this.props.username && this.props.privateActiveKey) {
                    this.props.getActivity()

                    // check for destination from opening notification
                    if(this.props.notificationDestination) {
                        this.props.visitScreen(this.props.notificationDestination)
                    } 
                    else {
                        this.props.visitScreen("HomeScreen")
                    }
                    this.props.changeValue("notificationDestination", false)
                } else {
                    this.props.changeValue("welcomeScreenLoaded", true)
                    LayoutAnimation.easeInEaseOut()
                }
            }
        }, 30)
    }
    render() {
        // also hide if we haven't checked if the user's logged in yet (to avoid a flash)
        if(!this.props.welcomeScreenLoaded) {
            return <View/>
        }
        return(
            <View style={{flex: 1, justifyContent:"center", alignItems: "center"}}>

                <View style={{alignItems: "center"}}>
                    <View style={{width: 230, height: 50, justifyContent: "flex-end", alignItems: "center"}}>
                        <T mini>
                            {this.props.signInMessage || `Sign in with your Steemit account.`}
                        </T>
                        {!this.props.signInMessage &&
                        <T mini fade>
                            Use your private posting key or private active key (required to update your profile).
                        </T>}
                    </View>

                    <Input icon="userO" lowerCase autoCapitalize='none' persist label="username" placeholder="Username."/>
                    <Input icon="key" autoCapitalize='none' label="password" placeholder="Password / Private Key."/>                    

                    <Row>
                        <View style={{width: 30}}/>

                        <Bubble style={{marginTop: 10}} menu checkFields={[this.props.username, this.props.password, !this.props.signingIn]} onPress={() => this.props.signIn()}>
                            Sign In
                        </Bubble>
                        
                        {this.props.signingIn &&
                        <ActivityIndicator size="small" style={{width: 30}} color="white"/>}

                        {!this.props.signingIn &&
                        <View style={{width: 30}}/>}
                    </Row>

                    <Bubble menu onPress={() => {
                        if(!this.props.username || this.props.username === "") {
                            this.props.changeValue("signInMessage", "Please enter a username.")
                        } else {
                            this.props.visitScreen("ScanScreen")
                        }
                    }}>
                        Scan QR
                    </Bubble>
                    <Bubble menu onPress={() => {
                        this.props.persistValue("username", "")
                        this.props.persistValue("password", "")
                        this.props.visitScreen("HomeScreen")
                    }}>
                        No account?
                    </Bubble>

                    <View style={{height: 50}}/>
                </View>

            </View>
        )
    }
}

const mapStateToProps = state => {
    return { 
        username: state.persist.username,
        password: state.values.password,
        profilePictures: state.profilePictures,

        signingIn: state.values.signingIn,
        signInMessage: state.values.signInMessage,

        privateActiveKey: state.persist.privateActiveKey,

        welcomeScreenLoaded: state.values.welcomeScreenLoaded,

        notificationDestination: state.values.notificationDestination,
    }
};
  
export default connect(mapStateToProps, { visitScreen, changeValue, persistValue, signIn, confirmKey, getActivity })(Screen);
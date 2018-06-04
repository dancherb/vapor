import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { connect } from 'react-redux'
import { SafeAreaView } from 'react-navigation';
import FontAwesome, { Icons } from 'react-native-fontawesome';

import { visitScreen, changeValue, persistValue, signOut } from '../actions'
import style from '../style'
import { getCurrentScreen } from '../screens'

const signUpURL = "https://signup.steemit.com/"


class Menu extends Component {
    render() {    
        const currentScreen = this.props.currentScreen
        return (
            <SafeAreaView style={{flex: 1, alignItems: "center", backgroundColor: style.theme}}>
                
                <Item 
                    label="Home" 
                    active={currentScreen==="HomeScreen"}
                    onPress={() => this.props.visitScreen("HomeScreen")}
                />

                {!this.props.signedOut &&
                <Item 
                    label="New Post" 
                    active={currentScreen==="NewPostScreen"}
                    onPress={() => this.props.visitScreen("NewPostScreen")}
                />}

                <Item 
                    label="Feed" 
                    active={currentScreen==="TabScreen"}
                    onPress={() => this.props.visitScreen("FeedScreen")}
                />

                {!this.props.signedOut &&
                <Item 
                    label="Profile" 
                    active={currentScreen==="EditProfileScreen"}
                    onPress={() => {
                        this.props.visitScreen("ProfileScreen")
                        this.props.changeValue("viewingProfile", this.props.username)   
                    }}
                />}
                
                {!this.props.signedOut &&
                <Item 
                    label="Notifications" 
                    active={currentScreen==="NotificationsScreen"}
                    onPress={() => this.props.visitScreen("NotificationsScreen")}
                />}

                {!this.props.signedOut &&
                <Item 
                    label="Messages" 
                    active={currentScreen==="ChatListScreen"}
                    onPress={() => this.props.visitScreen("ChatListScreen")}
                />}

                {!this.props.signedOut &&
                <Item 
                    label="Settings" 
                    active={currentScreen==="SettingsScreen"}
                    onPress={() => this.props.visitScreen("SettingsScreen")}
                />}

                <Item 
                    label="Contact Us" 
                    active={currentScreen==="SupportScreen"}
                    onPress={() => this.props.visitScreen("SupportScreen")}
                />

                {this.props.signedOut &&
                <Item 
                    label="Sign Up" 
                    active={false}
                    onPress={() => Linking.openURL(signUpURL).catch(err => console.log(err))}
                />}
                
                {this.props.signedOut &&
                <Item 
                    label="Sign In" 
                    active={false}
                    onPress={() => this.props.visitScreen("WelcomeScreen")}
                />}

                {!this.props.signedOut &&
                <Item 
                    label="Sign Out" 
                    active={false}
                    onPress={() => this.props.signOut()}
                />}

                <Text style={{color: 'rgba(255,255,255,0.5)', width: "100%", paddingLeft: 21, paddingTop: 12, fontSize: 11, textAlign: "left", fontWeight: Platform.OS === "ios" ? "bold" : undefined, fontFamily: Platform.OS === "ios" ? "Nunito" : 'Nunito-Bold'}}>
                    {!this.props.signedOut ? 
                    `Signed in as ${this.props.username}.`
                    : "Not signed in."}
                </Text>

            </SafeAreaView>
        )
    }
}

const mapStateToProps = (state) => {
    return { 
        currentScreen: getCurrentScreen(state.nav, "top"),
        username: state.persist.username,
        signedOut: !state.persist.username || state.persist.username === ""
    }
};

export default connect(mapStateToProps, {visitScreen, changeValue, persistValue, signOut })(Menu);

function Item(props) {   
    return(
    <TouchableOpacity onPress={props.onPress} style={{
        flexDirection: "row", 
        width: "90%", 
        height: 45, 
        borderBottomWidth: props.noBottom ? 0 : 0.5, 
        borderColor: 'rgba(255,255,255,0.5)', 
        justifyContent: "flex-start", 
        alignItems: "center"
    }}>

        {props.activeX ? // disabled for now
        <FontAwesome style={{color: "white", paddingRight: 5, paddingTop: 2, paddingLeft: 0, fontSize: 8 }}>
            {Icons.chevronRight}
        </FontAwesome>
        :
        <View style={{width: 10}}/>}
 
        <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Nunito-Light'}}>
            {props.label}
        </Text>
    </TouchableOpacity>
    )
}

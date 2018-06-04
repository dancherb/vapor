import React, { Component } from 'react';
import { View, Linking, ScrollView, ActivityIndicator, LayoutAnimation, KeyboardAvoidingView, Platform } from 'react-native';
import { connect } from 'react-redux'
import FontAwesome, { Icons } from 'react-native-fontawesome';
import validator from 'email-validator';

import { changeValue, visitScreen, loadFeed, getUserVotesList, getUserFollowingList, sendInvite } from '../actions'

import T from '../c/T'
import Row from '../c/Row'
import Bubble from '../c/Bubble'
import Input from '../c/Input'

import style from '../style'

const signUpURL = "https://signup.steemit.com/?ref=vaporapp"


class Screen extends Component {
    componentDidMount() {
        this.props.changeValue("welcomeScreenLoaded", true)

        // preload the feed
        this.props.changeValue("feed", [])
        this.props.changeValue("loadingResults", true)
        this.props.loadFeed(this.props.feedType, this.props.inputSearch, this.props.searchType)
        if(!this.props.feed) {
            // also at the start of every session, the user's following list and votes list
            this.props.getUserFollowingList()
            this.props.getUserVotesList()
        }
        // clear invite friend
        this.props.changeValue("inputInviteFriendUsername", "")
        this.props.changeValue("inputInviteFriendEmail", "")
        this.props.changeValue("showInviteFriend", false)
        this.props.changeValue("friendInviteSuccess", false)
        this.props.changeValue("friendInviteProgress", false)
        this.props.changeValue("friendInviteError", false)
    }
    componentDidUpdate(prevProps) {
        if(
            prevProps.showInviteFriend !== this.props.showInviteFriend
            || prevProps.unreadChats !== this.props.unreadChats 
            || prevProps.unreadNotifications !== this.props.unreadNotifications
        ) {
            LayoutAnimation.easeInEaseOut()
        }
    }
    searchUser() {
        if(this.props.inputSearchUser && this.props.inputSearchUser !== "") {
            this.props.visitScreen("ProfileScreen")
            this.props.changeValue("rootScreen", "HomeScreen") // signals: only go back here when no "last screen" left
            this.props.changeValue("viewingProfile", this.props.inputSearchUser.toLowerCase())
        }
    }
    render() {
        const username = this.props.username
        return(
            <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === "ios" ? "padding" : null}>
            <ScrollView contentContainerStyle={{justifyContent: "space-between", alignItems: "center"}}>

                <View style={{alignItems: "center", marginVertical: style.h/18}}>

                    <Input width={270} style={{height: 40, marginBottom: 5}} noMargin autoCapitalize="none" icon="bullseye" label="inputSearchUser" placeholder="Find a user." onEndEditing={() => this.searchUser()}/>

                    <Row>
                        <Bubble onPress={() => {
                            this.props.visitScreen("FeedScreen")
                        }}>
                            Feed
                        </Bubble>

                        {username === "" &&
                        <Bubble onPress={() => this.props.visitScreen("SupportScreen")}>
                            Contact Us
                        </Bubble>}

                        {username !== "" &&
                        <Bubble onPress={() => {
                            this.props.changeValue("rootScreen", "HomeScreen")
                            this.props.visitScreen("ProfileScreen")
                            this.props.changeValue("viewingProfile", this.props.username)
                        }}>
                            Profile
                        </Bubble>}
                    </Row>

                    {username !== "" &&
                    <Row>
                        <Bubble onPress={() => this.props.visitScreen("NotificationsScreen")}>
                            Notifications
                            {this.props.unreadNotifications > 0 && `\n(${this.props.unreadNotifications} new)`}
                        </Bubble>

                        <Bubble onPress={() => this.props.visitScreen("ChatListScreen")}>
                            Chats
                            {this.props.unreadChats > 0 && `\n(${this.props.unreadChats} new)`}
                        </Bubble>
                    </Row>}

                    {username !== "" &&
                    <Row>
                        <Bubble onPress={() => this.props.visitScreen("SettingsScreen")}>
                            Settings
                        </Bubble>

                        <Bubble onPress={() => this.props.visitScreen("SupportScreen")}>
                            Contact Us
                        </Bubble>
                    </Row>}

                    {username === "" &&
                    <Row>
                        <Bubble onPress={() => this.props.visitScreen("WelcomeScreen")}>
                            Sign In
                        </Bubble>

                        <Bubble onPress={() => Linking.openURL(signUpURL).catch(err => console.log(err))}>
                            Sign Up
                        </Bubble>
                    </Row>}

                    {!this.props.showInviteFriend &&
                    <Row>
                        <Bubble width={270} height={50} onPress={() => {
                            this.props.changeValue("showInviteFriend", !this.props.showInviteFriend)
                        }}>
                            Invite A Friend
                        </Bubble>
                    </Row>}

                    {this.props.showInviteFriend &&
                    <View>

                        <Input 
                        onChangeText={() => {
                            this.props.changeValue("friendInviteError", false)
                            this.props.changeValue("friendInviteSuccess", false)
                        }} 
                        width={270} style={{height: 40, marginBottom: 5, marginTop: 5}} noMargin autoCapitalize="none" icon="userPlus" label="inputInviteFriendUsername" placeholder="Friend's username."/>

                        <Input onChangeText={() => {
                            this.props.changeValue("friendInviteError", false)
                            this.props.changeValue("friendInviteSuccess", false)
                        }} 
                        width={270} style={{height: 40, marginBottom: 5}} noMargin autoCapitalize="none" icon="paperPlane" label="inputInviteFriendEmail" placeholder="Friend's email."/>

                        <Row>
                            <Bubble height={50} style={{flex: 1, marginRight: 5, marginLeft: 0, marginTop: 0, marginBottom: 0}} onPress={() => {
                                this.props.changeValue("showInviteFriend", false)
                                this.props.changeValue("inputInviteFriendUsername", "")
                                this.props.changeValue("inputInviteFriendEmail", "")
                                this.props.changeValue("friendInviteSuccess", false)
                                this.props.changeValue("friendInviteError", false)
                            }}>
                                Back
                            </Bubble>

                            {this.props.friendInviteProgress ?
                            <ActivityIndicator size="small" style={{height: 50, flex: 3}} color="white"/>
                            :
                            this.props.friendInviteSuccess ? 
                            <View style={{flex: 3, width: 50, alignItems: "center", justifyContent: "center"}}>
                                <FontAwesome style={{ color: "#ffffff90", fontSize: 21}}>
                                    {Icons.check}
                                </FontAwesome>
                            </View>
                            :
                            <Bubble 
                            height={50} 
                            style={{flex: 3, marginRight: 0, marginLeft: 0, marginTop: 0, marginBottom: 0}} 
                            checkFields={[validator.validate(this.props.inputInviteFriendEmail) || this.props.inputInviteFriendUsername]} 
                            onPress={() => this.props.sendInvite(this.props.inputInviteFriendUsername, this.props.inputInviteFriendEmail)}>
                                Invite
                            </Bubble>}
                            
                        </Row> 

                        <View style={{width: 270, height: 40, marginTop: 5, justifyContent: "flex-start"}}>
                            <T fontB size={13} style={{opacity: 0.9}}>
                                {this.props.friendInviteSuccess ?
                                "Thanks! Send as many invites as you like."
                                :
                                this.props.friendInviteError ?
                                this.props.friendInviteError
                                : 
                                "Invite a friend with a username and/or email and we'll give you free STEEM if they sign up."}
                            </T>
                        </View>
                    
                    </View>}

                    {username === "" &&
                    <View style={{width: 270, paddingTop: 10}}>
                        <T fade mini>To access features like messaging, notifications and posting, please touch above or visit the Steemit website to sign up.</T>
                    </View>}
                </View>

            </ScrollView>
            </KeyboardAvoidingView>
        )
    }
}

const mapStateToProps = state => {
    return { 
        username: state.persist.username,
        token: state.persist.token,
        inputSearchUser: state.values.inputSearchUser,

        showFeedModal: state.values.showFeedModal || false,
        viewingPost: state.values.viewingPost,
        fromUserProfile: state.values.fromUserProfile,
        showProfileModal: state.values.showProfileModal || false,

        feed: state.values.feed,
        feedType: state.persist.feedType,
        inputSearch: state.persist.inputSearch,
        searchType: state.persist.searchType || "hot",

        showInviteFriend: state.values.showInviteFriend,
        friendInviteSuccess: state.values.friendInviteSuccess,
        friendInviteProgress: state.values.friendInviteProgress,
        friendInviteError: state.values.friendInviteError,

        inputInviteFriendUsername: state.values.inputInviteFriendUsername,
        inputInviteFriendEmail: state.values.inputInviteFriendEmail,

        unreadChats: state.values.unreadChats || 0,
        unreadNotifications: state.values.unreadNotifications
    }
};
  
export default connect(mapStateToProps, {changeValue, visitScreen, loadFeed, getUserVotesList, getUserFollowingList, sendInvite})(Screen);
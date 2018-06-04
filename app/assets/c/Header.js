import React, { Component } from 'react';
import { View, TouchableOpacity, Image, BackHandler, DeviceEventEmitter, LayoutAnimation, Platform, Keyboard } from 'react-native';
import { connect } from 'react-redux'
import FontAwesome, { Icons } from 'react-native-fontawesome';

import { visitScreen, changeValue, persistValue, loadFeed, reportItem, getActivity } from '../actions'

import Block from './Block'
import T from './T'
import Row from './Row'

import style from '../style'

import { getCurrentScreen, isDrawerOpen, screens, tabs } from '../screens'

const logo = require('../img/logo.png')

class Header extends Component {
    backPressSubscriptions = new Set()

    componentDidMount() {
        this.setupBackButton()
        // this.startFetching()
    }
    startFetching() {
        // this is the method we used before, to short poll the server for updates - now we rely on push notifications. if the user setting is off, these only occur silently when the app is open. if on, these also send visible push notifications when the app is closed. either way, when the app is open we re-fetch.
        this.messagesInterval = setInterval(() => {
            if(!this.props.signedOut && this.props.currentScreen !== "WelcomeScreen" && this.props.currentScreen !== "ScanScreen") {
                if(this.props.token && this.props.username) {
                    this.props.getActivity()
                }
            }
        }, 10000)
    }
    componentWillUnmount() {
        DeviceEventEmitter.removeAllListeners('hardwareBackPress')
        this.backPressSubscriptions.clear()
    }
    componentWillUpdate(nextProps) {
        if(nextProps.currentScreen !== this.props.currentScreen) {
            // clear flag status
            this.props.changeValue("flagSuccess", false)
        }
        if(nextProps.topScreen !== this.props.topScreen) {
            // animation
            LayoutAnimation.configureNext({
                duration: 400,
                create: {
                  type: LayoutAnimation.Types.easeInEaseOut,
                  property: LayoutAnimation.Properties.opacity,
                },
                update: { type: LayoutAnimation.Types.easeInEaseOut },
                destroy: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
            });
        }
    }
    componentDidUpdate(prevProps) {
        const { notificationDestination, currentScreen } = this.props

        // if notificationDestination just changed to something (i.e. not just removed), and we're not on the welcome or scan screens (i.e. app already open and ready), go there 
        if(notificationDestination && notificationDestination !== prevProps.notificationDestination) {
            if(currentScreen !== "WelcomeScreen" && currentScreen !== "ScanScreen") {
                this.props.visitScreen(this.props.notificationDestination)
                this.props.changeValue("notificationDestination", false)
            }
        }
    }
    setupBackButton() {
        // BackHandler not working properly for this project - maybe something to do with nodeify-rn. workaround
            DeviceEventEmitter.removeAllListeners('hardwareBackPress')
            DeviceEventEmitter.addListener('hardwareBackPress', () => {
            let invokeDefault = true
            const subscriptions = []

            this.backPressSubscriptions.forEach(sub => subscriptions.push(sub))

            for (let i = 0; i < subscriptions.reverse().length; i += 1) {
                if (subscriptions[i]()) {
                    invokeDefault = false
                    break
                }
            }

            if (invokeDefault) {
                BackHandler.exitApp()
            }
        }) 
        this.backPressSubscriptions.add(this.handleHardwareBack)
    }
    handleHardwareBack = () => {
        // get data - true (just remain in app), false (exit app) or a string (screen to nav to)
        // if currentScreen doesn't have a "back" (i.e. is a tab screen), look in tabs object
        const back = this.props.tab ? tabs[this.props.currentScreen].back : screens[this.props.currentScreen].back

        // if back is explicitly true or false (just remain in app or exit app), do that
        if(back === true || back === false) {
            return back;
        }

        // otherwise, back is a string that represents where to nav to - same as if we touch back on nav bar
        this.touchBack()
        
        return true // and signal to remain in app
    }
    touchBack() {
         // if on CommentsScreen...
         if(this.props.currentScreen === "CommentsScreen") {
            console.log("comment tree")
            console.log(this.props.commentTree)
            if(!this.props.commentTree || this.props.commentTree.length === 0) {
                // if on top level comment, go back to PostScreen. from there, it may look at lastScreen
                this.props.visitScreen("PostScreen")
                return
            }
            // if first level down in comment tree, clear viewing comments so we're viewing post again
            if(this.props.commentTree.length === 1) {
                this.props.changeValue("viewingComment", false)
                this.props.changeValue("commentTree", [])
            } 

            // otherwise, remove lowest one from comment tree
            const newTree = this.props.commentTree.slice()
            newTree.pop()

            // go to the new lowest one in the tree
            this.props.changeValue("viewingComment", newTree[newTree.length-1])
            
            // update tree in global state
            this.props.changeValue("commentTree", newTree)
            
            return
        } 

        // if not on comments screen and pressed "back", clear any comment tree history
        this.props.changeValue("commentTree", [])
        this.props.changeValue("viewingComment", false)

        // store "last screen" when navigating to or from PostScreen or ProfileScreen. 
        // clear it when navigating to FeedScreen, or when "using up" lastScreen
        if(this.props.currentScreen === "PostScreen" || this.props.currentScreen === "ProfileScreen") {
            if(this.props.lastScreen) {
                this.props.visitScreen(this.props.lastScreen)
                this.props.changeValue("lastScreen", false)
                return
            } else {
                if(this.props.rootScreen) {
                    this.props.visitScreen(this.props.rootScreen)
                    this.props.changeValue("rootScreen", false)
                } 
                else {
                    this.props.visitScreen("FeedScreen")
                }
                return
            }
        }

        let newFeedType
        // if on feed screen and chosen "search", go back to normal mode
        if(this.props.currentScreen === "FeedScreen" && this.props.feedType === "search") {
            //make feed type match current search type
            if(this.props.searchType === "hot" || this.props.searchType === "new") {
                newFeedType = this.props.searchType
            } else {
                newFeedType = "following"
            }
            this.triggerLoadFeed(newFeedType)
            // LayoutAnimation.spring()
            return
        }

        // handle custom back actions, or just send them to the given destination screen
        if(this.props.currentScreen === "SupportScreen") {
            if(!this.props.supportFieldFilled) {
                this.props.visitScreen("HomeScreen")
            } else {
                this.props.changeValue("showSupportModal", true)
            }
        } 
        else if(this.props.currentScreen === "EditProfileScreen") {
            if(this.props.uploadingProfilePicture !== true && !this.props.updatingProfile) {
                if(!this.props.changedProfile) {
                    this.props.changeValue("viewingProfile", this.props.username)
                    this.props.visitScreen("ProfileScreen")
                } else {
                    this.props.changeValue("showProfileModal", true)
                }
            }
        }
        else if(this.props.currentScreen === "NewPostScreen") {
            if(this.props.newPostFieldFilled) {
                this.props.changeValue("showNewPostModal", !this.props.showNewPostModal)
            } else {
                this.props.visitScreen("FeedScreen")
            }
        }
        else {
            if(this.props.back === "lastScreen") {
                this.props.visitScreen(this.props.lastScreen)
            } else {
                // just visit where it says in the screens object!
                this.props.visitScreen(this.props.back)
            }
        }
    }
    triggerLoadFeed(newFeedType) {
        this.props.changeValue("feed", [])
        this.props.changeValue("loadingResults", true)
        this.props.persistValue("feedType", newFeedType)
        this.props.loadFeed(newFeedType, this.props.inputSearch || "", this.props.searchType)
    }
    reportItem() {
        this.props.changeValue("flagSuccess", true)
        if(!this.props.flagSuccess) {
            this.props.reportItem(this.props.currentScreen, this.props.viewingProfile, this.props.viewingPost)
        }
    }
    getRightButtons() {
        const currentScreen = this.props.currentScreen
        const container = []

        if(currentScreen === "WelcomeScreen" || currentScreen === "ScanScreen") {
            return container
        }

        if(this.props.unreadNotifications > 0 && currentScreen !== "HomeScreen" && currentScreen !== "NotificationsScreen") {
            container.push(
                <TouchableOpacity key="bell" onPress={() => this.props.visitScreen("NotificationsScreen")}
                    style={{height: 60, paddingTop: Platform.OS === "ios" ? 18 : 15, justifyContent: "center", alignItems: "flex-end"}}>
                        <FontAwesome style={{color: "white", paddingRight: 5, paddingTop: 6, fontSize: 15 }}>
                            {Icons.bell}
                            <T mini bold size={14}>
                                {" "}{this.props.unreadNotifications}
                            </T>
                        </FontAwesome>
                </TouchableOpacity>
            )
        }

        if(!this.props.signedOut && (currentScreen === "FeedScreen" || currentScreen === "HomeScreen")) {
            container.push(
                <TouchableOpacity key="pencil" onPress={() => this.props.visitScreen("NewPostScreen")}
                style={{height: 60, paddingLeft: 2, paddingRight: 10, paddingTop: 8, justifyContent: "center", alignItems: "flex-end"}}>
                    <FontAwesome style={{color: "white", paddingTop: 12, fontSize: 17 }}>
                        {Icons.pencil}
                    </FontAwesome>
                </TouchableOpacity>
            )
        } 
        else if(currentScreen === "PostScreen" || (currentScreen === "ProfileScreen" && this.props.viewingProfile !== this.props.username)) {
            container.push(
                <TouchableOpacity key="flag" activeOpacity={this.props.flagSuccess ? 1 : 0.35} onPress={() => this.reportItem()}
                style={{height: 60, paddingLeft: 2, paddingRight: 10, paddingTop: 10, justifyContent: "center", alignItems: "flex-end"}}>
                    <FontAwesome style={{color: "white", paddingTop: 12, fontSize: 16 }}>
                        {this.props.flagSuccess ? Icons.check : Icons.flag}
                    </FontAwesome>
                </TouchableOpacity>
            )
        }

        container.push(
            <View key="filler" style={{width: 5}}/>
        )

        return container
    }
    getLeftButtons() {
        const currentScreen = this.props.currentScreen
        const container = []

        if(currentScreen === "WelcomeScreen") {
            return container
        }
        
        if(this.props.back && !this.props.updatingProfile && this.props.uploadingProfilePicture !== true) {
            container.push(
                <TouchableOpacity 
                key="back" style={{height: 60, paddingTop: 10, paddingRight: 14.5, justifyContent: "center", alignItems: "flex-start"}} 
                onPress={() => this.touchBack()}>
                    <FontAwesome style={{color: "white", paddingLeft: 15, paddingTop: 13.5, fontSize: 16 }}>
                        {Icons.chevronLeft}
                    </FontAwesome>
                </TouchableOpacity>
            )
        } 
        else if(this.props.menu) {
            container.push(
                <TouchableOpacity 
                key="menu" style={{height: 60, paddingTop: 10, paddingRight: 11, justifyContent: "center", alignItems: "flex-start"}} 
                onPress={() => this.props.toggleDrawer()}>
                    <FontAwesome style={{color: "white", paddingLeft: 15, paddingTop: 12, fontSize: 17 }}>
                        {Icons.bars}
                    </FontAwesome>
                </TouchableOpacity>
            )
        }

        if(this.props.unreadChats > 0 && currentScreen !== "HomeScreen" && currentScreen !== "ChatListScreen" && currentScreen !== "ScanScreen") {
            container.push(
                <TouchableOpacity key="mail" onPress={() => this.props.visitScreen("ChatListScreen")}
                    style={{height: 60, paddingTop: Platform.OS === "ios" ? 18.5 : 15, justifyContent: "center", alignItems: "flex-end"}}>
                        <FontAwesome style={{color: "white", paddingRight: 5, paddingTop: 8, paddingBottom: 4, fontSize: 16 }}>
                            {Icons.envelope}
                            <T mini bold size={14}>
                                {" "}{this.props.unreadChats}
                            </T>
                        </FontAwesome>
                </TouchableOpacity>
            )
        }

        return container
    }
    render() {
        return(
            <TouchableOpacity activeOpacity={1} onPress={() => Keyboard.dismiss()} style={{flexDirection: "row", justifyContent: "space-between", paddingBottom: 5, backgroundColor: style.theme}}>
                <Row style={{flex: 2, justifyContent: "flex-start"}}>
                    {this.getLeftButtons()}
                </Row>

                <Row style={{flex: 3, height: 60}}>
                    {this.props.header === "vapor" &&
                    <Image source={logo} style={{width: 20, height: 40, marginTop: Platform.OS === "ios" ? 10 : 0}}/>}
                    <T h2 style={{paddingTop: Platform.OS === "ios" ? 23 : 13}}>{this.props.header}</T>
                </Row>
                
                <Row style={{flex: 2, justifyContent: "flex-end"}}>
                    {this.getRightButtons()}
                </Row>
            </TouchableOpacity>
        )
    }
}

const mapStateToProps = state => {
    const currentScreen = getCurrentScreen(state.nav)
    const tab = getCurrentScreen(state.nav, "top") === "TabScreen"

    const back = tab ? tabs[currentScreen].back : screens[currentScreen].back 
    const header = tab ? tabs[currentScreen].header : screens[currentScreen].header
    const menu = tab ? tabs[currentScreen].menu : screens[currentScreen].menu

    return { 
        currentScreen: currentScreen,
        topScreen: getCurrentScreen(state.nav, "top"),
        toggleDrawer: state.values.toggleDrawer, // function transferred here in WelcomeScreen
        isDrawerOpen: isDrawerOpen(state.nav),

        tab: tab, // whether on TabScreen

        // if "back" for this screen explicitly true or false, mark 'back' false to hide button. otherwise, use destination string (may also be a "custom" flag)
        back: back === true || back === false ? false 
        : (tab ? tabs[currentScreen].back : screens[currentScreen].back), 

        // if "menu" set to true, show menu button on left
        menu: menu,

        // if header text marked with dynamic variable, use that. otherwise, use header text
        header: header === "recipient" ? state.values.recipient
        : (currentScreen === "FeedScreen" && state.persist.feedType === "search") ? "Search" 
        : header,

        // if any support fields have been filled, this returns true (show modal when leaving support screen)
        supportFieldFilled: ((state.persist.inputSupportName && state.persist.inputSupportName !== "") || (state.persist.inputSupportEmail && !state.persist.inputSupportEmail !== "") || (state.persist.inputSupportMessage && state.persist.inputSupportMessage !== "")),

        feedType: state.persist.feedType,
        inputSearch: state.persist.inputSearch,
        searchType: state.persist.searchType,

        lastScreen: state.values.lastScreen,
        rootScreen: state.values.rootScreen,

        changedProfile: state.values.changedProfile,

        commentTree: state.values.commentTree,
        viewingComment: state.values.viewingComment,

        // if we're in the process of submitting a post, let them leave. otherwise, warn them if any fields or images are filled
        newPostFieldFilled: state.values.submittingPost ? false 
        : 
        (state.persist.inputPostTitle && state.persist.inputPostTitle !== "") || (state.persist.inputPostBody && state.persist.inputPostBody !== "") || state.persist.imageUri1 || state.persist.imageUri2 || state.persist.imageUri3,

        showNewPostModal: state.values.showNewPostModal,

        signedOut: !state.persist.username || state.persist.username === "",

        username: state.persist.username,
        token: state.persist.token,

        uploadingProfilePicture: state.values.uploadingProfilePicture,
        updatingProfile: state.values.updatingProfile,

        flagSuccess: state.values.flagSuccess,
        viewingProfile: state.values.viewingProfile,
        viewingPost: state.values.viewingPost,

        unreadChats: state.values.unreadChats || 0,
        unreadNotifications: state.values.unreadNotifications || 0,

        notificationDestination: state.values.notificationDestination
    }
  };
  
  export default connect(mapStateToProps, { visitScreen, changeValue, persistValue, loadFeed, reportItem, getActivity })(Header);
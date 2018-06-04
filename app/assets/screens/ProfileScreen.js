import React, { Component } from 'react';
import { View, TouchableOpacity, Image, Linking, FlatList, ActivityIndicator, RefreshControl, Text, Platform } from 'react-native';
import { connect } from 'react-redux'

import '../../shim.js'
import steem from 'steem'

import { changeValue, changeObjectValue, persistValue, changePost, visitScreen, userLoadFeed, userLoadMore, follow, addImage, checkVaporUser, sendMessage, getActivity } from '../actions'

import { getCurrentScreen } from '../screens'

import T from '../c/T'
import Row from '../c/Row'
import Status from '../c/Status'

import style from '../style'

const blankProfile = {
    picture: null,
    about: "",
    location: "",
    website: "",
    name: "",
    reputation: ""
}

class Screen extends Component {
    state = {
        profile: blankProfile,
        vaporUser: false,
        following: 0,
        followers: 0
    }
    componentDidMount() {  
        this.mounted = true     
        this.load()
    }
    componentWillUnmount() {
        this.mounted = false
    }
    componentDidUpdate(prevProps) {
        // if we've just switched to this screen while in the tab section, reload
        if(this.props.currentScreen === "ProfileScreen" && prevProps.currentScreen !== "ProfileScreen") {
            if(this.props.viewingProfile !== prevProps.viewingProfile) {
                this.load()
            }
        }
    }
    load(force) {
        console.log("loading profile")
        this.setState({profile: blankProfile})
        this.setState({vaporUser: false})
        this.setState({following: 0, followers: 0})
        setTimeout(() => {
            this.loadFeed()
            this.loadProfile(force)
            this.loadFollowers()
            this.checkVaporUser()
        }, 0)
    }
    checkVaporUser() {
        const successCallback = () => {
            if(this.mounted === true) {
                this.setState({ vaporUser: true })
            }
        }
        this.props.checkVaporUser(this.props.viewingProfile, successCallback)
    }
    loadFeed() {           
        this.props.changeValue("userFeed", [])
        this.props.changeValue("userLoadingResults", true)
        this.props.userLoadFeed(this.props.viewingProfile)
    }
    loadProfile(force) {
        // this.setState({profile: blankProfile})
        steem.api.getAccounts([this.props.viewingProfile], (err, result) => {       
            // get profile image
            if(result && result[0]) { 
                const profile = {}
                
                if(result[0].json_metadata) {
                    const metadata = JSON.parse(result[0].json_metadata)
                    if(metadata.profile) {
                        profile.picture = metadata.profile.profile_image || false
                        profile.about = metadata.profile.about || ""
                        profile.location = metadata.profile.location || ""
                        profile.website = metadata.profile.website || ""
                        profile.name = metadata.profile.name || ""
                        profile.doesNoteExist = false
                    }
                }
                profile.reputation = steem.formatter.reputation(result[0].reputation)
                // only update image if needed
                if(!this.props.images[`profile-${this.props.viewingProfile}`] || force==="force") {
                    this.props.addImage(`profile-${this.props.viewingProfile}`, profile.picture)
                }
                if(this.mounted === true) {
                    this.setState({ profile: profile })
                    this.forceUpdate()
                }
            } else {
                // no profile found
                const profile = {}
                profile.picture = false
                profile.about = "Profile does not exist."
                profile.location = "("
                profile.website = ""
                profile.name = ":"
                profile.reputation = 0
                profile.doesNotExist = true
                if(this.mounted === true) {
                    this.setState({ profile: profile })
                }

                this.props.changeValue("userFeed", [])
                this.props.changeValue("userLoadingResults", false)
            }
            if(err) {
                console.log(err)
            }
        }); 
    }
    loadFollowers() {
        steem.api.getFollowCount(this.props.viewingProfile, (err, result) => {
            if(err) {
                console.log(err)
            }
            if(result) {
                if(this.mounted === true) {
                    this.setState({ following: result.following_count })
                    this.setState({ followers: result.follower_count })
                    this.forceUpdate()
                }
            }
        });
    }
    touchFollow() {
        if(!this.props.followProgress) {
            const type = this.props.userFollowing ? "unfollow" : "follow"

            // if we get an error, we'll undo this
            this.props.changeObjectValue("userFollowingList", this.props.viewingProfile, !this.props.userFollowing)
            this.setState({ followers: type==="follow" ? this.state.followers+1 : this.state.followers-1})
        
            const errorCallback = () => {
                this.props.changeObjectValue("userFollowingList", this.props.viewingProfile, !this.props.userFollowing)
                if(this.mounted === true) {
                    this.setState({ followers: type==="follow" ? this.state.followers-1 : this.state.followers+1})
                }
            }

            this.props.follow(this.props.viewingProfile, type, errorCallback)
        }
    }
    getChatRecipient(item) {
        const userIndex = item.users.indexOf(this.props.username)
        const recipientIndex = userIndex === 0 ? 1 : 0

        return item.users[recipientIndex]
    }
    touchMessage() {
        // callback for after retrieving chats
        const callback = (chatList) => {
            // check chatlist to see if this chat already exists
                const chat = chatList.find((item) => {
                const match = this.getChatRecipient(item) === this.props.viewingProfile
                return match
            });
            // existing chat - nav there
            if(chat) {
                this.props.changeValue("recipient", this.props.viewingProfile)
                this.props.visitScreen("ChatScreen");
                this.props.changeValue("chat", chat) 
            }
            // chat does not exist - send an empty initiation message to create it. chats with only empty initiation messages won't be listed in the view, but will be travelled to again whenever typing in a user's name
            else {
                const body = {
                    username: this.props.username,
                    recipient: this.props.viewingProfile,
                    initiate: true
                }

                const callback = (chat) => {
                    this.props.changeValue("recipient", this.props.viewingProfile)
                    this.props.visitScreen("ChatScreen");
                    this.props.changeValue("chat", chat) 
                }
                
                const notFoundCallback = () => {
                    if(this.mounted === true) {
                        this.setState({ vaporUser: false })
                    }
                }

                this.props.sendMessage(body, callback, notFoundCallback)
            }
        }
        // now retreive chats and do the above once we he have
        this.props.getActivity(callback)
    }
    openURL() {
        Linking.openURL(this.state.profile.website).catch(err => console.log('An error occurred', err));
    }
    getHeader() {
        const profile = this.state.profile
        const showButton = !this.props.loggedOut && this.props.username !== this.props.viewingProfile && !this.state.profile.doesNotExist && typeof this.state.profile.reputation === "number"

        return(
            <View style={{alignItems: "center"}}>
                <Row style={{padding: 10, paddingBottom: 2, width: style.w, justifyContent: "flex-start"}}>
                    <View style={{backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", width:85, height: 85, marginRight: 10}}>
                        {this.props.images[`profile-${this.props.viewingProfile}`] &&
                        <Image source={{uri: this.props.images[`profile-${this.props.viewingProfile}`]}} 
                        key={`${profile.author}`}
                        style={{width: "90%", height: "90%"}}/>} 
                    </View> 
                            
                    <View style={{flex: 1, alignItems: "flex-start"}}>
                        <T h2 bold left>
                            {this.props.viewingProfile} {typeof profile.reputation === "number" && `(${profile.reputation})`}
                        </T>
                        <T h3 left padY={Platform.OS === "ios" ? 5 : undefined}>
                            {profile.name}{(profile.name !== "" && profile.location !== "") && " - "}{profile.location}
                        </T>
                        <TouchableOpacity onPress={() => this.openURL()}>
                            <T fontB mini numberOfLines={1} style={{color: style.theme}} left>{profile.website}</T>
                        </TouchableOpacity>
                    </View>
                </Row>
                
                {(this.state.followers > 0 || this.state.following > 0) &&
                <T bold padX={10} padY={Platform.OS === "ios" ? 10 : 5}>Followers: {this.state.followers} - Following: {this.state.following}</T>}
    
                <T padX={10} style={{paddingBottom: 7}}>{profile.about}</T>
                
                <Row>
                    {showButton &&
                    <TouchableOpacity 
                        activeOpacity={this.props.followProgress ? 1 : 0.35} 
                        style={{
                            width: 90, 
                            height: 40, 
                            justifyContent: "center", 
                            alignItems: "center", 
                            backgroundColor: this.props.userFollowing ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"
                        }}
                        onPress={() => this.touchFollow()}>
                        <Text style={{fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Nunito-Regular"}}>
                            {this.props.userFollowing ? "Following" : "Follow"}
                        </Text>
                    </TouchableOpacity>}
                    
                    {(showButton && this.state.vaporUser) &&
                    <TouchableOpacity 
                        style={{
                            marginLeft: 5,
                            width: 90, 
                            height: 40, 
                            justifyContent: "center", 
                            alignItems: "center", 
                            backgroundColor: "rgba(255,255,255,0.1)",
                        }}
                        onPress={() => this.touchMessage()}>
                        <Text style={{fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Nunito-Regular"}}>
                            Message
                        </Text>
                    </TouchableOpacity>}

                    {(this.props.username === this.props.viewingProfile && !this.props.loggedOut) &&
                    <TouchableOpacity 
                        style={{
                            marginLeft: 5,
                            width: 90, 
                            height: 40, 
                            justifyContent: "center", 
                            alignItems: "center", 
                            backgroundColor: "rgba(255,255,255,0.1)",
                        }}
                        onPress={() => {
                            this.props.changeValue("lastScreen", "ProfileScreen")
                            this.props.visitScreen("EditProfileScreen")
                        }}>
                        <Text style={{fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Nunito-Regular"}}>
                            Edit
                        </Text>
                    </TouchableOpacity>}
                    
                </Row>
            </View>
        )
    }
    render() {
        return(
            <View style={{flex: 1, width: style.w, justifyContent: "space-between", alignItems: "center"}}>

                    {(this.props.userLoadingResults) ?
                    this.getHeader()
                    :
                    <View/>}
                    
                    {(this.props.userLoadingResults) &&
                    <ActivityIndicator size="large" style={{width: 50}} color="white"/>}

                    {(!this.props.userLoadingResults) &&
                    <FlatList
                    contentContainerStyle={{alignItems: "center"}}
                    style={{width: "100%", flex: 1}}
                    ListHeaderComponent={() => this.getHeader()}
                    keyExtractor={item => item.id.toString()}
                    data={this.props.userFeed}
                    extraData={this.state}
                    removeClippedSubviews
                    scrollEventThrottle={16}
                    refreshing={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.props.userFeedRefreshing}
                            onRefresh={() => {
                                this.props.changeValue("userFeedRefreshing", true)
                                this.load("force")
                            }}
                            tintColor="white"
                            colors={["white"]}
                            progressBackgroundColor={style.theme}
                            titleColor="white"
                        />
                    }
                    ListFooterComponent={this.props.userLoadingMore ? <ActivityIndicator size="large" style={{height: 60, width: 50}} color="white"/> : <View style={{height: 60}}/>}
                    onEndReached={() => {
                        if(this.props.userLoadingMore !== true && this.props.userFeed.length > 0) {
                            this.props.changeValue("userLoadingMore", true)
                            this.props.userLoadMore(this.props.userFeed, this.props.viewingProfile)
                        }
                    }}
                    renderItem={({item, index}) => 
                        <Status 
                        item={item}
                        index={index} 
                        changePost={this.props.changePost}
                        username={this.props.username}
                        profileImage={this.props.images[`profile-${item.author}`]}
                        addImage={this.props.addImage} // not needed here as comes straight from post profile picture
                        repostedBy={item.author !== this.props.viewingProfile ? this.props.viewingProfile : null}
                        onPressProfile={() => {
                            this.props.changeValue("viewingProfile", item.author)
                            this.load()
                        }}
                        onPress={() => {
                            this.props.changeValue("viewingPost", item)
                            this.props.changeValue("lastScreen", "ProfileScreen")
                            this.props.visitScreen("PostScreen")
                        }}/>
                    }/>}

                <View/>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return { 
        username: state.persist.username,
        viewingProfile: state.values.viewingProfile,
        userFeed: state.values.userFeed || [],
        userLoadingResults: state.values.userLoadingResults,
        userFeedRefreshing: state.values.userFeedRefreshing || false,
        userLoadingMore: state.values.userLoadingMore,

        followProgress: state.values.followProgress,
        userFollowing: state.values.userFollowingList[state.values.viewingProfile] || false,

        currentScreen: getCurrentScreen(state.nav),

        loggedOut: !state.persist.username || state.persist.username === "",

        images: state.images
    }
};
  
export default connect(mapStateToProps, { changeValue, changeObjectValue, changePost, persistValue, visitScreen, userLoadFeed, userLoadMore, follow, addImage, checkVaporUser, sendMessage, getActivity })(Screen);
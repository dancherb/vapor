import React, { Component } from 'react';
import { View, Image, Platform, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import moment from 'moment';

import '../../shim.js'
import steem from 'steem'

import { connect } from 'react-redux'
import { changeValue, visitScreen, addImage, changePost, getActivity, readNotifications } from '../actions'

import T from '../c/T'
import Row from '../c/Row'

import style from '../style'

function displayDate(date) {
    const localized = new Date(date) // converts to local date (3:10pm becomes 4:10pm if in Berlin)
    // subtract 10 seconds to work around "in a few seconds" bug
    const display = moment(localized).subtract(10, 'seconds').fromNow(); // returns e.g. "2 hours ago" (posted 2:10pm in Berlin or 1:10pm UTC)
    return display
}

class Screen extends Component {
    componentDidMount() {
        this.props.getActivity()
    }
    componentWillUnmount() {
        this.props.readNotifications()
        this.props.changeValue("unreadNotifications", 0) // just until we re-fetch and this updates
    }
    touchPostLink(item) {
        // visit comments screen for post
        if(item.notificationType === "commentPost") {
            steem.api.getContent(item.itemAuthor, item.itemPermlink, (err, result) => {
                if(err) console.log(err)

                if(result) {
                    // load root post data
                    this.props.changeValue("viewingPost", result)
                    this.props.changePost(`${item.itemAuthor}-${item.itemPermlink}`, "net_votes", result.net_votes)
                    this.props.changePost(`${item.itemAuthor}-${item.itemPermlink}`, "children", result.children)
    
                    // migrate
                    this.props.changeValue("rootScreen", "NotificationsScreen")
                    // this.props.changeValue("lastScreen", false)
                    this.props.changeValue("commentTree", [])
                    this.props.visitScreen("CommentsScreen")
                }
            })
        } 
        // visit post
        else {
            // initiate post data
            this.props.changeValue("viewingPost", {author: item.itemAuthor, permlink: item.itemPermlink})
            this.props.changePost(`${item.itemAuthor}-${item.itemPermlink}`, "initiate", true)

            this.props.changeValue("rootScreen", "NotificationsScreen")
            this.props.visitScreen("PostScreen")
        }
    }

    touchCommentLink(item) {
        steem.api.getContent(item.itemAuthor, item.itemPermlink, (err, result) => {
            if(err) console.log(err)
            if(result) {
                this.props.changeValue("viewingComment", result)
                this.props.changeValue("commentTree", [result])

                steem.api.getContent(item.rootPostAuthor, item.rootPostPermlink, (err, result) => {
                    if(err) console.log(err)
        
                    if(result) {                  
                        // load root post data
                        this.props.changeValue("viewingPost", result)
                        this.props.changePost(`${item.rootPostAuthor}-${item.rootPostPermlink}`, "net_votes", result.net_votes)
                        this.props.changePost(`${item.rootPostAuthor}-${item.rootPostPermlink}`, "children", result.children)
        
                        // migrate
                        this.props.changeValue("rootScreen", "NotificationsScreen")
                        // this.props.changeValue("lastScreen", "PostScreen")
                        this.props.visitScreen("CommentsScreen")
                    }
                });                  
            }
        });          
    }
    render() {
        return(
            <View style={{flex: 1, justifyContent:"center", alignItems: "center"}}>
                
                {this.props.notifications &&
                <FlatList
                contentContainerStyle={{alignItems: "center"}}
                style={{width: style.w, maxHeight: style.h}}
                keyExtractor={item => item._id+"id"+(Math.random()*1000)}
                data={this.props.notifications}
                refreshing={false}
                refreshControl={
                    <RefreshControl
                        refreshing={this.props.refreshingActivity}
                        onRefresh={() => {
                            // we call readNotifications, which calls getActivity when finished (also turning off refreshingActivity)
                            this.props.readNotifications()
                            this.props.changeValue("refreshingActivity", true)
                        }}
                        tintColor="white"
                        colors={["white"]}
                        progressBackgroundColor={style.theme}
                        titleColor="white"
                     />
                }
                renderItem={({item}) => 
                    <Notification 
                    notification={item} 
                    date={displayDate(item.date)} 
                    image={this.props.images[`profile-${item.user}`]} // action for fetching notifications will also loop through and fetch profiles
                    onPressUser={() => {
                        this.props.visitScreen("ProfileScreen")
                        this.props.changeValue("rootScreen", "NotificationsScreen")
                        this.props.changeValue("viewingProfile", item.user)
                    }}
                    onPressLink={() => {
                        if(item.notificationType === "custom") {
                        }
                        else if(item.notificationType === "likeComment" || item.notificationType === "replyComment" || item.notificationType === "mentionComment") {
                            this.touchCommentLink(item)            
                        } 
                        else {
                            this.touchPostLink(item)
                        }
                    }}/>
                }/>}

                {!this.props.notifications &&
                <ActivityIndicator color="white" size="large"/>}
                
            </View>
        )
    }
}

const mapStateToProps = state => {
    return { 
        images: state.images,
        notifications: state.values.notifications,

        refreshingActivity: state.values.refreshingActivity
    }
};
  
export default connect(mapStateToProps, { changeValue, visitScreen, addImage, changePost, getActivity, readNotifications })(Screen);

// use React.PureComponent for big FlatLists that don't need to update much
class Notification extends React.PureComponent {
    render() {
        const notification = this.props.notification

        let borderColor = "white"
        if(notification.user) {
            borderColor = style.colours[notification.user.charCodeAt(0) % style.colours.length]
        }

        const container = { 
            width: "100%",
            flexDirection: "row",
            flexWrap: "wrap",
            height: null,
            backgroundColor: notification.read ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingLeft: 5,
            paddingRight: 10,
            paddingTop: 4,
            paddingBottom: 7,
            borderLeftWidth: 2,
            borderColor: borderColor,
        }
        return(
            <View style={{width: style.w-20, marginTop: 0, marginBottom: 5}}>
                <T mini fade padY={2}>{this.props.date}</T>

                <TouchableOpacity activeOpacity={notification.notificationType === "custom" ? 1 : 0.35} onPress={this.props.onPressLink} style={container}>
                    
                    <TouchableOpacity onPress={this.props.onPressUser} style={{flexDirection: "row"}}>
                        <View style={{backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", width:30, height: 30, marginRight: Platform.OS === "ios" ? 7 : 10, marginLeft: 0, marginTop: 3, borderRadius: 15, marginBottom: Platform.OS === "ios" ? 2 : 0}}>
                            <Image source={{uri: this.props.image}} style={{width: "90%", height: "90%", borderRadius: 13.5}}/> 
                        </View>
                        
                        <T bold style={{paddingTop: Platform.OS === "ios" ? 1.2 : undefined}}>
                            {notification.user}
                        </T>
                    </TouchableOpacity>

                    {notification.notificationType !== "custom" &&
                    <T style={{paddingTop: 1.4}}>
                        {" "}{notificationText[notification.notificationType]}{" "}
                    </T>}

                    {(notification.notificationType === "custom" && notification.customMessage) &&
                    <T style={{paddingTop: 1.4}}>
                        {" "}{notification.customMessage}{" "}
                    </T>}

                    {notification.itemText &&
                    <T bold style={{paddingTop: Platform.OS === "ios" ? 1.2 : undefined}} numberOfLines={1}>
                        {Platform.OS === "ios" && " "}{notification.itemText}.
                    </T>}
                    
                </TouchableOpacity>
            </View>
        )
    }
}

const notificationText = {
    likePost: "liked",
    likeComment: "liked your",
    commentPost: "commented on",
    replyComment: "replied to your",
    mentionPost: "mentioned you in",
    mentionComment: "mentioned you in a",
    repost: "reposted",
    follow: "started following you."
}

// const data = {
//     user: "Timmy",
    
//     item: {
//         likePost: "post",
//         likeComment: "comment",
//         commentPost: "commented",
//         replyComment: "comment",
//         mentionPost: "post",
//         mentionComment: "comment",
//         repost: "post",
//         follow: "",
//     }
// }

// const notification = {
//     type: "likePost",
//     user: "Timmy",
//     text: "liked",
//     item: ""
// }

// const types = {
    //     likePost: "Timmy liked Great Post.", #
    //     likeComment: "Timmy liked your comment on Great Post.", #
    
    //     commentPost: "Timmy commented on Great Post.", #
    
    //     replyComment: "Timmy replied to your comment on Great Post.", #
    
    //     mentionPost: "Timmy mentioned you in Great Post.", #
    //     mentionComment: "Timmy mentioned you in a comment on Great Post.", #
    
    //     repost: "Timmy reposted Great Post.", #
    
    //     follow: "Timmy started following you.", #
// }
    

// item 1 has link to post or comment

    // item1: [
    //     "Great Post",
    //     "your comment",
    //     "commented",
    //     "comment",
    //     "Great Post",
    //     "comment",
    //     "Great Post"
    //     // none
    // ],
    // text2: {
    //     likePost: "",
    //     likeComment: "on",
    //     commentPost: "on",
    //     replyComment: "on",
    //     mentionPost: "",
    //     mentionComment: "on",
    //     repost: "",
    //     follow: "",
    // }

    // item2: {
    //     likePost: "",
    //     likeComment: "post2",
    //     commentPost: "on",
    //     replyComment: "on",
    //     mentionPost: "",
    //     mentionComment: "on",
    //     repost: "",
    //     follow: "",
    // }
    // text2: [
    //     // none,
    //     "on",
    //     "on",
    //     "on",
    //     // none
    //     "on",
    //     // none
    //     // none
    // ],
    // item2: [
    //     // none,
    //     "Great Post",
    //     "Great Post",
    //     "Great Post",
    //     // none,
    //     "Great Post",
    //     // none
    //     // none
    // ]
// }



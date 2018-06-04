import React, { Component } from 'react';
import { View, Image, TouchableOpacity, Linking } from 'react-native';
import { connect } from 'react-redux';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import moment from 'moment';
import ParsedText from 'react-native-parsed-text';

import '../../shim.js'
import steem from 'steem'

import { visitScreen, changeValue, changeObjectValue, upvote, addImage } from '../actions'

import T from './T'
import Row from './Row'

import style from '../style'


class Comment extends React.PureComponent {
    state = {
        net_votes: this.props.item.net_votes,
        likeProgress: false
    }
    componentDidMount() {
        this.mounted = true
        this.getProfilePicture()
        
    }
    componentWillUnmount() {
        this.mounted = false;
    }
    getProfilePicture() {
        if(!this.props.profileImage) {
            steem.api.getAccounts([this.props.item.author], (err, result) => {         
                // get profile image
                if(result && result[0] && result[0].json_metadata) {
                    const metadata = JSON.parse(result[0].json_metadata)
                    const image = metadata.profile && metadata.profile.profile_image ? metadata.profile.profile_image 
                    : false

                    this.props.addImage(`profile-${this.props.item.author}`, image)
                    if(this.mounted === true) {
                        this.forceUpdate()
                    }
                }
                if(err) {
                    console.log(err)
                }
            }); 
        }
    }
    displayDate(date) {
        const localized = new Date(date) // converts to local date (3:10pm becomes 4:10pm if in Berlin)
        return moment(localized).fromNow(); // returns e.g. "2 hours ago" (posted 2:10pm in Berlin or 1:10pm UTC)
    }
    handleUrlPress(url) {
        Linking.openURL(url).catch(err => console.error('An error occurred', err));
    }
    handleUserPress = (user) => {
        const username = user.split("@")[1]
        this.props.visitScreen("ProfileScreen")
        this.props.changeValue("lastScreen", "CommentsScreen")
        this.props.changeValue("viewingProfile", username)
    }
    touchUpvote() {
        const item = this.props.item
        const likeProgress = this.state.likeProgress
        const liked = this.props.liked
        const votes = this.state.net_votes

        if(!this.props.loggedOut && !likeProgress) {
            // inrease visual vote display by 1 - if we get an error, we'll undo this
            this.setState({ net_votes: liked ? votes-1 : votes+1})
            this.setState({ likeProgress: true })
            this.props.changeObjectValue("userVotesList", `${item.author}/${item.permlink}`, !liked)
        
            const errorCallback = () => {
                if(this.mounted === true) {
                    this.setState({ net_votes: votes })
                    this.setState({ likeProgress: false })
                }
                this.props.changeObjectValue("userVotesList", `${item.author}/${item.permlink}`, liked)
            }

            const callback = () => {
                if(this.mounted === true) {
                    this.setState({ likeProgress: false })
                }
            }

            this.props.upvote(item.author, item.permlink, liked, callback, errorCallback, false, this.props.viewingPost.author, this.props.viewingPost.permlink)
        }
    }
    touchComments() {
        this.props.changeValue("viewingComment", this.props.item)

        // create copy of comment tree array
        const newTree = this.props.commentTree.slice()
        
        // add this comment to it
        newTree.push(this.props.item)
        
        // put the new tree in the global state
        this.props.changeValue("commentTree", newTree)

        setTimeout(() => console.log(this.props.commentTree), 0)
    }
    render() {
        const item = this.props.item
        let value = "$"
        if(item.pending_payout_value) {
            value = "$"+Number(item.pending_payout_value.split(" ")[0]).toFixed(2)
        }
        const colour = style.colours[item.author.charCodeAt(0) % style.colours.length]
        const liked = this.props.liked
        return(
            <View style={{width: style.w-20}}>
                <View style={[this.container, { 
                    borderColor: colour, 
                    backgroundColor: this.props.mainComment ? "rgba(255,255,255,0.05)": "rgba(255,255,255,0.1)"
                }]}>

                    <Row style={{justifyContent: "space-between", width: "100%"}}>
                        <TouchableOpacity style={{flexDirection: "row"}} onPress={this.props.onPressProfile}>
                            <View style={{backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", width:36, height: 36, marginRight: 10, marginTop: 2, borderRadius: 18}}>
                                {this.props.profileImage &&
                                <Image source={{uri: this.props.profileImage}} key={`${item.author}${item.created}`} style={{width: "90%", height: "90%", borderRadius: 16}}/>}
                            </View>
                            
                            <T bold>{item.author}</T>
                        </TouchableOpacity>

                        <T mini fade>{this.displayDate(item.created)}</T>
                    </Row>

                    <ParsedText
                    style={this.styleBody}
                    parse={[{type: 'url', style: this.styleURL, onPress: this.handleUrlPress},
                    {pattern: /@([^\s]+)/, style: this.styleUser, onPress: this.handleUserPress}]}
                    childrenProps={{allowFontScaling: false}}>
                        {item.body}
                    </ParsedText>

                </View>
                <Row style={this.iconRow}>
                
                    <Row>
                        <TouchableOpacity onPress={() => this.touchUpvote()} 
                        style={[this.iconHolder, { 
                            paddingRight: 7, 
                            paddingLeft: 7, 
                            backgroundColor: liked ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"
                        }]}
                        activeOpacity={this.state.likeProgress || this.props.loggedOut ? 1 : 0.35}>
                            <FontAwesome style={[this.icon, { fontSize: 19}]}>
                                {this.state.net_votes > 0 ? Icons.thumbsUp : Icons.thumbsOUp}
                            </FontAwesome>
                            <T> {this.state.net_votes}</T>
                        </TouchableOpacity>

                        {!this.props.mainComment &&
                        <TouchableOpacity style={[this.iconHolder, { 
                            paddingLeft: 7,
                            paddingRight: 7,
                            backgroundColor: "rgba(255,255,255,0.1)"
                        }]}
                        onPress={() => this.touchComments()}>
                            <FontAwesome style={[this.icon, { fontSize: 18}]}>
                                {item.children > 0 ? Icons.comment : Icons.commentO}
                            </FontAwesome>
                            <T> {item.children}</T>
                        </TouchableOpacity>}
                    </Row>
                    

                    <T bold fade>{value}</T>
                
                </Row>
            </View>
        )
    }
    container = { 
        width: style.w-20,
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: 5,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 10,
        paddingTop: 4,
        borderLeftWidth: 2,
    }
    iconRow = {
        width: style.w-20,
        height: 45,
        justifyContent: "space-between", 
        padding: 5,
        paddingLeft: 6,
    }
    iconHolder = {
        minWidth: 37, 
        height: 35,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        marginRight: 5,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.1)"
    }
    icon = {
        color: "rgba(255,255,255,0.65)", 
        textAlign: "center",
    }
    styleBody = {
        width: "100%",
        fontSize: 14,
        fontFamily: "JosefinSans-Light",
        color: "white",
    }
    styleUser = {
        fontSize: 16,
        color: style.theme,
        fontFamily: "JosefinSans-SemiBold"
    }
    styleURL = {
        color: style.theme,
        fontFamily: "JosefinSans-SemiBold",
    }
}

const mapStateToProps = (state, ownProps) => {
    const loggedOut = !state.persist.username || state.persist.username === ""
    return {
        loggedOut: loggedOut,

        liked: state.values.userVotesList[`${ownProps.item.author}/${ownProps.item.permlink}`] || false,

        commentTree: state.values.commentTree || [],

        profileImage: state.images[`profile-${ownProps.item.author}`],

        viewingPost: state.values.viewingPost
    }
}

export default connect(mapStateToProps, { visitScreen, changeValue, changeObjectValue, upvote, addImage })(Comment)
          


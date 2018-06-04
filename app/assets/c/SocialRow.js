import React, { Component } from 'react';
import { TouchableOpacity } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import { connect } from 'react-redux'

import { changeValue, changeObjectValue, changePost, visitScreen, upvote, reblog } from '../actions'
import { getCurrentScreen } from '../screens'

import T from '../c/T'
import Row from '../c/Row'

class SocialRow extends React.PureComponent {
    state = {
        likeProgress: false,
    }
    componentDidMount() {
        this.mounted = true
    }
    componentWillUnmount() {
        this.mounted = false
    }
    iconRow = {
        width: this.props.width,
        height: 45,
        justifyContent: "space-between", 
        padding: 5,
        paddingLeft: 6,
        ...this.props.style
    }
    iconHolder = {
        minWidth: 37, 
        height: 35,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        marginRight: 5,
        borderRadius: 20
    }
    icon = {
        color: "rgba(255,255,255,0.65)", 
        textAlign: "center",
    }
    touchUpvote() {
        const item = this.props.item
        const likeProgress = this.state.likeProgress
        const liked = this.props.liked
        const net_votes = this.props.net_votes

        if(!this.props.loggedOut && !likeProgress) {
            // inrease visual vote display by 1 - if we get an error, we'll undo this
            this.setState({ likeProgress: true })
            this.props.changeObjectValue("userVotesList", `${item.author}/${item.permlink}`, !liked)
            this.props.changePost(this.props.reference, "net_votes", liked ? net_votes - 1 : net_votes + 1)

            const errorCallback = () => {
                if(this.mounted === true) {
                    this.setState({ likeProgress: false })
                }
                this.props.changeObjectValue("userVotesList", `${item.author}/${item.permlink}`, liked)
                this.props.changePost(this.props.reference, "net_votes", net_votes)
            }

            const callback = () => {
                if(this.mounted === true) {
                    this.setState({ likeProgress: false })
                }
            }
            
            this.props.upvote(item.author, item.permlink, liked, callback, errorCallback, this.props.item.title)
        }
    }
    touchReblog() {
        // can only reblog - can't un-reblog
        const item = this.props.item
        const reblogged = this.props.reblogged

        if(!this.props.loggedOut && !reblogged) {
            this.props.changePost(this.props.reference, "reblogged", true)

            const errorCallback = () => {
                if(this.mounted === true) {
                    this.props.changePost(this.props.reference, "reblogged", false)
                }
            }
            
            this.props.reblog(item.author, item.permlink, errorCallback, item.title)
        }
    }
    touchComments() {
        this.props.changeValue("commentTree", [])
        if(this.props.currentScreen === "CommentsScreen") {
            this.props.visitScreen("PostScreen")
        } else {
            this.props.changeValue("viewingPost", this.props.item)
            this.props.visitScreen("CommentsScreen")
            
            if(this.props.currentScreen === "ProfileScreen") {
                this.props.changeValue("lastScreen", "ProfileScreen")
            }
            if(this.props.currentScreen === "FeedScreen") {
                this.props.changeValue("lastScreen", "FeedScreen")
            }
        }
    }
    render() {
        const item = this.props.item
        // pending_payout_value looks something like 57.1245 SBD - convert it to $57.12
        const value = item.pending_payout_value ? "$"+Number(item.pending_payout_value.split(" ")[0]).toFixed(2) : "$0"
        
        const liked = this.props.liked
        const likeProgress = this.state.likeProgress

        const reblogged = this.props.reblogged

        const loggedOut = this.props.loggedOut

        return(
            <Row style={this.iconRow}>
                <Row style={{flex: 1, justifyContent: "flex-start"}}>
                    <TouchableOpacity 
                        onPress={() => this.touchUpvote()} 
                        style={[this.iconHolder, { 
                            paddingRight: 7, 
                            paddingLeft: 7, 
                            backgroundColor: liked ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"
                        }]}
                        activeOpacity={likeProgress || loggedOut ? 1 : 0.35}>
                        <FontAwesome style={[this.icon, { fontSize: 18}]}>
                            {this.props.net_votes > 0 ? Icons.thumbsUp : Icons.thumbsOUp}
                        </FontAwesome>
                        <T> {this.props.net_votes}</T>
                    </TouchableOpacity>

                    <TouchableOpacity style={[this.iconHolder, { 
                        paddingRight: 7, 
                        paddingLeft: 7,
                        backgroundColor: "rgba(255,255,255,0.1)"
                    }]}
                    onPress={() => this.touchComments()}>
                        <FontAwesome style={[this.icon, { fontSize: 18}]}>
                            {this.props.children > 0 ? Icons.comment : Icons.commentO}
                        </FontAwesome>
                        <T> {this.props.children}</T>
                    </TouchableOpacity>

                    {!this.props.loggedOut &&
                    <TouchableOpacity 
                    onPress={() => this.touchReblog()}
                    activeOpacity={reblogged || loggedOut ? 1 : 0.35}
                    style={[this.iconHolder, {
                        backgroundColor: reblogged ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"
                    }]}>
                        <FontAwesome 
                            style={[this.icon, { fontSize: 17.5 }]}>
                            {Icons.refresh}
                        </FontAwesome>
                    </TouchableOpacity>}
                </Row>

                <T bold fade>{value}</T>
            </Row>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    const loggedOut = !state.persist.username || state.persist.username === ""
    const reference = `${ownProps.item.author}-${ownProps.item.permlink}`
    return { 
        showFeedModal: state.values.showFeedModal,
        showProfileModal: state.values.showProfileModal,

        viewingProfile: state.values.viewingProfile,

        currentScreen: getCurrentScreen(state.nav),

        loggedOut: loggedOut,

        liked: state.values.userVotesList[`${ownProps.item.author}/${ownProps.item.permlink}`] || false,

        reference: reference,
        net_votes: state.posts[reference].net_votes || 0,
        children: state.posts[reference].children || 0,
        reblogged: state.posts[reference].reblogged || false
    }
};
  
export default connect(mapStateToProps, { changeValue, changeObjectValue, changePost, visitScreen, upvote, reblog })(SocialRow);
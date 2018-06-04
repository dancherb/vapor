import React, { Component } from 'react';
import { View, Linking, FlatList, RefreshControl } from 'react-native';
import { connect } from 'react-redux'
import moment from 'moment';

import '../../shim.js'
import steem from 'steem'

import { changeValue, changeObjectValue, changePost, visitScreen, comment } from '../actions'

import { getCurrentScreen } from '../screens'

import SocialRow from '../c/SocialRow'
import Comment from '../c/Comment'
import CommentBox from '../c/CommentBox'

import style from '../style'

class Screen extends Component {
    state = {
        reblogged: false
    }
    componentDidMount() {
        this.props.changeValue("inputComment", "")
        if(this.props.rootScreen !== "NotificationsScreen") {
            this.props.changeValue("commentTree", [])
        }
        // this.props.changeValue("viewingComment", false) // reset comment tree
        this.load()
    }
    componentDidUpdate(prevProps) {
        // if we've just switched to this screen while in the tab section, reload
        if(this.props.currentScreen === "CommentsScreen" && prevProps.currentScreen !== "CommentsScreen") {
            this.props.changeValue("inputComment", "")
            this.props.changeValue("commentTree", [])
            this.props.changeValue("viewingComment", false) // reset comment tree

            this.props.changeValue("commentsRefreshing", true)
            this.load()
            if(this.commentsView) {
                this.commentsView.scrollToOffset({x: 0, y: 0, animated: true})
            }
        }
        else if(this.props.viewingComment !== prevProps.viewingComment) {
            // this also covers us going from viewing a comment back to top-level
            this.props.changeValue("inputComment", "")
            this.props.changeValue("commentsRefreshing", true)
            this.load()
            
            if(this.commentsView) {
                this.commentsView.scrollToOffset({x: 0, y: 0, animated: true})
            }
        }
    }
    load() {
        if(!this.props.viewingComment) {
            this.setState({ reblogged: false })
        }
        setTimeout(() => {
            this.props.changeValue("commentsRefreshing", true)
            this.props.changeValue("postComments", [])
            this.getComments()
        }, 0)
    }
    getComments() {
        const content = this.props.viewingComment || this.props.viewingPost
     
        steem.api.getContentReplies(content.author, content.permlink, (err, result) => {
            if(result) {
                // reverse so most recent is at the top
                this.props.changeValue("postComments", result.reverse())
                this.props.changeValue("commentsRefreshing", false)
            }
            if(err) {
                console.log(err)
            }
        });
    }
    submitComment() {
        const item = this.props.viewingComment || this.props.viewingPost
        const rootPost = this.props.viewingPost

        this.props.changeValue("submittingComment", true)
        this.props.changePost(this.props.reference, "children", this.props.children+1)
        
        const callback = () => { 
            this.props.changeValue("inputComment", "")
            this.props.changeValue("submittingComment", false)
            this.getComments()
        }
        const errorCallback = () => {
            this.props.changeValue("submittingComment", false)
            this.props.changePost(this.props.reference, "children", this.props.children-1)
        }
        this.props.comment(item.author, item.permlink, this.props.inputComment, callback, errorCallback, rootPost.title, rootPost.author, rootPost.permlink)
    }
          
    displayDate(date) {
        const localized = new Date(date) // converts to local date (3:10pm becomes 4:10pm if in Berlin)
        return moment(localized).format('MMMM Do YYYY, h:mm:ss a');   
    }

    handleUrlPress(url) {
        Linking.openURL(url).catch(err => console.error('An error occurred', err));
    }
    handleUserPress = (user) => {
        const username = user.split("@")[1]
        this.props.visitScreen("ProfileScreen")
        this.props.changeValue("viewingProfile", username)
        this.props.changeValue("lastScreen", "CommentsScreen")
    }
    
    render() {
        return(
            <View style={{flex: 1, width: style.w, justifyContent: "space-between", alignItems: "center"}}>

                {!this.props.viewingComment &&
                <SocialRow item={this.props.viewingPost} width={style.w - 10}/>}

                {this.props.viewingComment &&
                <Comment 
                mainComment
                onPressProfile={() => {
                    this.props.visitScreen("ProfileScreen")
                    this.props.changeValue("lastScreen", "CommentsScreen")
                    this.props.changeValue("viewingProfile", this.props.viewingComment.author)
                }} item={this.props.viewingComment}/>}

                {(this.props.viewingPost && this.props.postComments) && 
                <FlatList
                ref={(ref) => { this.commentsView = ref }}
                contentContainerStyle={{alignItems: "center"}}
                style={{width: style.w, maxHeight: style.h}}
                keyExtractor={comment => comment.id.toString()}
                data={this.props.postComments}
                removeClippedSubviews
                scrollEventThrottle={16}
                refreshing={false}
                ListHeaderComponent={
                    this.props.signedOut ? 
                        <View/>
                        :
                        <CommentBox submittingComment={this.props.submittingComment} onPress={() => this.submitComment()} inputComment={this.props.inputComment}/>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={this.props.commentsRefreshing}
                        onRefresh={() => {
                            this.props.changeValue("commentsRefreshing", true)
                            this.getComments()
                        }}
                        tintColor="white"
                        colors={["white"]}
                        progressBackgroundColor={style.theme}
                        titleColor="white"
                     />
                }
                renderItem={({item}) => 
                    <Comment 
                    onPressProfile={() => {
                        this.props.visitScreen("ProfileScreen")
                        this.props.changeValue("lastScreen", "CommentsScreen")
                        this.props.changeValue("viewingProfile", item.author)
                    }} item={item}/>
                }/>}
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    const reference = `${state.values.viewingPost.author}-${state.values.viewingPost.permlink}`
    return { 
        viewingPost: state.values.viewingPost || {},

        postComments: state.values.postComments || [],
        commentsRefreshing: state.values.commentsRefreshing || false,

        inputComment: state.values.inputComment,
        submittingComment: state.values.submittingComment,

        currentScreen: getCurrentScreen(state.nav),
        rootScreen: state.values.rootScreen,

        signedOut: !state.persist.username || state.persist.username === "",

        username: state.persist.username,

        reference: reference,
        children: state.posts[reference].children || 0,

        viewingComment: state.values.viewingComment,

        commentTree: state.values.commentTree
    }
};
  
export default connect(mapStateToProps, { changeValue, changeObjectValue, changePost, visitScreen, comment })(Screen);
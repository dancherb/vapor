import React, { Component } from 'react';
import { View, ScrollView, Image, Linking, TouchableOpacity, Platform } from 'react-native';
import { connect } from 'react-redux'
import removeMarkdown from 'remove-markdown';
import FitImage from 'react-native-scalable-image';
import moment from 'moment';
import ParsedText from 'react-native-parsed-text';

import '../../shim.js'
import steem from 'steem'

import { changeValue, changeObjectValue, visitScreen, addImage, changePost } from '../actions'
import { getCurrentScreen } from '../screens'

import T from '../c/T'
import Row from '../c/Row'
import SocialRow from '../c/SocialRow'

import style from '../style'

class Screen extends Component {
    state = {
        reblogged: false,
    }
    componentDidMount() {
        this.mounted = true
        this.load(this.props.rootScreen)
    }
    componentWillUnmount() {
        this.mounted = false
    }
    componentDidUpdate(prevProps) {
        // if we've just switched to this screen while in the tab section, reload
        if(this.props.currentScreen === "PostScreen" && prevProps.currentScreen !== "PostScreen") {
            this.load()
            // don't scroll to the top if coming back from comments (i.e. not loading new article)
            if(this.scrollview && prevProps.currentScreen !== "CommentsScreen") {
                if(prevProps.viewingPost !== this.props.viewingPost) {
                    this.scrollview.scrollTo({y: 0})
                }
            }
        }
    }

    load(rootScreen) {
        console.log("loading post")
        this.setState({ reblogged: false })
        setTimeout(() => {
            this.getProfilePicture()
            this.getReblogs()
            this.refreshPost(rootScreen) // get likes and comment count - whole post if coming from notifications
        }, 0)
    }

    getReblogs() {
        const { author, permlink } = this.props.viewingPost
        steem.api.getRebloggedBy(author, permlink, (err, result) => {
            if(err) console.log(err)
            if(result && this.mounted === true) {
                for(let i=0; i<result.length; i++) {
                    // if this user has reblogged, mark it to highlight the button
                    if(result[i] === this.props.username) {
                        if(this.mounted === true) {
                            this.setState({ reblogged: true })
                        }
                        break
                    }
                }
            }
        });
    }
    refreshPost(rootScreen) {
        const { author, permlink } = this.props.viewingPost
        steem.api.getContent(author, permlink, (err, result) => {
            if(err) console.log(err)
            // if coming from notifications screen), refresh whole post
            if(rootScreen==="NotificationsScreen") {
                this.props.changeValue("viewingPost", result)
                // store the latest votes/comments values in global state (user interaction tracking system)
                this.props.changePost(`${author}-${permlink}`, "net_votes", result.net_votes)
                this.props.changePost(`${author}-${permlink}`, "children", result.children)
            }
            // otherwise, just update likes and comment count in viewingPost object
            else {
                this.props.changeObjectValue("viewingPost", "net_votes", result.net_votes)
                this.props.changeObjectValue("viewingPost", "children", result.children)    
            }
            
            if(this.mounted === true) {
                setTimeout(() => this.forceUpdate(), 0)
            }
        });
    }
    getProfilePicture() {
        if(!this.props.authorProfileImage) {
            steem.api.getAccounts([this.props.viewingPost.author], (err, result) => {         
                // get profile image
                if(result && result[0] && result[0].json_metadata) {
                    const metadata = JSON.parse(result[0].json_metadata)
                    const image = metadata.profile && metadata.profile.profile_image ? metadata.profile.profile_image 
                    : false

                    this.props.addImage(`profile-${this.props.viewingPost.author}`, image)
                }
                if(err) {
                    console.log(err)
                }
            });
        } 
    }
          
    displayDate(date) {
        const localized = new Date(date) // converts to local date (3:10pm becomes 4:10pm if in Berlin)
        const display = moment(localized).format('MMMM Do YYYY, h:mm:ss a');  
        if(display === "Invalid date") { 
            return ""
        } else {
            return display
        } 
    }
    parseBody() {
        const item = this.props.viewingPost
        const strippedBody = removeMarkdown(item.body)

        return strippedBody
    }
    getImages() {
        const container = []
        const item = this.props.viewingPost
        const metadata = item.json_metadata ? JSON.parse(item.json_metadata) : {}
        const images = metadata.image || []
        for(let i=0; i<images.length; i++) {
            const source = {uri: images[i]}
            container.push(<FitImage key={`${item.title}#${images[i]}`} style={{marginTop: 2}} width={style.w - 20} source={source}/>)
        }
        return container
    }
    handleUrlPress(url) {
        Linking.openURL(url).catch(err => console.log('An error occurred', err));
    }
    handleUserPress = (user) => {
        const username = user.split("@")[1]
        this.props.visitScreen("ProfileScreen")
        this.props.changeValue("lastScreen", "PostScreen")
        this.props.changeValue("viewingProfile", username)
    }
    
    render() {
        const item = this.props.viewingPost

        return(
            <View style={{flex: 1, width: style.w, justifyContent: "space-between", alignItems: "center"}}>
                <ScrollView 
                scrollEventThrottle={16}
                refreshing={false}
                ref={(ref) => { this.scrollview = ref }} 
                contentContainerStyle={{justifyContent:"space-around", alignItems: "center"}} style={{flex: 1}}>

                    <Row style={{padding: 10, width: style.w}}>
                        <TouchableOpacity style={{backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", width:85, height: 85, marginRight: 10}}
                        onPress={() => {
                            this.props.visitScreen("ProfileScreen")
                            this.props.changeValue("lastScreen", "PostScreen")
                            this.props.changeValue("viewingProfile", item.author)
                        }}>

                            {this.props.authorProfileImage &&
                            <Image source={{uri: this.props.authorProfileImage}} 
                            key={`${item.author}/${item.title}`}
                            style={{width: "90%", height: "90%"}}/>} 

                        </TouchableOpacity>
                    
                        <View style={{flex: 1, justifyContent: "flex-start"}}>
                            <TouchableOpacity onPress={() => {
                                this.props.visitScreen("ProfileScreen")
                                this.props.changeValue("lastScreen", "PostScreen")
                                this.props.changeValue("viewingProfile", item.author)
                            }}>
                                <T h2 bold left style={{width: "100%"}}>{item.author}</T>
                            </TouchableOpacity>

                            <Row style={{justifyContent: "flex-start", marginTop: Platform.OS === "ios" ? 5 : null}}>
                                <T h3>in </T>
                                <T h3 bold>{item.category}</T>
                            </Row>
                        </View>
                    </Row>

                    <T h3 fade padX={10} left>{this.displayDate(item.created)}</T>
                    <T h3 bold padX={10} left style={{marginTop: Platform.OS === "ios" ? 5 : undefined}}>{item.title}</T>

                    <ParsedText
                    style={this.styleBody}
                    parse={[{
                        type: 'url', style: this.styleURL, onPress: this.handleUrlPress
                    }, {
                        pattern: /@([^\s]+)/, style: this.styleUser, onPress: this.handleUserPress
                    }]}
                    childrenProps={{allowFontScaling: false}}>
                        {this.parseBody()}
                    </ParsedText>

                    <View style={{flex: 1}}>
                        {this.getImages()}
                    </View>

                </ScrollView>

                <SocialRow item={this.props.viewingPost} net_votes={this.props.viewingPost.net_votes} width={style.w - 10} reblogged={this.state.reblogged}/>
                
            </View>
        )
    }
    styleBody = {
        padding: 10,
        fontSize: 14,
        fontFamily: "Nunito-Regular",
        color: "white",
        textAlign: "left"
    }
    styleUser = {
        fontSize: 18,
        color: style.theme,
        fontFamily: "Nunito-SemiBold"
    }
    styleURL = {
        color: style.theme,
        fontFamily: "Nunito-SemiBold",
    }
}

const mapStateToProps = (state) => {
    return { 
        viewingPost: state.values.viewingPost || {},

        currentScreen: getCurrentScreen(state.nav),
        rootScreen: state.values.rootScreen,

        username: state.persist.username,
        
        images: state.images,
        authorProfileImage: state.images && state.values.viewingPost ? state.images[`profile-${state.values.viewingPost.author}`] : false
    }
};
  
export default connect(mapStateToProps, { changeValue, changeObjectValue, visitScreen, addImage, changePost })(Screen);
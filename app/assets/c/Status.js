import React, { Component } from 'react';
import { View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import moment from 'moment';

import '../../shim.js'
import steem from 'steem'

import T from './T'
import Row from './Row'
import SocialRow from './SocialRow'

import style from '../style'

const width = style.w-20

export default class Status extends React.PureComponent {
    state = {
        repostedBy: this.props.repostedBy
    }
    componentDidMount() {
        this.mounted = true
        this.loadReblogs()
    }
    componentWillUnmount() {
        this.mounted = false;
    }
    loadReblogs() {    
        console.log("[status] getting reblogs")
        const { author, permlink } = this.props.item
        const { feedType, currentScreen, username, userFollowingList } = this.props
        steem.api.getRebloggedBy(author, permlink, (err, result) => {
            if(err) console.log(err)
            if(result) {
                for(let i=0; i<result.length; i++) {
                    // if this user has reblogged, mark it to highlight the button
                    if(result[i] === username) {
                        const reference = `${author}-${permlink}`
                        this.props.changePost(reference, "reblogged", true)
                        if(this.mounted === true) {
                            this.forceUpdate()
                        }
                        break
                    }
                }
                // if we're viewing the following feed
                if(feedType === "following" && currentScreen === "FeedScreen") {
                    const rebloggers = []
                    // and we're NOT following the author
                    if(!userFollowingList[author]) {
                        // do another for loop looking for reblogs by people you DO follow
                        for(let i=0; i<result.length; i++) {
                            if(userFollowingList[result[i]]) {
                                rebloggers.push(result[i])
                            }
                        }
                        if(this.mounted === true) {
                            if(rebloggers.length === 1) {
                                this.setState({repostedBy: rebloggers[0]})
                            } 
                            else if(rebloggers.length > 1) {
                                this.setState({ repostedBy: `${rebloggers.length} people you follow` })
                            }
                        }
                    }
                }
            }
        });
    }
    displayDate(date) {
        const localized = new Date(date) // converts to local date (3:10pm becomes 4:10pm if in Berlin)
        return moment(localized).fromNow(); // returns e.g. "2 hours ago" (posted 2:10pm in Berlin or 1:10pm UTC)
    }
    container = { 
        width: width,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "flex-start",
        paddingTop: 4,
        borderLeftWidth: 2
    }
    render() {
        const item = this.props.item || {}
        // generate a number from the first letter of authors name, then use this to pick a colour from the array
        const colour = style.colours[item.author.charCodeAt(0) % style.colours.length]
        // get image from metadata (if available)
        const metadata = JSON.parse(item.json_metadata)
        const image = metadata.image && metadata.image[0] ? metadata.image[0] : false
    
        return(
            <View style={{marginTop: 10, alignItems: "center"}}>
                {this.state.repostedBy &&
                <Row>
                    <T mini>reposted by </T>
                    <T mini bold>{this.state.repostedBy}</T>
                </Row>}
                <TouchableOpacity onPress={this.props.onPress} style={[this.container, { borderColor: colour}]}>

                    <Row style={{justifyContent: "flex-start", paddingLeft: 10, paddingRight: 10}}>

                        <TouchableOpacity style={{backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", width:36, height: 36, marginRight: 10, borderRadius: 18}}
                        onPress={this.props.onPressProfile}>

                            {this.props.profileImage &&
                            <Image 
                            key={`${item.author}${this.props.index}`}
                            source={{uri: this.props.profileImage}} 
                            style={{width: "90%", height: "90%", borderRadius: 16}}/>} 

                        </TouchableOpacity>

                        <View style={{height: 42, flex: 1, justifyContent: "center"}}>
                            <T mini fade left style={{paddingBottom: Platform.OS === "ios" ? 3 : 0}}>{this.displayDate(item.created)}</T>

                            <Row style={{justifyContent: "flex-start", alignItems: "center", flexWrap: "nowrap"}}>
                                <TouchableOpacity onPress={this.props.onPressProfile}>
                                    <T bold>{item.author}</T>
                                </TouchableOpacity>
                                <T>{" in "}</T>
                                <TouchableOpacity activeOpacity={this.props.onPressCategory ? undefined : 1} onPress={this.props.onPressCategory}>
                                    <T bold numberOfLines={1}>{Platform.OS === "ios" && " "}{item.category}</T>
                                </TouchableOpacity>
                            </Row>
                        </View>
                    </Row>

                    <T left style={{paddingLeft: 10, paddingRight: 10, paddingBottom: 10, paddingTop: Platform.OS === "ios" ? 5 : 0}}>
                        {item.title}
                    </T>

                    {image &&
                    <Image key={`${item.title}${this.props.index}`} source={{uri: image}} style={{width: "100%", height: 160}}/>}

                </TouchableOpacity>

                <SocialRow item={item} net_votes={item.net_votes} width={width}/>
            </View>
        )
    }
}


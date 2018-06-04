import React, { Component } from 'react';
import { View, TouchableOpacity, ScrollView, ActivityIndicator, LayoutAnimation, KeyboardAvoidingView, Platform } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import { connect } from 'react-redux'

import { changeValue, visitScreen, loadSettings, saveSettings } from '../actions'

import Row from '../c/Row'
import T from '../c/T'
import Input from '../c/Input'
import Bubble from '../c/Bubble'

import style from '../style'

const icon = {
    marginLeft: 10, 
    borderRadius: 15,
    width: 30, 
    height: 30, 
    backgroundColor: "rgba(255,255,255,0.1)", 
    justifyContent: "center", 
    alignItems: "center"
}

// saves when user navigates away or opens the side menu
class Screen extends Component {
    componentDidMount() {
        this.props.loadSettings()
    }
    componentDidUpdate() {
        LayoutAnimation.easeInEaseOut()
    }
    scheduleSave() {
        // do all this on an instant run after updating the global state (to make sure we have the latest data)
        setTimeout(() => {
            // schedule a save 3 seconds after last edit
            const body = {
                settings: {
                    notifications: {
                        messages: this.props.notifyMessages,
                        mentions: this.props.notifyMentions,
                        follows: this.props.notifyFollows,
                        comments: this.props.notifyComments,
                        likes: this.props.notifyLikes,
                        replies: this.props.notifyReplies,
                        reposts: this.props.notifyReposts,
                        news: this.props.notifyNews,
                    },
                    blocks: this.props.blocks
                }
            }

            if(this.timer) {
                console.log("timer cleared")
                clearTimeout(this.timer)
            }

            this.timer = setTimeout(() => this.props.saveSettings(body), 1000)
        }, 0)
    }
    changeSetting(setting) {
        this.props.changeValue(setting, !this.props[setting])
        this.scheduleSave()
    }
    block() {
        if(this.props.blocks.indexOf(this.props.inputBlock) === -1) {
            if(this.props.inputBlock !== this.props.username) {
                const newBlocks = [this.props.inputBlock].concat(this.props.blocks);
                this.props.changeValue("blocks", newBlocks)
                this.props.changeValue("inputBlock", "")
                this.scheduleSave()
            }
        }
    }
    unblock(username) {
        const newBlocks = this.props.blocks.filter(item => item !== username);
        this.props.changeValue("blocks", newBlocks)
        this.scheduleSave()
    }
    listBlocks() {
        const blocks = this.props.blocks
        const list = []

        for(let i=0; i<blocks.length; i++) {
            list.push(<BlockedPerson name={blocks[i]} key={blocks[i]} onPress={() => this.unblock(blocks[i])}/>)
        }
        return list
    }
    render() {
        if(this.props.loadingSettings) {
            return(
                <View style={{flex: 1, justifyContent: "center"}}>
                    <ActivityIndicator size="large" color="rgb(255,255,255)"/>
                </View>
            )
        }
        return(
            <KeyboardAvoidingView style={{flex: 1}} keyboardVerticalOffset={65} behavior={Platform.OS === "ios" ? "padding" : null}>
            <ScrollView contentContainerStyle={{justifyContent:"center", alignItems: "center"}}>
                <T h2 style={{marginBottom: 5, marginTop: 10, fontSize: 24}}>
                    Push Notifications
                </T>

                <Checkbox label="Likes" value={this.props.notifyLikes}
                onPress={() => this.changeSetting("notifyLikes")}/>

                <Checkbox label="Comments" value={this.props.notifyComments}
                onPress={() => this.changeSetting("notifyComments")}/>

                <Checkbox label="Replies" value={this.props.notifyReplies}
                onPress={() => this.changeSetting("notifyReplies")}/>

                <Checkbox label="Mentions" value={this.props.notifyMentions}
                onPress={() => this.changeSetting("notifyMentions")}/>

                <Checkbox label="Reposts" value={this.props.notifyReposts}
                onPress={() => this.changeSetting("notifyReposts")}/>

                <Checkbox label="Follows" value={this.props.notifyFollows}
                onPress={() => this.changeSetting("notifyFollows")}/>

                <Checkbox label="Messages" value={this.props.notifyMessages} 
                onPress={() => this.changeSetting("notifyMessages")}/>

                <Checkbox label="News" value={this.props.notifyNews}
                onPress={() => this.changeSetting("notifyNews")}/>

                <T h2 style={{marginTop: 10, marginBottom: 5, fontSize: 24}}>
                    Block Messages
                </T>

                <Row>
                    <Input 
                        onChangeText={() => this.props.changeValue("friendInviteSuccess", false)} 
                        style={{height: 40, width: 170, marginBottom: 10, marginTop: 10, marginRight: 0}} 
                        lowerCase
                        noMargin 
                        autoCapitalize="none" 
                        icon="bullseye" 
                        label="inputBlock" 
                        placeholder="Username."
                    />

                    <Bubble onPress={() => this.block()} height={40} width={60} checkFields={[this.props.inputBlock]}>
                        Add
                    </Bubble>
                </Row>

                {this.listBlocks()}

                <View style={{height: 20}}/>

            </ScrollView>
            </KeyboardAvoidingView>
        )
    }
}

const mapStateToProps = state => {
    return { 
        username: state.persist.username,
        inputBlock: state.values.inputBlock,

        notifyMessages: state.values.notifyMessages,
        notifyMentions: state.values.notifyMentions,
        notifyFollows: state.values.notifyFollows,
        notifyComments: state.values.notifyComments,
        notifyLikes: state.values.notifyLikes,
        notifyReposts: state.values.notifyReposts,
        notifyReplies: state.values.notifyReplies,
        notifyNews: state.values.notifyNews,

        blocks: state.values.blocks || [],

        loadingSettings: state.values.loadingSettings
    }
};
  
export default connect(mapStateToProps, { changeValue, visitScreen, loadSettings, saveSettings })(Screen);

const Checkbox = (props) => {
    return(
        <Row style={{marginTop: 5}}>

            <T h3 style={{flex: 1, textAlign: "right", fontSize: 15}}>{props.label}</T>

            <View style={{flex: 1, alignItems: "flex-start"}}>
                <TouchableOpacity style={icon} onPress={props.onPress}>
                    <FontAwesome style={{ color: "#ffffff90", fontSize: 16}}>
                        {props.value && Icons.check}
                    </FontAwesome>
                </TouchableOpacity>
            </View>
        </Row>
    )
}

const BlockedPerson = (props) => {
    return(
        <Row style={{marginTop: 5}}>
            <T h3 style={{flex: 1, textAlign: "right", fontSize: 15}}>
                {props.name}
            </T>

            <View style={{flex: 1}}>
                <TouchableOpacity onPress={props.onPress} style={icon}>
                    <FontAwesome style={{ color: "#ffffff90", fontSize: 16}}>
                        {Icons.times}
                    </FontAwesome>
                </TouchableOpacity>
            </View>
        </Row>
    )
}



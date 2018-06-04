import React, { Component } from 'react';
import { View, FlatList, ActivityIndicator, LayoutAnimation, RefreshControl } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import { connect } from 'react-redux'

import { changeValue, visitScreen, getActivity, addImage, sendMessage, sendInvite } from '../actions'

import '../../shim.js'
import steem from 'steem'

import ChatPreview from '../c/ChatPreview'
import Input from '../c/Input'
import Bubble from '../c/Bubble'
import Row from '../c/Row'
import T from '../c/T'

import style from '../style'


class Screen extends Component {
    componentDidMount() {
        this.props.changeValue("loadingChats", true)
        this.props.changeValue("inputMessage", "")
        this.props.changeValue("showChatInviteFriend", false)
        this.props.changeValue("friendInviteSuccess", false)
        this.props.changeValue("friendInviteError", false)
        this.props.changeValue("friendInviteProgress", false)

        this.props.getActivity()
    }
    componentDidUpdate() {
        LayoutAnimation.easeInEaseOut()
    }
    getProfileImage(recipient) {
        if(!this.props.images[`profile-${recipient}`]) {
            steem.api.getAccounts([recipient], (err, result) => {         
                // get profile image
                if(result && result[0] && result[0].json_metadata) {
                    const metadata = JSON.parse(result[0].json_metadata)
                    const image = metadata.profile && metadata.profile.profile_image ? metadata.profile.profile_image 
                    : false

                    this.props.addImage(`profile-${recipient}`, image)
                }
                if(err) {
                    console.log(err)
                }
            });
        } 
    }
    getRecipient(item) {
        const userIndex = item.users.indexOf(this.props.username)
        const recipientIndex = userIndex === 0 ? 1 : 0

        return item.users[recipientIndex]
    }
    newChat() {
        if(this.props.inputNewRecipient === this.props.username) {
            return
        }
        // check chatlist to see if this chat already exists
        var chat = this.props.chatList.find((item) => {
            const match = this.getRecipient(item) === this.props.inputNewRecipient
            return match
        });
        console.log(chat)
        // existing chat - nav there
        if(chat) {
            this.props.changeValue("recipient", this.props.inputNewRecipient)
            this.props.visitScreen("ChatScreen");
            this.props.changeValue("chat", chat) 
            this.props.changeValue("inputNewRecipient", "")
        }
        // chat does not exist - send an empty initiation message to create it. chats with only empty initiation messages won't be listed in the view, but will be travelled to again whenever typing in a user's name
        else {
            const body = {
                username: this.props.username,
                recipient: this.props.inputNewRecipient,
                initiate: true
            }

            const callback = (chat) => {
                this.props.changeValue("recipient", this.props.inputNewRecipient)
                this.props.visitScreen("ChatScreen");
                this.props.changeValue("chat", chat) 
                this.props.changeValue("inputNewRecipient", "")
            }
            
            const notFoundCallback = () => {
                this.props.changeValue("showChatInviteFriend", true)
            }

            this.props.sendMessage(body, callback, notFoundCallback)
        }
    }
    render() {
        return(
            <View style={{flex: 1, justifyContent: "space-between", alignItems: "center", paddingTop: 5}}>

            {!this.props.showChatInviteFriend &&
            <Row style={{width: style.w-20}}>
                <Input lowerCase icon="userPlus" style={{flex: 4, marginRight: 0, marginLeft: 0, marginBottom: 0, marginTop: 0}} autoCapitalize='none' maxLength={30} label="inputNewRecipient" placeholder="Username."/> 

                <Bubble height={50} style={{flex: 1, marginRight: 0, marginLeft: 5, marginBottom: 0, marginTop: 0}} checkFields={[this.props.inputNewRecipient]} onPress={() => this.newChat()}>
                    New
                </Bubble>
            </Row>}

            {this.props.showChatInviteFriend &&
            <View style={{width: style.w-20}}>
                <View style={{height: 40, justifyContent: "center"}}>
                    <T fontB size={13} style={{opacity: 0.9}}>
                        {this.props.friendInviteSuccess ?
                        "Thanks! Send as many invites as you like."
                        : 
                        this.props.friendInviteError ? this.props.friendInviteError
                        :
                        `${this.props.inputNewRecipient} isn't on Vapor yet - send them an invite and we'll give you free STEEM when they sign up.`}
                    </T>
                </View>

                <Input lowerCase icon="paperPlane" style={{width: "100%", marginRight: 0, marginLeft: 0}} autoCapitalize='none' maxLength={30} label="inputInviteEmail" placeholder={`${this.props.inputNewRecipient}'s email (optional).`}/>

                <Row>
                    <Bubble height={50} style={{flex: 1, marginRight: 5, marginLeft: 0, marginTop: 0, marginBottom: 0}} onPress={() => {
                        this.props.changeValue("showChatInviteFriend", false)
                        this.props.changeValue("friendInviteError", false)
                        this.props.changeValue("inputNewRecipient", "")
                        this.props.changeValue("inputInviteEmail", "")
                        this.props.changeValue("friendInviteSuccess", false)
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
                     <Bubble height={50} style={{flex: 3, marginRight: 0, marginLeft: 0, marginTop: 0, marginBottom: 0}} onPress={() => this.props.sendInvite(this.props.inputNewRecipient, this.props.inputInviteEmail)}>
                        Invite
                    </Bubble>}
                </Row>               
            </View>}
            
           
           {this.props.loadingChats === false &&
           <FlatList
                contentContainerStyle={{alignItems: "center"}}
                style={{width: style.w, maxHeight: style.h}}
                keyExtractor={item => item._id.toString()}
                data={this.props.chatList}
                refreshing={false}
                refreshControl={
                    <RefreshControl
                        refreshing={this.props.refreshingActivity}
                        onRefresh={() => {
                            this.props.changeValue("refreshingActivity", true)
                            this.props.getActivity()
                        }}
                        tintColor="white"
                        colors={["white"]}
                        progressBackgroundColor={style.theme}
                        titleColor="white"
                     />
                }
                renderItem={({item}) => {
                    const recipient = this.getRecipient(item)
                    this.getProfileImage(recipient)
                    
                    // if the chat only has one message, and it's an empty "initiation" message, don't list it
                    if(item.messages.length === 1 && item.messages[0].initiate === true) {
                        return <View/>
                    }

                    return (
                        <ChatPreview 
                        key={item.read[this.props.username]} // prompt re-fresh if this changes
                        item={item} 
                        read={item.read[this.props.username]}
                        recipient={recipient}
                        username={this.props.username}
                        changeValue={this.props.changeValue}
                        profileImage={this.props.images[`profile-${recipient}`] || false}
                        onPress={() => { 
                            this.props.changeValue("recipient", recipient)
                            this.props.visitScreen("ChatScreen");
                            this.props.changeValue("chat", item) 
                        }}/>
                    )
                }}/>
            }

            {this.props.loadingChats === true && 
            <ActivityIndicator size="large" style={{width: 50}} color="white"/>}

            <View/>

            </View>
        )
    }
}

const mapStateToProps = state => {
    return { 
        chatList: state.values.chatList || [],
        username: state.persist.username,
        loadingChats: state.values.loadingChats,

        images: state.images,

        inputNewRecipient: state.values.inputNewRecipient,

        showChatInviteFriend: state.values.showChatInviteFriend,
        inputInviteEmail: state.values.inputInviteEmail,

        friendInviteSuccess: state.values.friendInviteSuccess,
        friendInviteProgress: state.values.friendInviteProgress,
        friendInviteError: state.values.friendInviteError,

        refreshingActivity: state.values.refreshingActivity || false
    }
};
  
export default connect(mapStateToProps, { visitScreen, changeValue, getActivity, addImage, sendMessage, sendInvite })(Screen);
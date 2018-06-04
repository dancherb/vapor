import React, { Component } from 'react';
import { View, FlatList, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import ImagePicker from 'react-native-image-picker'
import PhotoView from 'react-native-photo-view';
import FitImage from 'react-native-scalable-image';

import '../../shim.js'
import steem from 'steem'

import { connect } from 'react-redux'
import { changeValue, visitScreen, loadChat, sendMessage, sendImage, loadImages, addImage } from '../actions'

import MessageBox from '../c/MessageBox'
import Message from '../c/Message'
import Bubble from '../c/Bubble'

import style from '../style'
import { defaultBackground } from '../screens'

class Screen extends Component {
    componentDidMount() {
        // if viewing an existing chat, and not just 1 length (i.e more than just initiate message)
        if(this.props.chat && this.props.chat.messages.length > 1) {
            // if this is a new chat, minus the unread figure by 1 until we can dispatch to the server that we've read it and reload the figure that way
            console.log(this.props.chat.read[this.props.username])
            if(!this.props.chat.read[this.props.username]) {
                this.props.changeValue("unreadChats", this.props.unreadChats-1)
            }
        }
        setTimeout(() => {
            this.props.loadChat(this.props.chat._id, this.props.chat.messages.length)
            this.props.loadImages(this.props.chat.messages)
            this.getProfileImage(this.props.username)
            this.getProfileImage(this.props.recipient)
        }, 0)
        this.refresher = setInterval(() => this.props.loadChat(this.props.chat._id, this.props.chat.messages.length), 5000);
    }
    componentWillUnmount() {
        clearInterval(this.refresher);
    }
    prepareMessage() {
        const body = {
            username: this.props.username,
            recipient: this.props.recipient,
            text: this.props.inputMessage
        }
        const callback = () => this.props.loadChat(this.props.chat._id)
        this.props.sendMessage(body, callback) 
    }
    pickImage() {
        ImagePicker.showImagePicker({title: "Pick a picture.", maxWidth: 1000, maxHeight: 1000}, res => {
            if(!res.didCancel && !res.error) {
                // prepare body - we'll add an image property in the reducer
                const body = {
                    username: this.props.username,
                    recipient: this.props.recipient,
                }
                const callback = () => this.props.loadChat(this.props.chat._id)
                
                // start image sending process
                this.props.sendImage(this.props.chat._id, body, res.uri, callback)
            }
        })
    }
    getProfileImage(user) {
        if(!this.props.images[`profile-${user}`]) {
            steem.api.getAccounts([user], (err, result) => {         
                // get profile image
                if(result && result[0] && result[0].json_metadata) {
                    const metadata = JSON.parse(result[0].json_metadata)
                    const image = metadata.profile && metadata.profile.profile_image ? metadata.profile.profile_image 
                    : false

                    this.props.addImage(`profile-${user}`, image)
                }
                if(err) {
                    console.log(err)
                }
            });
        } 
    }
    render() {
        // ImageBackground doesn't seem to work with PhotoView so have to use FitImage with absolute position
        return(
            <View style={{flex: 1, justifyContent:"space-between", alignItems: "center"}}>
                <Modal transparent visible={this.props.viewingPhoto ? true : false} animationType={'slide'} onRequestClose={() => this.props.changeValue("viewingPhoto", false)} style={{alignItems: "center"}}>

                    <FitImage style={{position: "absolute", left: 0, top: 0, opacity: 0.95, width: "100%", height: "100%"}} height={style.h} source={defaultBackground}/>

                    {this.props.viewingPhoto &&
                    <PhotoView
                        source={{uri: this.props.viewingPhoto}}
                        minimumZoomScale={0.75}
                        maximumZoomScale={3}
                        androidScaleType="center"
                        onLoad={() => console.log("Image loaded!")}
                        style={{flex: 1}} 
                    />}

                    <Bubble height={60} style={{alignSelf: "center"}} onPress={() => this.props.changeValue("viewingPhoto", false)}>
                        Close
                    </Bubble>
            
                </Modal>

                <FlatList
                contentContainerStyle={{alignItems: "center"}}
                style={{width: style.w, maxHeight: style.h}}
                keyExtractor={item => item._id.toString()}
                data={this.props.chat.messages}
                inverted
                renderItem={({item}) => {
                    const me = item.username === this.props.username
                    // if initiation message, don't show
                    if(item.initiate === true) {
                        return <View/>
                    }
                    return (
                        <Message 
                            me={me} 
                            profileImage={me ? this.props.myProfileImage : this.props.recipientProfileImage}
                            item={item} 
                            image={this.props.images[item.image]}
                            onPressImage={() => this.props.changeValue("viewingPhoto", this.props.images[item.image])}
                        />
                    )
                }}/>

                <KeyboardAvoidingView keyboardVerticalOffset={65} behavior={Platform.OS === "ios" ? "padding" : null}>
                    <MessageBox 
                    onPress={() => this.prepareMessage()} 
                    onPressCamera={() => this.pickImage()}
                    inputMessage={this.props.inputMessage}/>
                </KeyboardAvoidingView>
            </View>
        )
    }
}

const mapStateToProps = state => {
    return { 
        inputMessage: state.values.inputMessage,
        username: state.persist.username,
        
        chat: state.values.chat || { users: [], messages: []},
        recipient: state.values.recipient,

        images: state.images,

        myProfileImage: state.images[`profile-${state.persist.username}`],
        recipientProfileImage: state.images[`profile-${state.values.recipient}`],

        viewingPhoto: state.values.viewingPhoto || false,

        unreadChats: state.values.unreadChats
    }
};
  
export default connect(mapStateToProps, { changeValue, visitScreen, loadChat, sendMessage, sendImage, loadImages, addImage })(Screen);
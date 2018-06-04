import React, { Component } from 'react';
import { View, Modal, TouchableOpacity, Keyboard, ActivityIndicator, LayoutAnimation, ImageBackground } from 'react-native';
import { connect } from 'react-redux'
import FontAwesome, { Icons } from 'react-native-fontawesome';

import { changeValue, persistValue, sendSupportMessage, visitScreen } from '../actions'

import T from '../c/T'
import Input from '../c/Input'
import Bubble from '../c/Bubble'
import Row from '../c/Row'

import style from '../style'
import { defaultBackground } from '../screens'

class Screen extends Component {
    componentDidMount() {
        this.props.changeValue("sentSupportMessage", false)
    }

    touchSend() {
        // LayoutAnimation.spring()
        this.props.changeValue("sentSupportMessage", false)
        this.props.changeValue("sendingSupportMessage", true)
        this.props.sendSupportMessage(this.props.username, this.props.inputSupportName, this.props.inputSupportEmail, this.props.inputSupportMessage)
    }
    saveDraft() {
        // draft already saved in persist, so just hide modal and go to home screen
        this.props.changeValue("showSupportModal", false)
        this.props.visitScreen("HomeScreen")
    }
    discardDraft() {
        // wipe redux persist values, then hide modal and go to home screen
        this.props.changeValue("showSupportModal", false)
        this.props.persistValue("inputSupportName", "")
        this.props.persistValue("inputSupportEmail", "")
        this.props.persistValue("inputSupportMessage", "")
        this.props.visitScreen("HomeScreen")
    }

    render() {
        return(
            <TouchableOpacity activeOpacity={1} onPress={() => Keyboard.dismiss()} style={{flex: 1, justifyContent:"center", alignItems: "center"}}>

                <Modal transparent visible={this.props.showSupportModal} animationType={'slide'} onRequestClose={() => this.saveDraft()}>

                    <ImageBackground source={defaultBackground} style={{flex: 1, justifyContent: "center", alignItems: "center", opacity: 0.95}}>
                        <Bubble height={60} onPress={() => this.saveDraft()}>
                            Save Draft
                        </Bubble>
                        <Bubble height={60} onPress={() => this.discardDraft()}>
                            Discard Draft
                        </Bubble>
                        <Bubble height={60} onPress={() => this.props.changeValue("showSupportModal", false)}>
                            Continue Editing
                        </Bubble>
                    </ImageBackground>

                </Modal>

                
                <View style={{flex: 1, marginTop: 5, marginLeft: 15, marginRight: 15, marginBottom: 0}}>
                    <Input persist icon="userO" width={"100%"} label="inputSupportName" placeholder="Your name (optional)."/>
                    <Input persist icon="envelopeO" width={"100%"} label="inputSupportEmail" placeholder="Your email address (optional)."/>
                    <Input autoCorrect persist icon="comment" multiline flex width={"100%"} label="inputSupportMessage" placeholder="Your message."/> 
                </View>
                
                <Row style={{width: style.w-20, marginBottom: 5}}>
                    <Bubble flex height={60} checkFields={[this.props.inputSupportMessage, !this.props.sendingSupportMessage]} onPress={() => this.touchSend()}>
                        Send
                    </Bubble>

                    {this.props.sendingSupportMessage &&
                    <ActivityIndicator size="large" style={{paddingRight: 5}} color={style.theme}/>}
                    
                    {this.props.sentSupportMessage &&
                    <FontAwesome style={{color: "rgba(255,255,255,0.75)", fontSize: 30, marginRight: 5}}>
                        {Icons.check}
                    </FontAwesome>}

                </Row>
                
            </TouchableOpacity>
        )
    }
}

const mapStateToProps = state => {
    return { 
        showSupportModal: state.values.showSupportModal || false,

        username: state.persist.username,
        inputSupportName: state.persist.inputSupportName,
        inputSupportEmail: state.persist.inputSupportEmail,
        inputSupportMessage: state.persist.inputSupportMessage,

        sendingSupportMessage: state.values.sendingSupportMessage,
        sentSupportMessage: state.values.sentSupportMessage
    }
};
  
export default connect(mapStateToProps, { changeValue, persistValue, sendSupportMessage, visitScreen })(Screen);

// {this.props.sentSupportMessage &&
//     <T mini style={{width: "90%", marginBottom: 5}}>
//     Thanks! We'll try and get back to you soon.
// </T>}
import React, { Component } from 'react'
import { View, Modal, ImageBackground, TouchableOpacity, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native'
import { connect } from 'react-redux'
import ImagePicker from 'react-native-image-picker'
import FontAwesome, { Icons } from 'react-native-fontawesome';

import { changeValue, persistValue, visitScreen, makePost } from '../actions'

import T from '../c/T'
import Row from '../c/Row'
import Input from '../c/Input'
import Bubble from '../c/Bubble'
import Selector from '../c/Selector'

import style from '../style'

import { defaultBackground } from '../screens'


class Screen extends Component {
    componentDidMount() {
        this.props.changeValue("showNewPostModal", false)
        this.props.changeValue("submittingPostFailure", false)
    }
    pickImage(number) {
        // check e.g. this.props.postImage2
        if(!this.props[`image${number}`]) {
            ImagePicker.showImagePicker({title: "Pick a picture.", maxWidth: 1000, maxHeight: 1000}, res => {
                if(!res.didCancel && !res.error) {       
                    this.props.persistValue(`imageUri${number}`, res.uri)
                    this.props.persistValue(`image${number}`, {uri: 'data:image/jpeg;base64,'+res.data, isStatic:true})
                }
            })
        } else {
            // if already an image, touching clears it
            this.props.persistValue(`imageUri${number}`, false)
            this.props.persistValue(`image${number}`, false)
        }
    }
    saveDraft() {
        // values will stay in redux persist so just navigate away
        this.props.changeValue("showNewPostModal", false)
        this.props.visitScreen("FeedScreen")
    }
    discardDraft() {
        // wipe redux persist values, then hide modal and go to home screen
        this.props.changeValue("showNewPostModal", false)
        this.clearFields()

        this.props.visitScreen("FeedScreen")
    }
    clearFields() {
        this.props.persistValue("inputPostTitle", "")
        this.props.persistValue("inputPostBody", "")
        this.props.persistValue("inputPostTags", "")
        this.props.persistValue("image1", false)
        this.props.persistValue("image2", false)
        this.props.persistValue("image3", false)
        this.props.persistValue("imageUri1", false)
        this.props.persistValue("imageUri2", false)
        this.props.persistValue("imageUri3", false)
    }
    submitPost() {
        this.props.changeValue("submittingPost", true)
        this.props.changeValue("submittingPostFailure", false)

        const callback = () => {
            // navigating to post and updating submittingPost state is handled in the action
            this.clearFields()
        }

        const body = {
            inputPostTitle: this.props.inputPostTitle,
            inputPostBody: this.props.inputPostBody,
            inputPostTags: this.props.inputPostTags,
            inputPostRewards: this.props.inputPostRewards,
            inputPostUpvote: this.props.inputPostUpvote,
            imageUri1: this.props.imageUri1,
            imageUri2: this.props.imageUri2,
            imageUri3: this.props.imageUri3
        }

        this.props.makePost(body, callback)
    }
            
    render() {
        return(
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1, justifyContent:"space-between", alignItems: "center"}}>

                <Modal transparent visible={this.props.showNewPostModal} animationType={'slide'} onRequestClose={() => this.props.changeValue("showNewPostModal", false)}>

                    <ImageBackground source={defaultBackground} style={{flex: 1, justifyContent: "center", alignItems: "center", opacity: 0.95}}>

                        <Bubble height={60} onPress={() => this.saveDraft()}>
                            Save Draft
                        </Bubble>

                        <Bubble height={60} onPress={() => this.discardDraft()}>
                            Discard Draft
                        </Bubble>
                        <Bubble height={60} onPress={() => this.props.changeValue("showNewPostModal", false)}>
                            Continue Editing
                        </Bubble>
                    </ImageBackground>

                </Modal>
             
                <View style={{alignItems: "center", width: style.w-20}}>

                    <View style={{alignItems: "center"}}>
                        <Input icon="bookmark" persist multiline style={{
                            height: null, 
                            maxHeight: 90, 
                            width: "100%", 
                            margin: 2.5, 
                            marginTop: 5, 
                        }} autoCorrect maxLength={255} label="inputPostTitle" placeholder="Title."/>

                        <Input icon="commenting" persist multiline flex style={{
                            width: "100%", 
                            margin: 2.5
                        }} autoCorrect maxLength={10000} returnKeyType='none' label="inputPostBody" placeholder="Story."/> 

                        <Row style={{marginTop: 2.5, marginBottom: 2.5}}>
                            <ImageBox image={this.props.image1} onPress={() => this.pickImage(1)} style={{marginRight: 5}}/>
                            <ImageBox image={this.props.image2} onPress={() => this.pickImage(2)} style={{marginRight: 5}}/>
                            <ImageBox image={this.props.image3} onPress={() => this.pickImage(3)}/>
                        </Row>

                        <Input icon="mapSigns" autoCapitalize='none' persist style={{width: "100%", margin: 2.5}} maxLength={80} label="inputPostTags" placeholder="Tags (up to 5 tags, main tag first)."/> 

                        <Row style={{marginTop: 2.5}}>
                            <Selector flex height={50} style={{marginRight: 5}} selected={this.props.inputPostRewards === "powerUp"} 
                            onPress={() => this.props.persistValue("inputPostRewards", "powerUp")}>
                                Power Up{"\n"}(100%)
                            </Selector>

                            <Selector flex height={50} style={{marginRight: 5}} selected={this.props.inputPostRewards === "default"} 
                            onPress={() => this.props.persistValue("inputPostRewards", "default")}>
                                Default{"\n"}(50% / 50%)
                            </Selector>

                            <Selector flex height={50} selected={this.props.inputPostRewards === "decline"} 
                            onPress={() => this.props.persistValue("inputPostRewards", "decline")}>
                                Decline{"\n"}Payout
                            </Selector>
                        </Row>
                        
                        {this.props.submittingPostFailure &&
                        <T bold>{this.props.submittingPostFailure}</T>}

                        <Row>

                            {this.props.submittingPost &&
                            <ActivityIndicator color={style.theme} size="large" style={{flex: 2, height: 60}}/>}

                            {!this.props.submittingPost &&
                            <Bubble 
                                height={50}
                                style={{
                                    flex: 2, 
                                    paddingRight: 5, 
                                    marginRight: 0, 
                                    marginLeft: 0, 
                                    marginTop: 5, 
                                    marginBottom: 5
                                }} 
                                checkFields={[
                                    this.props.inputPostTitle, this.props.inputPostTags, (this.props.inputPostBody || this.props.imageUri1 || this.props.imageUri2 || this.props.imageUri3)
                                ]} 
                                onPress={() => this.submitPost()}>
                                Submit
                            </Bubble>}

                            {/* <Bubble style={{flex: 1, marginRight: 0, marginLeft: 5, marginTop: 5, marginBottom: 5}} height={50} onPress={() => this.props.persistValue("inputPostUpvote", !this.props.inputPostUpvote)}>
                                Upvote{"\n"}
                                <FontAwesome style={{color: "rgba(255,255,255,0.75)", fontSize: 18}}>
                                    {this.props.inputPostUpvote ? Icons.check : Icons.times}
                                </FontAwesome>
                            </Bubble> */}
                            
                        </Row>
                    </View>

                </View>

            </KeyboardAvoidingView>
        )
    }
}

const mapStateToProps = state => {
    return { 
        username: state.persist.username,
        showNewPostModal: state.values.showNewPostModal || false,

        inputPostTitle: state.persist.inputPostTitle || "",
        inputPostBody: state.persist.inputPostBody || "",
        inputPostTags: state.persist.inputPostTags || "",
        inputPostRewards: state.persist.inputPostRewards || "default", // "default", "powerUp" or "decline"
        inputPostUpvote: state.persist.inputPostUpvote,

        imageUri1: state.persist.imageUri1,
        imageUri2: state.persist.imageUri2,
        imageUri3: state.persist.imageUri3,

        image1: state.persist.image1,
        image2: state.persist.image2,
        image3: state.persist.image3,

        submittingPost: state.values.submittingPost,
        submittingPostFailure: state.values.submittingPostFailure
    }
};
  
export default connect(mapStateToProps, { changeValue, persistValue, visitScreen, makePost })(Screen);

const ImageBox = props => {
    return(
        <TouchableOpacity onPress={props.onPress} style={{flex: 1, backgroundColor: "rgba(255,255,255,0.1)", height: 50,justifyContent: "center", alignItems: "center", ...props.style}}>

            {props.image ?
            <ImageBackground style={{width: "100%", height: "100%", justifyContent: "center", alignItems: "center"}} source={props.image}>
                <FontAwesome style={{color: "rgba(255,255,255,0.75)", fontSize: 30}}>
                    {Icons.times}
                </FontAwesome>
            </ImageBackground>
            :
            <FontAwesome style={{color: "rgba(255,255,255,0.3)", fontSize: 20}}>
                {Icons.camera}
            </FontAwesome>}

        </TouchableOpacity>
    )
}
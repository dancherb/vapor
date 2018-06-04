import React, { Component } from 'react'
import { View, Image, ScrollView, Modal, ImageBackground, TouchableOpacity, ActivityIndicator, LayoutAnimation, KeyboardAvoidingView, Platform } from 'react-native'
import { connect } from 'react-redux'
import ImagePicker from 'react-native-image-picker'
import FontAwesome, { Icons } from 'react-native-fontawesome';
import '../../shim.js'
import steem from 'steem'

import { changeValue, visitScreen, uploadProfilePicture, updateProfile, addImage } from '../actions'

import T from '../c/T'
import Row from '../c/Row'
import Input from '../c/Input'
import Bubble from '../c/Bubble'

import { defaultBackground } from '../screens'

import style from '../style'

const mainWidth = style.w-20

class Screen extends Component {
    componentDidMount() {
        this.props.changeValue("changedProfile", false)
        this.props.changeValue("updatingProfile", false)
        this.props.changeValue("loadingProfile", true)
        this.props.changeValue("uploadingProfilePicture", false)
        this.props.changeValue("showProfileModal", false)
        this.props.changeValue("finishedUpdatingProfile", false)
        this.loadProfile()
    }
    componentDidUpdate(prevProps) {
        if(prevProps.updatingProfile !== this.props.updatingProfile) {
            LayoutAnimation.easeInEaseOut()
        }
    }
    loadProfile(picture) {
        steem.api.getAccounts([this.props.username], (err, result) => {  
            // get profile image
            if(result && result[0]) {  
                if(result[0].json_metadata) {
                    const metadata = JSON.parse(result[0].json_metadata)
                    this.props.changeValue("originalProfileMetadata", metadata)
                    if(metadata.profile) {
                        this.props.changeValue("inputProfilePicture", metadata.profile.profile_image || "")
                        this.props.addImage(`profile-${this.props.username}`, metadata.profile.profile_image)
                        if(picture==="picture") {
                            this.props.changeValue("uploadingProfilePicture", "finished")
                            return;
                        }
                        // we need the cover image to keep it the same
                        this.props.changeValue("inputProfileCover", metadata.profile.cover_image || "") 
                        this.props.changeValue("inputProfileName", metadata.profile.name || "")
                        this.props.changeValue("inputProfileAbout", metadata.profile.about || "")
                        this.props.changeValue("inputProfileLocation", metadata.profile.location || "")
                        this.props.changeValue("inputProfileWebsite", metadata.profile.website || "")
                        this.props.changeValue("loadingProfile", false)
                    }
                }
            } 
            if(err) {
                console.log(err)
            }
        });  
    }
    saveProfile() {
        // takes the current profile picture and all of the values, and uploads this as the new metadata
        const metadata = { 
            profile: {
                name: this.props.inputProfileName,
                about: this.props.inputProfileAbout,
                location: this.props.inputProfileLocation,
                website: this.props.inputProfileWebsite,
                cover_image: this.props.inputProfileCover,
                profile_image: this.props.inputProfilePicture
            }
        }

        this.props.changeValue("originalProfileMetadata", metadata)
        this.props.changeValue("changedProfile", false)

        this.props.changeValue("updatingProfile", true)

        const callback = () => {
            this.props.changeValue("updatingProfile", false)
            this.props.changeValue("finishedUpdatingProfile", true)
        }

        const errorCallback = () => {
            this.props.changeValue("updatingProfile", false)
        }

        this.props.updateProfile(metadata, callback, errorCallback)
    }
    changedText() {
        this.props.changeValue("finishedUpdatingProfile", false)
        if(this.props.changedProfile === false) {
            this.props.changeValue("changedProfile", true)
        }
    }
    pickImage() {
        if((this.props.uploadingProfilePicture === false || this.props.uploadingProfilePicture === "finished") && !this.props.updatingProfile) {
            ImagePicker.showImagePicker({title: "Pick a picture.", maxWidth: 500, maxHeight: 500}, res => {
                if(!res.didCancel && !res.error) {

                    this.props.changeValue("uploadingProfilePicture", true)
                    
                    const callback = () => {
                        this.loadProfile("picture")
                        this.props.changeValue("uploadingProfilePicture", false)
                    }
                    const errorCallback = () => {
                        this.props.changeValue("uploadingProfilePicture", false)
                        this.loadProfile()
                    }
                    
                    // start image sending process. pass in their current profile picture so we can delete it if its on our server. process will access originalProfileMetadata and just slot in profile picture - any changed values won't be sent in yet.
                    this.props.uploadProfilePicture(res.uri, callback, errorCallback, this.props.inputProfilePicture)
                }
            })
        }
    }
    viewProfile() {
        this.props.changeValue("rootScreen", "EditProfileScreen")
        this.props.visitScreen("ProfileScreen")
        this.props.changeValue("viewingProfile", this.props.username)
    }
    render() {
        const showProfilePicture = this.props.uploadingProfilePicture === false || this.props.uploadingProfilePicture === "finished"

        if(this.props.postingKeyGiven) {
            return(
                <View style={{flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: 40}}>
                    <T style={{width: 300}}>
                        You're currently signed in with your Private Posting Key - editing your profile requires you to log in with your Private Active Key.{"\n\n"}Trying signing out from the side menu and logging in again with this key.
                    </T>
                </View>
            )
        }
        return(
            <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === "ios" ? "padding" : null}>

            <ScrollView contentContainerStyle={{justifyContent:"space-between", alignItems: "center"}} style={{flex: 1}}>

                <Modal transparent visible={this.props.showProfileModal} animationType={'slide'} onRequestClose={() => this.props.changeValue("showProfileModal", false)}>

                    <ImageBackground source={defaultBackground} style={{flex: 1, justifyContent: "center", alignItems: "center", opacity: 0.95}}>
                        <Bubble height={60} onPress={() => {
                            this.saveProfile("home")
                            this.props.changeValue("showProfileModal", false)
                        }}>
                            Save Changes
                        </Bubble>
                        <Bubble height={60} onPress={() => this.props.visitScreen("HomeScreen")}>
                            Discard Changes
                        </Bubble>
                        <Bubble height={60} onPress={() => this.props.changeValue("showProfileModal", false)}>
                            Continue Editing
                        </Bubble>
                    </ImageBackground>

                </Modal>

                    <Row>
                        <View style={{width: 50}}/>

                        <TouchableOpacity 
                            activeOpacity={showProfilePicture && !this.props.updatingProfile ? 0.3 : 1} 
                            onPress={() => this.pickImage()} 
                            style={{backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", width:150, height: 150, marginTop: 10}}
                        >
                            <Image key="me" resizeMethod="resize" source={{uri: this.props.inputProfilePicture}} 
                            style={{width: "93%", height: "93%"}}/>
                        </TouchableOpacity> 

                        {this.props.uploadingProfilePicture === true &&
                        <ActivityIndicator color="white" size="small" style={{width: 50, marginTop: 10}}/>}

                        {this.props.uploadingProfilePicture === "finished" &&
                        <View style={{width: 50, marginTop: 10, alignItems: "center"}}>
                            <FontAwesome style={{ color: "#ffffff90", fontSize: 21}}>
                                {Icons.check}
                            </FontAwesome>
                        </View>}

                        {!this.props.uploadingProfilePicture &&
                        <View style={{width: 50}}/>}
                    </Row>

                    <T h2 style={{marginBottom: 5}}>{this.props.username}</T>

                    {this.props.loadingProfile &&
                    <ActivityIndicator color="white" size="large" style={{marginTop: 40}}/>}

                    {!this.props.loadingProfile &&
                    <View style={{alignItems: "center"}}>
                        <Input onChangeText={() => this.changedText()} icon="user" maxLength={20} width={mainWidth} label="inputProfileName" placeholder="Your name."/>

                        <Input onChangeText={() => this.changedText()} icon="mapSigns" maxLength={30} width={mainWidth} label="inputProfileLocation" placeholder="Your location."/> 

                        <Input onChangeText={() => this.changedText()} icon="signal" maxLength={100} multiline height={85} width={mainWidth} label="inputProfileWebsite" placeholder="Your website."/> 

                        <Input autoCorrect onChangeText={() => this.changedText()} icon="newspaperO" maxLength={160} multiline height={120} width={mainWidth} label="inputProfileAbout" placeholder="About you."/>

                        <Row style={{width: mainWidth, alignItems: "center", justifyContent: "center"}}>
                            <Bubble flex style={{marginHorizontal: 0}} height={50} checkFields={[this.props.changedProfile, !this.props.updatingProfile]} onPress={() => this.saveProfile()}>
                                Save
                            </Bubble>

                            {this.props.updatingProfile === true &&
                            <ActivityIndicator color="white" size="small" style={{width: 40}}/>}

                            {this.props.finishedUpdatingProfile &&
                            <View style={{width: 40, alignItems: "center"}}>
                                <FontAwesome style={{ color: "#ffffff90", fontSize: 21}}>
                                    {Icons.check}
                                </FontAwesome>
                            </View>}
                            
                        </Row>
                    </View>}

            </ScrollView>

            </KeyboardAvoidingView>
        )
    }
}

const mapStateToProps = state => {
    return { 
        username: state.persist.username,
        postingKeyGiven: state.persist.postingKeyGiven,

        showProfileModal: state.values.showProfileModal,

        inputProfilePicture: state.values.inputProfilePicture,
        inputProfileName: state.values.inputProfileName,
        inputProfileAbout: state.values.inputProfileAbout,
        inputProfileLocation: state.values.inputProfileLocation,
        inputProfileWebsite: state.values.inputProfileWebsite,

        changedProfile: state.values.changedProfile,
        updatingProfile: state.values.updatingProfile,
        loadingProfile: state.values.loadingProfile,
        uploadingProfilePicture: state.values.uploadingProfilePicture,
        finishedUpdatingProfile: state.values.finishedUpdatingProfile
    }
};
  
export default connect(mapStateToProps, { changeValue, visitScreen, uploadProfilePicture, updateProfile, addImage })(Screen);
import React, { Component } from 'react';
import { View, ActivityIndicator, LayoutAnimation } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';

import { connect } from 'react-redux'
import { changeValue, visitScreen, signIn } from '../actions'

import T from '../c/T'
import style from '../style'

class Screen extends Component {
    componentDidMount() {
        this.props.changeValue("signInMessage", false)
    }
    readCode(e) {
        if(this.props.scanning !== true) {
            this.props.changeValue("signingIn", true)
            this.props.changeValue("password", e.data)
            setTimeout(() => {
                LayoutAnimation.easeInEaseOut()
                this.props.signIn()
            }, 0)
        }
    }
    render() {
        const customMarker = (
            <View style={{
                width: style.w-120, 
                height: style.w-120, 
                borderColor: this.props.signingIn ? `${style.theme}50` : "rgba(255,255,255,0.5)", 
                borderWidth: 5
            }}/>
        )
        return(
            <View style={{flex: 1, justifyContent:"space-between", alignItems: "center"}}>

                <View style={{height: 40, justifyContent: "center"}}>
                    {this.props.signingIn && 
                    <ActivityIndicator size="small" color="white"/>}

                    {!this.props.signingIn &&
                    <T fontB bold padX={10}>
                        {this.props.signInMessage || `Hi ${this.props.username} - please scan your Private Posting or Private Active Key.`}
                    </T>}
                </View>
                
                <QRCodeScanner cameraStyle={{height: "100%", width: "100%"}} reactivate reactivateTimeout={5000} fadeIn showMarker customMarker={customMarker} onRead={(e) => this.readCode(e)}/>

                <View style={{margin: 10}}>
                    <T fontB bold>To find your QR code:</T>
                    <T fontB>
                        1. Log onto steemit.com.{"\n"}
                        2. Click Profile -> Wallet -> Permissions.{"\n"}
                        3. Next to "POSTING" or "ACTIVE", click "LOGIN TO SHOW", then "SHOW PRIVATE KEY".{"\n"}
                        4. Click the QR code under "POSTING" or "ACTIVE" and scan!
                    </T>
                </View>

            </View>
        )
    }
}

const mapStateToProps = state => {
    return { 
        username: state.persist.username,
        signInMessage: state.values.signInMessage,
        signingIn: state.values.signingIn
    }
};
  
export default connect(mapStateToProps, { changeValue, visitScreen, signIn })(Screen);
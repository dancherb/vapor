import React, { Component } from 'react';
import { Platform } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';

import Row from './Row'
import Bubble from './Bubble'
import Input from './Input'

import style from '../style'

export default class MessageBox extends Component {
    render() {
        return(
            <Row style={{flexDirection: "row", width: style.w-20, alignItems: null, marginTop: 5, marginBottom: 5}}>        
                <Input 
                autoCorrect
                multiline 
                flex
                noMargin
                noPadding={Platform.OS === "android"}
                label="inputMessage" 
                placeholder="Your message." 
                icon="comment"/>

                <Bubble style={{width: 55, height: null, margin: 0, marginLeft: 5}} checkFields={[this.props.inputMessage]} onPress={this.props.onPress}>
                    Send
                </Bubble>

                <Bubble style={{width: 40, borderRadius: 20, height: null, margin: 0, marginLeft: 5}} onPress={this.props.onPressCamera}>
                    <FontAwesome style={{fontSize: 14, color: "rgba(255,255,255,0.5)"}}>
                        {Icons.camera}
                    </FontAwesome>
                </Bubble>

            </Row>
        )
    }
}
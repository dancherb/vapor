// general input text component - how to use: 
// <Input label="hi" placeholder="ok"/>
// sets state.values.hi or state.persist.hi = "what's entered". (depending on persist prop)
// other props: width (default 80%), height, size, bold, sharp (for sharp corners - default rounded), secure, numeric (for numeric keyboard)

import React, { Component } from 'react';
import { TextInput, Platform } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import { connect } from 'react-redux'

import { changeValue, persistValue } from '../actions'

import Row from './Row'

import style from '../style'

class Input extends Component {
    container = {
        width: this.props.flex ? null : (this.props.width || 230),
        height: this.props.flex ? null : (this.props.height || 50),
        flex: this.props.flex ? 1 : null,
        justifyContent: "flex-start",
        alignItems: "flex-start",
        backgroundColor: "rgba(255,255,255,0.05)",
        margin: this.props.noMargin ? 0 : 5,
        ...this.props.style
    } 
    input = {
        flex: 1,
        height: "100%",
        width: "100%",
        fontSize: this.props.size || 13,
        fontFamily: "Nunito-Light",
        color: "rgba(255,255,255,0.85)",
        textAlign: this.props.center ? "center" : null,
        textAlignVertical: "top",
        
        paddingTop: this.props.multiline && Platform.OS === "ios" ? 15 
        : this.props.noMargin ? (Platform.OS === "android" ? null : 2) 
        : Platform.OS === "android" ? 16 : 4,

        paddingBottom: this.props.noPadding ? 0 : 
        this.props.multiline && Platform.OS === "ios" ? 15 : undefined,

        ...this.props.inputStyle
    }
    render() {
        const icon = {
            color: this.props.value && this.props.value !== "" ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)", 
            fontSize: this.props.fontSize || 14,
            marginTop: this.props.multiline && Platform.OS === "ios" ? 0 : this.props.noMargin ? 12.5 : 17,
            marginLeft: 10, 
            marginRight: 5,
            paddingTop: this.props.multiline && Platform.OS === "ios" ? 17 : undefined,
            ...this.props.iconStyle
        }
        return(
            <Row style={this.container}>
                <FontAwesome style={icon}>
                    {Icons[this.props.icon]}
                </FontAwesome>

                <TextInput
                    style={this.input}
                    value={this.props.value}
                    placeholder={this.props.placeholder}
                    keyboardType={this.props.numeric ? "numeric" : undefined}
                    autoCorrect={this.props.autoCorrect || false}
                    underlineColorAndroid="rgba(0,0,0,0)"
                    selectionColor={style.theme}
                    placeholderTextColor='rgba(255,255,255,0.3)'
                    multiline={this.props.multiline}
                    secureTextEntry={this.props.secureTextEntry || this.props.secure}
                    maxLength={this.props.maxLength}
                    onFocus={this.props.onFocus}
                    autoCapitalize={this.props.autoCapitalize}
                    blurOnSubmit
                    returnKeyType={this.props.returnKeyType || undefined}
                    onEndEditing={this.props.onEndEditing}
                    onChangeText={(text) => {
                        if(this.props.lowerCase) {
                            text = text.toLowerCase()
                        }
                        if(this.props.onChangeText) {
                            this.props.onChangeText()
                        }
                        if(this.props.persist) {
                            this.props.persistValue(this.props.label, text)
                        } else {
                            this.props.changeValue(this.props.label, text)
                        }
                    }}
                />
            </Row>
        )
    }
}

function mapStateToProps(state, ownProps) {
    return { 
        value: ownProps.persist ? state.persist[ownProps.label] : state.values[ownProps.label]
    }
}
  
export default connect(mapStateToProps, {changeValue, persistValue})(Input);
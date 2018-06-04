// white bubble button

import React, { Component } from 'react';
import { Text, TouchableHighlight } from 'react-native';


export default class Bubble extends Component {
    disableCheck() {
        if(this.props.disable) {
            return true;
        }
        // if a list was given as a checkFields prop, check if all of these fields have falues
        // if any are empty, return true and disable button
        if(this.props.checkFields) {
            const list = this.props.checkFields
            for(let i=0; i<list.length; i++) {
                if(!list[i] || list[i] === "") {
                    return true
                }
            }
        }
        return false;
    }
    render() {
        const boxStyle = {
            // if width/height given, use that. otherwise if flex given, no fixed width. otherwise if "wide" given, use that. otherwise, use default fixed width/height.
            width: this.props.width || (this.props.flex ? null : (this.props.menu ? 230 : this.props.wide ? 200 : 130)),
            height: this.props.height || (this.props.flex ? null : (this.props.wide || this.props.menu ? 60 : 90)),

            flex: this.props.flex ? 1 : null,
            flexDirection: this.props.row ? "row" : null,

            justifyContent: "center",
            margin: 5,
            backgroundColor: this.disableCheck() ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",

            ...this.props.style
        }
        const textStyle = {
            fontSize: this.props.size || 13,

            fontFamily: "Nunito-Regular",
    
            fontStyle: this.props.italic ? "italic" : null,
            fontWeight: this.props.bold ? "bold" : null,
    
            textAlign: "center",
    
            color: this.disableCheck() ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.75)",
        }
        return(
            <TouchableHighlight 
                underlayColor={'rgba(255,255,255,0.25)'} 
                style={boxStyle} 
                onPress={this.disableCheck() ? null : this.props.onPress}
                >
                <Text style={textStyle}>
                    {this.props.text || this.props.children}
                </Text>
            </TouchableHighlight>
        )
    }
}
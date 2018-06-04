import React, { Component } from 'react';
import { Text, TouchableHighlight } from 'react-native';

import style from '../style';

export default class Selector extends Component {
    render() {
        const boxStyle = {
            width: this.props.width || "25%",
            height: this.props.height || 40,

            flex: this.props.flex ? 1 : null,
            flexDirection: this.props.row ? "row" : null,

            justifyContent: "center",
            margin: this.props.margin || 0,
            backgroundColor: this.props.selected ? style.theme : "rgba(255,255,255,0.1)",

            ...this.props.style
        }
        const textStyle = {
            fontSize: this.props.size || 13,

            fontFamily: "Nunito-Regular",
    
            fontStyle: this.props.italic ? "italic" : null,
            fontWeight: this.props.bold ? "bold" : null,
    
            textAlign: "center",
    
            color: "rgba(255,255,255,0.75)",
        }
        return(
            <TouchableHighlight 
                underlayColor={'rgba(255,255,255,0.25)'} 
                style={boxStyle} 
                onPress={this.props.onPress}
                >
                <Text style={textStyle}>
                    {this.props.text || this.props.children}
                </Text>
            </TouchableHighlight>
        )
    }
}
import React, { Component } from 'react';
import { View } from 'react-native';

import style from '../style';

export default class Block extends Component {
    render() {
        return(
            <View style={{
                flexDirection: this.props.row ? "row" : "column",
                backgroundColor: style.theme, //'rgba(255,255,255,0.1)',
                width: this.props.width || "100%", 
                height: this.props.height || null, 
                ...this.props.style}}>
                {this.props.children}
            </View>
        )
    }
}
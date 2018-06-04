import React, { Component } from 'react';
import { Text, Platform } from 'react-native';

import style from '../style';

const font = "JosefinSans-Light"
const boldFont = "JosefinSans-SemiBold" 

const fontB = "Nunito-Light"
const boldFontB = "Nunito" //"Nunito-SemiBold"

export default class T extends Component {
    static defaultProps = {
        width: null,
        size: 0,
        left: false, // alignment (default center)
        right: false,
        padX: 0,
        padY: 0,
        border: false,
        white: false,
        color: false,
        alpha: false
    }
    warning = this.props.warning
    color = this.props.color

    h1 = this.props.h1
    h2 = this.props.h2
    h3 = this.props.h3
    mini = this.props.mini

    red = this.props.red
    bold = this.props.bold
    italic = this.props.italic
    white = this.props.white

    alpha = this.props.alpha
    fade = this.props.fade

    shadow = this.props.shadow

    style = {
        borderWidth: this.props.border ? 5 : 0,

        color: this.color ? this.color 
        : this.red ? style.colours[0]
        : this.white ? "white" 
        : this.warning ? style.warning 
        : this.h0 ? style.h1
        : this.h1 ? style.h1
        : this.h2 ? style.h2
        : this.h3 ? style.h3
        : style.primary,

        fontSize: this.props.size > 0 ? this.props.size // if size set, use this. otherwise..
        : this.h0 ? 35
        : this.h1 ? 30
        : this.h2 ? 25
        : this.h3 ? 16
        : this.mini ? 12
        : 14,
        
        // fontWeight: this.bold ? "bold" : null,
        // fontStyle: this.italic ? "italic" : null,

        alignSelf: this.props.right ? "flex-end" : this.props.left ? "flex-start": "center",
        textAlign: this.props.right ? "right" : this.props.left ? "left" : "center",
        
        width: this.props.width,

        paddingRight: this.props.padX,
        paddingLeft: this.props.padX,
        paddingTop: this.props.padY,
        paddingBottom: this.props.padY,

        fontFamily: this.props.fontB ? (this.props.bold ? boldFontB : fontB) : this.props.bold ? boldFont : font,

        ...this.props.style
    }
    
    render() {
        return(
            <Text numberOfLines={this.props.numberOfLines} style={[this.style, { opacity: this.props.alpha || this.props.fade ? (Platform.OS === "ios" ? 0.75 : 0.5) : (Platform.OS === "ios" ? 0.95 : 0.9)}]}>
                {this.props.children}
            </Text>
        )
    }
}
          

// how to use:
// <Button B sharp width={185} onPress={() => this.doStuff} text="Hi"/>

// available props:
// text (the text to display on the button - can also write inside, as props.children )
// G, R, B, Y, P, S, C [coal] (button colour)
// disable (faded text colour)
// black (to use black colour - default is white)
// colour (to use primary text colour - default is white)
// circle (circular button, radius set by below cR)
// sharp (sharp corners - default is rounded)
// chunky (bigger, softer border)
// width, height, minWidth, size [font size]
// bold, italic
// outline (for a black ouline around the whole button)

import React, { Component } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default class Button extends Component {
    static defaultProps = {
        size: 18,
        bold: false,
        thin: false,
        italic: false,
        sharp: false,
        margin: 3,
        minWidth: 150,
        disable: false,
        noMinWidth: false
    }

    G = this.props.G
    R = this.props.R
    B = this.props.B
    Y = this.props.Y
    P = this.props.P
    S = this.props.S
    C = this.props.C // C works slightly differently, using a bottom border instead of background view

    black = this.props.black

    // colour prop for whether use primary colour or white. silver button just uses primary colour
    colour = this.props.S ? true : this.props.colour 

    bold = this.props.bold

    outline = this.props.outline
    sharp = this.props.sharp
    min = this.props.min // a thinner, more minimal sharp look

    circle = this.props.circle
    cR = 100

    chunky = this.props.chunky

    disable = this.props.disable

    style = {
        minWidth: this.props.width < this.props.minWidth ? null : this.props.minWidth,

        fontSize: this.props.size,

        fontStyle: this.props.italic ? "italic" : null,
        fontWeight: this.bold ? "bold" : null,

        textAlign: "center",

        padding: 16,

        margin: this.chunky ? 2 : this.C || this.min ? 0 : 1,

        borderRadius: this.circle ? this.cR 
        : this.sharp ? 0 
        : 1,

        borderTopLeftRadius: this.circle ? this.cR 
        : this.sharp ? 0 
        : 3,

        borderTopRightRadius: this.circle ? this.cR 
        : this.sharp ? 0
        : 3,

        color: this.black && this.disable ? colours.buttonBlackDisable
        : this.black ? colours.buttonBlack 
        : this.colour && this.disable ? colours.primaryDisable
        : this.colour ? colours.primary
        : this.disable ? 'rgba(255, 255, 255, 0.25)'
        : "white",

        backgroundColor: this.G ? colours.buttonG
        : this.R ? colours.buttonR
        : this.B ? colours.buttonB
        : this.Y ? colours.buttonY
        : this.P ? colours.buttonP
        : this.S ? colours.buttonS
        : this.C ? colours.buttonC
        : null,

        borderColor: this.outline ? "#2E2E2E" 
        : this.C ? colours.buttonCBg
        : null,
        
        borderBottomWidth: this.C && this.circle ? 6
        : this.C ? 5
         : null,
        borderRightWidth: this.C && this.circle ? 2 : null,
        borderLeftWidth: this.C && this.circle ? 2 : null,
    }
    outerStyle = {
        width: this.props.width ? this.props.width : null,
        height: this.props.height ? this.props.height : null,

        alignSelf: "center",
        justifyContent: "center",

        borderRadius: this.circle && this.C ? null
        : this.circle? this.cR
        : this.sharp ? null
        : 6,

        padding: this.C || (this.sharp && this.min) ? 0
        : this.sharp ? 1
        : 2,
        
        paddingTop: 0,
        paddingBottom: this.C ? 0 : 5,

        margin: this.props.margin,

        backgroundColor: this.G ? colours.buttonGBg
        : this.R ? colours.buttonRBg
        : this.B ? colours.buttonBBg
        : this.Y ? colours.buttonYBg
        : this.P ? colours.buttonPBg
        : this.S ? colours.buttonSBg
        : null,

        borderWidth: this.outline ? 3 : null, 

        ...this.props.style
    }
    render() {
        return(
            <TouchableOpacity onPress={this.props.disable ? null : this.props.onPress} >
                <View pointerEvents="none" style={this.outerStyle}>
                    <Text style={this.style}>
                        {this.props.text || this.props.children}
                    </Text>
                </View>
            </TouchableOpacity>
        )
    }
}

const colours = {
    buttonG: '#28B62C',
    buttonGBg: '#23a127',
    
    buttonR: '#FF4136',
    buttonRBg: '#ff1d10',
    
    buttonB: '#158CBA',
    buttonBBg: '#127ba3',
    
    buttonY: '#FF851B',
    buttonYBg: '#ff7702',
    
    buttonP: '#8B61B4',
    buttonPBg: '#755198',

    buttonS: 'rgba(255, 255, 255, 0.6)',
    buttonSBg: 'rgba(255, 255, 255, 0.5)',

    buttonC: 'rgba(0, 0, 0, 0.75)',
    buttonCBg: 'rgba(0, 0, 0, 0.9)',

    buttonBlack: 'rgb(46, 46, 46)',
    buttonBlackDisable: 'rgba(46, 46, 46, 0.35)',

    primaryDisable: 'rgba(51, 51, 51, 0.35)'
}
          


import React, { Component } from 'react';
import { View, Image, Platform } from 'react-native';
import moment from 'moment';
import FitImage from 'react-native-scalable-image';

import T from './T'
import Row from './Row'

import style from '../style'


export default class Message extends Component {
    container = { 
        width: "100%",
        height: null,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingLeft: 5,
        paddingRight: 10,
        paddingBottom: 4,
        paddingTop: 4,
        borderLeftWidth: this.props.me ? 0 : 2,
        borderRightWidth: this.props.me ? 2 : 0,
        borderColor: this.props.me ? style.theme : style.colours[3],
    }
    displayDate(date) {
        const localized = new Date(date) // converts to local date (3:10pm becomes 4:10pm if in Berlin)
        // subtract 10 seconds to work around "in a few seconds" bug
        const display = moment(localized).subtract(10, 'seconds').fromNow(); // returns e.g. "2 hours ago" (posted 2:10pm in Berlin or 1:10pm UTC)
        return display
    }
    profileImage() {
        return(
            <View style={{backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", width:30, height: 30, marginRight: this.props.me ? 0 : 10, marginLeft: this.props.me ? 10 : 0,borderRadius: 15}}>
                <Image source={{uri: this.props.profileImage}} style={{width: "90%", height: "90%", borderRadius: 13.5}}/> 
            </View>
        )
    }
     render() {
        const item = this.props.item
        return(
            <View style={{width: style.w-20, marginTop: 0, marginBottom: 5}}>
                <T mini fade padY={2}>{this.displayDate(item.date)}</T>
                <Row style={this.container}>
                    
                    {!this.props.me &&
                    this.profileImage()}

                    {(item.text && !item.image) &&
                    <T left={!this.props.me} right={this.props.me} style={{flex: 1, paddingTop: Platform.OS === "ios" ? 10 : 4, paddingBottom: 9}}>
                        {item.text} 
                    </T>}

                    {item.image && 
                    <FitImage onPress={this.props.onPressImage} width={style.w-80} source={{uri: this.props.image}}/>}

                    {this.props.me &&
                    this.profileImage()}
                </Row>
            </View>
        )
    }
}
          


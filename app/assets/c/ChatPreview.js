import React, { Component } from 'react';
import { View, Image, TouchableOpacity, Platform } from 'react-native';
import moment from 'moment';

import T from './T'
import Row from './Row'

import style from '../style'

export default class ChatPreview extends Component {
    container = { 
        width: style.w-20,
        height: 70,
        backgroundColor: this.props.read ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)" ,
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: 5,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 2,
        paddingTop: 4,
        borderLeftWidth: 2,
    }
    displayDate(date) {
        const localized = new Date(date) // converts to local date (3:10pm becomes 4:10pm if in Berlin)
        return moment(localized).fromNow(); // returns e.g. "2 hours ago" (posted 2:10pm in Berlin or 1:10pm UTC)
    }
    render() {
        const lastMessage = this.props.item.messages[0]
        return(
            <TouchableOpacity onPress={this.props.onPress} style={[this.container, { borderColor: lastMessage.username !== this.props.username ? style.colours[3] : style.theme}]}>

                <Row style={{justifyContent: "space-between", width: "100%"}}>
                    <Row>
                        <View style={{backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", width:36, height: 36, marginRight: 10, marginTop: 2, borderRadius: 18}}>
                            {this.props.profileImage &&
                            <Image source={{uri: this.props.profileImage}} style={{width: "90%", height: "90%", borderRadius: 16}}/>}
                        </View>
                        
                        <T bold>{this.props.recipient}</T>
                    </Row>

                    <T mini fade>{this.displayDate(lastMessage.date)}</T>
                </Row>

                <T left numberOfLines={1} style={{marginTop: Platform.OS === "ios" ? 5 : undefined}}>{lastMessage.text || "Image sent."}</T>

            </TouchableOpacity>
        )
    }
}
          


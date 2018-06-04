import React, { Component } from 'react';
import { ActivityIndicator } from 'react-native';

import Row from './Row'
import Bubble from './Bubble'
import Input from './Input'

import style from '../style'

export default class CommentBox extends Component {
    render() {
        return(
            <Row style={{flexDirection: "row", width: style.w-20, alignItems: null, marginTop: 5, marginBottom: 5}}>
                <Input 
                autoCorrect
                multiline 
                flex
                noMargin
                style={{height: null, minHeight: 65}} 
                label="inputComment" 
                placeholder="Your comment." 
                icon="comment"/>

                {this.props.submittingComment &&
                <ActivityIndicator size="small" color="white" style={{width: 70, height: null}}/>}

                {!this.props.submittingComment &&
                <Bubble style={{width: 70, height: null, margin: 0, marginLeft: 5}} checkFields={[this.props.inputComment]} onPress={() => this.props.onPress()}>
                    Add
                </Bubble>}

            </Row>
        )
    }
}
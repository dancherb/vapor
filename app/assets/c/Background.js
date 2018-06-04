import React, { Component } from 'react';
import { ImageBackground } from 'react-native';

import { connect } from 'react-redux'
import { visitScreen } from '../actions'

import { defaultBackground } from '../screens'

class Background extends Component {
    render() {
        return(
            <ImageBackground style={{flex: 1}} source={ defaultBackground }>
                    {this.props.children}
            </ImageBackground>
        )
    }
}

const mapStateToProps = () => {
    return { 
    }
};

export default connect(mapStateToProps, {visitScreen})(Background);

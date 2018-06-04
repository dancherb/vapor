// just a view with FlexDirection set to row. easy
// also takes "border", "left", "right", "top" and "bottom" - everything centered by default

import React from 'react';
import { View } from 'react-native';

export default function Row(props) {
    return(
        <View style={{
            flexDirection: "row", 
            flexWrap: "wrap",
            borderWidth: props.border ? 5 : null,
            justifyContent: props.left ? "flex-start" : props.right ? "flex-end" : "center",
            alignItems: props.top ? "flex-start" : props.bottom ? "flex-end" : "center",
            width: props.width ? props.width : null,
            ...props.style
        }}>
            {props.children}
        </View>
    )
}
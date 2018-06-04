// a lovely component for taking up blank space
// pass in width, height and/or border (for debugging)
// e.g. <Blank height={50}/>

import React from 'react';
import { View } from 'react-native';

const Blank = props => {
  return(
    <View style={{ 
        height: props.height, 
        width: props.width, 
        borderWidth: props.border ? 5 : null
      }}/>
  )
}

export default Blank;

import { Dimensions } from 'react-native'

const width = Dimensions.get('window').width
const height = Dimensions.get('window').height

const primary = 'white' // lighter grey #383838 // red '#5B2B2B' // purple '#674674' // '#3B4F24' //'#2E2E2E'

export default {
    colours: ["#cc2d2d", "#d07c28", "#cfbb29", "#70d226", "#2bceca", "#9248ce", "#be3ab1"],

    w: width,
    h: height,

    primary, 

    theme: '#5a99cd', // #683deb purple
    themeFaded: '#72a8d3',

    warning:'#b90a00',
    h1: primary,
    h2: primary,
    h3: primary,

    iconFill: 'rgba(0, 0, 0, 0.5)',
    icon: 'rgba(0, 0, 0, 0.25)',

    softBorder: "rgba(14,94,124,0.5)",

    placeholder: 'rgba(0, 0, 0, 0.3)',
    inputText: primary,
}
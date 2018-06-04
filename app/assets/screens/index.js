import { DrawerNavigator, TabNavigator } from 'react-navigation'; // can also use TabNavigator or StackNavigator

import Menu from './Menu';

import WelcomeScreen from './WelcomeScreen';
import ScanScreen from './ScanScreen';

import HomeScreen from './HomeScreen';
import EditProfileScreen from './EditProfileScreen';
import ChatListScreen from './ChatListScreen';
import ChatScreen from './ChatScreen';
import SupportScreen from './SupportScreen';
import NotificationsScreen from './NotificationsScreen';
import SettingsScreen from './SettingsScreen';

import FeedScreen from './FeedScreen';
import ProfileScreen from './ProfileScreen';
import PostScreen from './PostScreen';
import CommentsScreen from './CommentsScreen';

import NewPostScreen from './NewPostScreen';


const homeImg = require('../img/bg.png');

// set first screen (accessed in NavReducer)
export const firstScreen = "WelcomeScreen" 

export const defaultBackground = homeImg;

// prepare tabs for a nested tab navigator
export const tabs = {
    "FeedScreen": { 
        screen: FeedScreen ,
        header: "Feed",
        back: "HomeScreen"
    },
    "ProfileScreen": { 
        screen: ProfileScreen,
        header: "Profile",
        back: "custom"
    },
    "PostScreen": { 
        screen: PostScreen,
        header: "Post",
        back: "custom"
    },
    "CommentsScreen": { 
        screen: CommentsScreen,
        header: "Comments", 
        back: "custom",
    }
}

// prepare the nested tab navigator
const TabScreen = TabNavigator(tabs,
{
    tabBarComponent: () => null,
    animationEnabled: true,
    swipeEnabled: false,
});

// prepare top level screens for React Navigation
export const screens = {
    "WelcomeScreen": { 
        file: WelcomeScreen,
        locked: true, // drawer locked? - defaults to false
        back: false, // false: exit app, true: just remain in app, "OtherScreen": screen to visit
        header: "vapor"
    },
    "ScanScreen": { 
        file: ScanScreen,
        locked: true,
        back: "WelcomeScreen",
        header: "Scan QR"
    },
    "HomeScreen": { 
        file: HomeScreen,
        back: false,
        menu: true, // show menu button ('back' must be false)
        header: "vapor"
    },
    "EditProfileScreen": { 
        file: EditProfileScreen,
        back: "custom",
        header: "Edit"
    },
    "ChatListScreen": { 
        file: ChatListScreen,
        back: "HomeScreen",
        header: "Messages"
    },
    "ChatScreen": { 
        file: ChatScreen,
        back: "ChatListScreen",
        header: "recipient"
    },
    "SupportScreen": { 
        file: SupportScreen,
        back: "custom", // specific actions for back button are found in Header component
        header: "Contact Us"
    },
    "NotificationsScreen": { 
        file: NotificationsScreen,
        back: "HomeScreen",
        header: "Notifications"
    },
    "SettingsScreen": { 
        file: SettingsScreen,
        back: "HomeScreen",
        header: "Settings"
    },
    "TabScreen": {
        file: TabScreen,
        tabs: true // this means it's treated slightly differently when we loop over the screens
    },
    "NewPostScreen": {
        file: NewPostScreen,
        back: "custom",
        header: "New Post"
    }
}

// loop over these and push them into an object of the right format for React Navigation
const preparedScreens = {}

Object.keys(screens).forEach((key) => {
    const name = key
    const { file, locked, label, icon, tabs } = screens[key]

    if(!tabs) {
        preparedScreens[name] = { screen: file, 
            navigationOptions: {
                drawerLabel: label || (() => null),
                drawerLockMode: locked ? "locked-closed" : null, // can't open drawer on this screen
                drawerIcon: icon ? (() => icon) : null
            }
        }
    } else {
        preparedScreens[name] = { screen: file }
    }
})

// create Navigator object with our data and some config
const Navigator = DrawerNavigator(
    preparedScreens,
    {
        drawerWidth: 220,
        contentComponent: Menu, // custom side menu component
        drawerOpenRoute: 'DrawerOpen', // these are mandatory properties if we're defining a custom config
        drawerCloseRoute: 'DrawerClose',
        drawerToggleRoute: 'DrawerToggle'
    }
)  

export default Navigator;


// pass in state.nav and get whether drawer is open
export const isDrawerOpen = (nav) => {
    return nav.index === 1
}


// pass in state.nav and return the label for the current screen (including tab) - handy.
export const getCurrentScreen = (nav, top) => {
    const routes = nav.routes[0]
    // get the index of the current screen at the top level
    const index = routes.index
    // if we're requesting the name of the screen at the top level (e.g. "TabsScreen"), use the index to return this
    if(top === "top") {
        return routes.routes[index].key 
    }
    // if this "screen" contains further routes/inner screens (i.e. it's a tab section)...
    if(routes.routes[index].routes) {
            // get the key of the current tab in this section
            const tabs = routes.routes[index]
            const tabIndex = tabs.index
            // use this to return the name of the current tab in this section 
            return tabs.routes[tabIndex].key
    }
    // otherwise, no nested screens so use the index at the top level collection to get the screen name here
    return routes.routes[index].key 
}
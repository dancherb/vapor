import React, { Component } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';

import { connect } from 'react-redux'
import { visitScreen, changeValue, persistValue, changePost, loadFeed, loadMore, addImage } from '../actions'

import T from '../c/T'
import Status from '../c/Status'
import Row from '../c/Row'
import Input from '../c/Input'
import Selector from '../c/Selector'

import style from '../style'
import { getCurrentScreen } from '../screens'


class Screen extends Component {
    componentDidMount() {      
        this.props.changeValue("rootScreen", false)
        if(!this.props.feed) {
            this.props.changeValue("feed", [])
            this.props.changeValue("loadingResults", true)
            this.props.loadFeed(this.props.feedType, this.props.inputSearch, this.props.searchType) 
        }
    }

    changeType(type) {
        // if moving to or from search, animate
        // note: this is why we used conditionals on each element instead of on the whole block (helps animation)
        if(type === "search" || this.props.feedType === "search") {
            // LayoutAnimation.spring()
        }
        // make search type match current feed type if clicking "search"
        if(type === "search") {
            if(this.props.feedType === "hot" || this.props.feedType === "new") {
                this.props.persistValue("searchType", this.props.feedType)
            }
        }
        // change feed values
        this.props.persistValue("feedType", type)
        // clear and search
        this.props.changeValue("feed", [])
        this.props.changeValue("loadingResults", true)
        this.props.loadFeed(type, this.props.inputSearch || "", this.props.searchType)
    }
    changeSearchType(type, tag) {
        // change feed values
        this.props.persistValue("feedType", "search") // if coming from clicking a tag
        this.props.persistValue("searchType", type)

        // clear and search
        this.props.changeValue("feed", [])
        this.props.changeValue("loadingResults", true)

        // check if passed in a tag (from clicking) - otherwise, check inputSearch (also would have been set by clicking a tag). otherwise, use blank
        this.props.loadFeed("search", tag || this.props.inputSearch || "", type)
    }
    changeSearch() {
        // new input submitted - load results
        this.props.changeValue("feed", [])
        this.props.changeValue("loadingResults", true)
        this.props.loadFeed("search", this.props.inputSearch, this.props.searchType)
    }
     render() {
        return(
            <View style={{flex: 1, justifyContent: "space-between", alignItems: "center"}}>
                
                <Row style={{width: "100%", marginBottom: 1}}>
                    {this.props.feedType !== "search" &&
                    <Selector selected={this.props.feedType === "following"} 
                    onPress={() => this.changeType("following")}>
                        Following
                    </Selector>}

                    {this.props.feedType !== "search" &&
                    <Selector selected={this.props.feedType === "hot"} 
                    onPress={() => this.changeType("hot")}>
                        Hot
                    </Selector>}

                    {this.props.feedType !== "search" &&
                    <Selector selected={this.props.feedType === "new"} 
                    onPress={() => this.changeType("new")}>
                        New
                    </Selector>}

                    {this.props.feedType !== "search" &&
                    <Selector selected={this.props.feedType === "search"} 
                    onPress={() => this.changeType("search")}>
                        Search
                    </Selector>}

                    {this.props.feedType === "search" &&
                    <Selector width={45} selected={this.props.searchType === "tag"} 
                    onPress={() => this.changeSearchType("tag")}>
                        Tag
                    </Selector>}

                    {this.props.feedType === "search" &&
                    <Selector width={45} selected={this.props.searchType === "hot"} 
                    onPress={() => this.changeSearchType("hot")}>
                        Hot
                    </Selector>}

                    {this.props.feedType === "search" &&
                    <Selector width={45} selected={this.props.searchType === "new"} 
                    onPress={() => this.changeSearchType("new")}>
                        New
                    </Selector>}

                    {this.props.feedType === "search" &&
                    <Input flex style={{height: 40}} noMargin icon="bullseye" persist label="inputSearch" placeholder="Search." onEndEditing={() => this.changeSearch()}/>}
                </Row>

                {(this.props.feed && this.props.feed.length >= 1) &&
                <FlatList
                contentContainerStyle={{alignItems: "center"}}
                style={{width: "100%", flex: 1}}
                keyExtractor={item => item.id.toString()}
                data={this.props.feed}
                refreshing={false}
                refreshControl={
                    <RefreshControl
                        refreshing={this.props.feedRefreshing}
                        onRefresh={() => {
                            this.props.changeValue("feedRefreshing", true)
                            this.props.loadFeed(this.props.feedType, this.props.inputSearch)
                        }}
                        tintColor="white"
                        colors={["white"]}
                        progressBackgroundColor={style.theme}
                        titleColor="white"
                     />
                }
                ListFooterComponent={this.props.loadingMore ? <ActivityIndicator size="large" style={{height: 60, width: 50}} color="white"/> : <View style={{height: 60}}/>}
                // onEndReachedThreshold={(this.props.feed.length - 7)/this.props.feed.length}
                onEndReached={() => {
                    if(this.props.loadingMore !== true) {
                        this.props.loadMore(this.props.feed, this.props.feedType, this.props.inputSearch)
                        this.props.changeValue("loadingMore", true)
                    }
                }}
                removeClippedSubviews
                scrollEventThrottle={16}
                renderItem={({item, index}) => 
                    <Status 
                    item={item} 
                    index={index}
                    profileImage={this.props.images[`profile-${item.author}`]}
                    feedType={this.props.feedType}
                    currentScreen={this.props.currentScreen}
                    userFollowingList={this.props.userFollowingList}
                    username={this.props.username}
                    changePost={this.props.changePost}
                    onPress={() => {
                        this.props.visitScreen("PostScreen")
                        this.props.changeValue("lastScreen", "FeedScreen")
                        this.props.changeValue("viewingPost", item)
                    }}
                    onPressProfile={() => {
                        this.props.visitScreen("ProfileScreen")
                        this.props.changeValue("lastScreen", "FeedScreen")
                        this.props.changeValue("viewingProfile", item.author)
                    }}
                    onPressCategory={() => {
                        // LayoutAnimation.spring()
                        this.props.persistValue("inputSearch", item.category)
                        this.changeSearchType("tag", item.category)
                    }}/>
                }/>}

                {(this.props.loadingResults) &&
                <ActivityIndicator size="large" style={{width: 50}} color="white"/>}

                {((!this.props.feed || this.props.feed.length < 1) && !this.props.loadingResults) &&
                <T>No results.</T>}

                <View/>

            </View>
        )
    }
}

const mapStateToProps = state => {
    return { 
        feed: state.values.feed,
        feedType: state.persist.feedType,
        inputSearch: state.persist.inputSearch,
        searchType: state.persist.searchType || "hot",
        loadingResults: state.values.loadingResults,
        loadingMore: state.values.loadingMore,
        feedRefreshing: state.values.feedRefreshing || false,

        username: state.persist.username,
        currentScreen: getCurrentScreen(state.nav),
        userFollowingList: state.values.userFollowingList,

        images: state.images,
    }
};
  
export default connect(mapStateToProps, { visitScreen, changeValue, persistValue, changePost, loadFeed, loadMore, addImage })(Screen);
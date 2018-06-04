import '../../shim.js'
import steem from 'steem'

const limit = 10
const userLimit = 10

// for every feed update, dispatch change_batch_posts:
// for the new feed items that we've loaded, take their vote count and comment count and put it in the global state
// we do this so when the user likes or comments on something, it stays consistent throughout the app without needing to reload the data

export function userLoadFeed(user) {
    console.log("loading user feed for "+user)
    return (dispatch) => {
        steem.api.getDiscussionsByBlog({limit: userLimit, tag: user}, (err, result) => {
            userDispatchFeed(err, result, dispatch)
        });
    }
}

function userDispatchFeed(err, result, dispatch) {
    // dispatch values to local reference
    dispatch({ type: "change_batch_posts", payload: result })
    
    dispatch(getProfilePictures(result))

    dispatch({ type: "change_value", payload: { label: "userFeed", value: result }})
    dispatch({ type: "change_value", payload: { label: "userFeedRefreshing", value: false }})
    dispatch({ type: "change_value", payload: { label: "userLoadingResults", value: false }})
}

export function userLoadMore(userFeed, user) {
    console.log("user loading more")
    return (dispatch) => {
        const startAuthor = userFeed[userFeed.length-1].author
        const startPermlink = userFeed[userFeed.length-1].permlink
     
        steem.api.getDiscussionsByBlog({limit: userLimit, start_author: startAuthor, start_permlink: startPermlink, tag: user}, (err, result) => {
            userAddData(err, result, userFeed, dispatch)
        });
    }
}

function userAddData(err, result, userFeed, dispatch) {
    // dispatch values to local reference
    dispatch({ type: "change_batch_posts", payload: result })
    // get any profile pictures
    dispatch(getProfilePictures(result))
    // remove first item from result (this matches last item of existing feed)
    result.shift();
    // add on result to existing feed to create newFeed
    const newFeed = userFeed.concat(result);
    console.log("new feed length", newFeed.length)
    dispatch({ type: "change_value", payload: { label: "userFeed", value: newFeed }})
    dispatch({ type: "change_value", payload: { label: "userLoadingMore", value: false }})
}


export function loadFeed(type, search, searchType) {
    return (dispatch, getState) => {
        const username = getState().persist.username || "steem"

        if(type === "new") {
            steem.api.getDiscussionsByCreated({limit: limit}, (err, result) => {
                dispatchData(err, result, dispatch)
            });
        } else if(type === "hot") {
            steem.api.getDiscussionsByHot({limit: limit}, (err, result) => {
                dispatchData(err, result, dispatch)
            });
        } else if(type === "following") {
            steem.api.getDiscussionsByFeed({limit: limit, tag: username}, (err, result) => {
                dispatchData(err, result, dispatch)
            });
        } else if(type === "search") {  
            if(searchType === "hot") {
                steem.api.getDiscussionsByHot({limit: limit, tag: search}, (err, result) => {
                    dispatchData(err, result, dispatch)
                });
            } else if(searchType === "new") {
                steem.api.getDiscussionsByCreated({limit: limit, tag: search}, (err, result) => {
                    dispatchData(err, result, dispatch)
                });
            } else {
                steem.api.getDiscussionsByTrending({limit: limit, tag: search}, (err, result) => {
                    dispatchData(err, result, dispatch)
                });
            }
        }     
    }
}

function dispatchData(err, result, dispatch) {
    // dispatch values to local reference
    dispatch({ type: "change_batch_posts", payload: result })
    // get profile pictures
    dispatch(getProfilePictures(result))

    dispatch({ type: "change_value", payload: { label: "feed", value: result }})
    dispatch({ type: "change_value", payload: { label: "feedRefreshing", value: false }})
    dispatch({ type: "change_value", payload: { label: "loadingResults", value: false }})
}

export function loadMore(feed, type, search, searchType) {
    return (dispatch, getState) => {
        const username = getState().persist.username || "steem"
        const startAuthor = feed[feed.length-1].author
        const startPermlink = feed[feed.length-1].permlink

        if(type === "new") {
            steem.api.getDiscussionsByCreated({limit: limit, start_author: startAuthor, start_permlink: startPermlink }, (err, result) => {
                addData(err, result, feed, dispatch)
            });
        } else if(type === "hot") {
            steem.api.getDiscussionsByHot({limit: limit, start_author: startAuthor, start_permlink: startPermlink }, (err, result) => {
                addData(err, result, feed, dispatch)
            });
        } else if(type === "following") {
            steem.api.getDiscussionsByFeed({limit: limit, start_author: startAuthor, start_permlink: startPermlink, tag: username}, (err, result) => {
                addData(err, result, feed, dispatch)
            });
        } else if(type === "search") {  
            if(searchType === "hot") {
                steem.api.getDiscussionsByHot({limit: limit, start_author: startAuthor, start_permlink: startPermlink, tag: search}, (err, result) => {
                    addData(err, result, feed, dispatch)
                });
            } else if(searchType === "new") {
                steem.api.getDiscussionsByCreated({limit: limit, start_author: startAuthor, start_permlink: startPermlink, tag: search}, (err, result) => {
                    addData(err, result, feed, dispatch)
                });
            } else {
                steem.api.getDiscussionsByTrending({limit: limit, start_author: startAuthor, start_permlink: startPermlink, tag: search}, (err, result) => {
                    addData(err, result, feed, dispatch)
                });
            }
        }     
    }
}

function addData(err, result, feed, dispatch) {
    // dispatch values to local reference
    dispatch({ type: "change_batch_posts", payload: result })
    // get profile pictures
    dispatch(getProfilePictures(result))
    // remove first item from result (this matches last item of existing feed)
    result.shift();
    // add on result to feed to create newFeed
    const newFeed = feed.concat(result);
    console.log("new feed length", newFeed.length)
    dispatch({ type: "change_value", payload: { label: "feed", value: newFeed }})
    dispatch({ type: "change_value", payload: { label: "loadingMore", value: false }})
}

// for every feed update, run getProfilePictures - loop through the posts, gathering which users we need to fetch profile pictures for, so each post isn't fetching duplicates etc
// certain places (e.g. profiles, comments) may still handle the fetching locally
function getProfilePictures(feed) {
    return(dispatch, getState) => {
        const images = getState().images

        const fetchList = {}

        // populate fetchList with profiles we need to fetch
        for(let i=0; i<feed.length; i++) {
            const author = feed[i].author
            const reference = images[`profile-${author}`]
            if(!reference && !fetchList[author]) {
                fetchList[author] = true
            }
        }

        // fetch them
        Object.keys(fetchList).forEach(author => {
            steem.api.getAccounts([author], (err, result) => {  
                if(result && result[0] && result[0].json_metadata) {
                    const metadata = JSON.parse(result[0].json_metadata)
                    const image = metadata.profile && metadata.profile.profile_image ? metadata.profile.profile_image 
                    : false
                     
                    dispatch({ type: "add_image", payload: { label: `profile-${author}`, value: image}})
                }
                if(err) console.log(err)
            });  
        })
    }
}

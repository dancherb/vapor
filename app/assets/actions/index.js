export const ROOTURL = 'XXX'

export const headers = (token) => {
    return { headers: {'Authorization': token} }
}

export { on, off, clear, change, visit, sortByField, sortByNewestMessage, removeArrayDuplicates } from './functions'

export { visitScreen } from './visitScreen'

export { changeValue, changeObjectValue, persistValue, changePost, addImage } from './values'

export { sendSupportMessage, reportItem } from './support'

export { loadFeed, loadMore, userLoadFeed, userLoadMore } from './feed'

export { getActivity, readNotifications, loadChat, sendMessage, sendImage, loadImages } from './activity'

export { signIn } from './signIn';

export { upvote, comment, reblog, follow, getUserFollowingList, getUserVotesList, makePost } from './connect'

export { uploadProfilePicture, updateProfile } from './profile'

export { recordActivity, sendInvite, loadSettings, saveSettings, checkVaporUser, signOut } from './manager'
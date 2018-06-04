import storage from 'redux-persist/lib/storage'
import { persistCombineReducers } from 'redux-persist'

import NavReducer from './NavReducer';
import ValueReducer from './ValueReducer';
import PersistReducer from './PersistReducer';
import ImageReducer from './ImageReducer';
import PostReducer from './PostReducer';

const persistConfig = {
  key: 'primary',
  whitelist: ['persist'],
  storage
}

export default persistCombineReducers(persistConfig, {
  nav: NavReducer,
  values: ValueReducer,
  persist: PersistReducer,
  images: ImageReducer,
  posts: PostReducer // use this to store the latest updates for the user's likes, comments etc, so we can keep it consistent across the board without reloading the feed each time
});
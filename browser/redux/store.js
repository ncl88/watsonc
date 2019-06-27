import { createStore } from 'redux';
import calypsoReducers from './reducers';

const store = createStore(calypsoReducers);

export default store;
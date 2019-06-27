import { combineReducers } from 'redux';

const initialState = {
    categories: false,
    selectedLayers: [],
    selectedChemical: false
};

const reducer = (state = initialState, action) => {

    console.log(`### state action`, state, action);

    let compoundLayerKey, selectedLayers;
    switch (action.type) {
        case 'SET_CATEGORIES':
                return Object.assign({}, state, {categories: action.payload});
        case 'SELECT_CHEMICAL':
            return Object.assign({}, state, {selectedChemical: action.payload});
        case 'SELECT_LAYER':
            compoundLayerKey = action.payload.originalLayerKey + (action.payload.additionalKey ? `#${action.payload.additionalKey}` : ``);
            selectedLayers = state.selectedLayers.slice(0);
            if (selectedLayers.indexOf(compoundLayerKey) === -1) selectedLayers.push(compoundLayerKey);

            return Object.assign({}, state, {selectedLayers});
        case 'UNSELECT_LAYER':
            compoundLayerKey = action.payload.originalLayerKey + (action.payload.additionalKey ? `#${action.payload.additionalKey}` : ``);
            selectedLayers = state.selectedLayers.slice(0);
            if (selectedLayers.indexOf(compoundLayerKey) !== -1) selectedLayers.splice(selectedLayers.indexOf(compoundLayerKey), 1);

            return Object.assign({}, state, {selectedLayers});
        default:
            return state
    }
}

export default combineReducers({global: reducer});
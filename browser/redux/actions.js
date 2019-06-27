export const selectChemical = chemical => ({
    type: 'SELECT_CHEMICAL',
    payload: chemical
});

export const selectLayer = (originalLayerKey, additionalKey) => ({
    type: 'SELECT_LAYER',
    payload: {originalLayerKey, additionalKey}
});

export const unselectLayer = (originalLayerKey, additionalKey) => ({
    type: 'UNSELECT_LAYER',
    payload: {originalLayerKey, additionalKey}
});

export const setCategories = (categories) => ({
    type: 'SET_CATEGORIES',
    payload: categories
});


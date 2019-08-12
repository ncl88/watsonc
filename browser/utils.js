/**
 * Extracts the chemical name from existing categories
 * 
 * @param {String} chemicalId Chemical identifier
 * @param {Array}  categories Existing categories
 * 
 * @returns {String}
 */
const getChemicalName = (chemicalId, categories) => {
    let chemicalName = false;
    for (let layerName in categories) {
        for (let groupName in categories[layerName]) {
            for (let key in categories[layerName][groupName]) {
                if ((key + '') === (chemicalId + '')) {
                    chemicalName = categories[layerName][groupName][key];
                }
            }
        }
    }

    if (chemicalId === `watlevmsl`) {
        chemicalName = __(`Water level`);
    }

    if (chemicalName === false) {
        console.error (`Unable to detect the chemical name for identifier ${chemicalId}`);
    }

    return chemicalName;
};

/**
 * Detects the measurement title
 * 
 * @param {Object} measurement Measurement object
 * 
 * @returns {String}
 */
const getMeasurementTitle = (measurement) => {
    let title = measurement.properties.boreholeno;
    if (`watlevmsl` in measurement.properties && measurement.properties.loctypeid && measurement.properties.loctypeid > 0) {
        let parsedData = JSON.parse(measurement.properties.watlevmsl);
        if (parsedData.boreholeno) {
            title = parsedData.boreholeno;
        }
    }

    return title;
};

module.exports = {
    getChemicalName,
    getMeasurementTitle
}
/**
 * Provides tools for generating measurements icons
 */

import {LAYER_NAMES} from './constants';

const svgCollection = require('./svgCollection');

/*
Deciding what symbol the measurement should have

1 step - decide on symbol

Grundvand: if it is "boreholes_time_series_with_chemicals" (is it the same as "Jupiter boringer"?)
- circle
Grundvand: if it is "sensordata_with_correction" (is it the same as "CALYPSO stationer"?) with loctypeid=1
- circle

Vandløb: if it is "sensordata_with_correction" (is it the same as "CALYPSO stationer"?) with loctypeid=3
- diamond

Nedbør: if it is "sensordata_with_correction" (is it the same as "CALYPSO stationer"?) with loctypeid=4
- raindrops

2 step - decide on color
By default own stations are colored in orange, others in blue
If chemical is selected and station has this chemical, then color it as chemical (green, red and yellow), otherwise gray
If waterlevel is selected and station has the waterlevel, then color it as waterlevel chemical (green, red and yellow), otherwise gray
If station is highlighted, make a black border
Add wi-fi symbol according to online status of the station

Questions:
- where is loctypeid property
- where is sensorhistorik property

*/

/**
 * Generates symbol
 * 
 * @param {*} layerName 
 * @param {*} options 
 * 
 * @returns {String}
 */
const getSymbol = (layerName, options) => {
    let highlighted = (options && `highlighted` in options ? options.highlighted : false);
    let online = (options && `online` in options ? options.online : false);

    let result = false;
    if (layerName === LAYER_NAMES[0]) {
        result = svgCollection.circle;

        // Change color to orange
        result = result.replace(`LEFT_HALF_STYLING`, `fill:#bf8c00;`);
        result = result.replace(`RIGHT_HALF_STYLING`, `fill:#bf8c00;`);
    } else if (layerName === LAYER_NAMES[2]) {
        // @todo Symbol shape depends on location type, omitting for now
        result = svgCollection.circle;

        // Change color to blue
        result = result.replace(`LEFT_HALF_STYLING`, `fill:#1380c4;`);
        result = result.replace(`RIGHT_HALF_STYLING`, `fill:#1380c4;`);
    }

    if (result) {
        result = result.replace(`WIFI_SYMBOL_STYLING`, (online ? `fill:#77cbe7;` : `fill:#bababa;`));
        result = result.replace(`STROKE_STYLING`, (highlighted ? `stroke:#000;stroke-miterlimit:10;stroke-width:20px;` : ``));
    }

    return result;
};

module.exports = {getSymbol};
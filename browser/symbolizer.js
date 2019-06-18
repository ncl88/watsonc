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

2 step - decide if the station is online
if status = 0
if status = 1
if status = 2

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

const WI_FI_NO_DATA = 0;
const WI_FI_OFFLINE = 1;
const WI_FI_ONLINE = 2;

const SHAPE_CIRCLE = 1;
const SHAPE_DIAMOND = 3;
const SHAPE_RAINDROP = 4;
const SHAPE_TRIANGLE = 5;

const ORANGE_FILL = `fill:#bf8c00;`
const BLUE_FILL = `fill:#1380c4;`

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
    let online = (options && `online` in options && parseInt(options.online) >= 0 ? parseInt(options.online) : WI_FI_NO_DATA);
    let shape = (options && `shape` in options && parseInt(options.shape) >= 0 ? parseInt(options.shape) : SHAPE_CIRCLE);
    
    let leftPartColor = false;
    let rightPartColor = false;
    if (layerName === LAYER_NAMES[0]) {
        leftPartColor = ORANGE_FILL;
        rightPartColor = ORANGE_FILL;
    } else {
        leftPartColor = BLUE_FILL;
        rightPartColor = BLUE_FILL;
    }

    if (options && `leftPartColor` in options && options.leftPartColor) {
        if (options.leftPartColor) {
            leftPartColor = `fill:${options.leftPartColor}`;
        }
    }

    if (options && `rightPartColor` in options && options.rightPartColor) {
        if (options.rightPartColor) {
            rightPartColor = `fill:${options.rightPartColor}`;
        }
    }

    // Selecting shape
    let result = false;
    switch (shape) {
        case SHAPE_CIRCLE:
            result = svgCollection.circle;
            break;
        case SHAPE_DIAMOND:
            result = svgCollection.diamond;
            break;
        case SHAPE_RAINDROP:
            result = svgCollection.raindrop;
            break;
        case SHAPE_TRIANGLE:
            result = svgCollection.triangle;
            break;
        default:
            throw new Error(`Invalid shape value ${shape}`); 
    }

    result = result.replace(`LEFT_HALF_STYLING`, leftPartColor);
    result = result.replace(`RIGHT_HALF_STYLING`, rightPartColor);

    if (result) {
        if (online === WI_FI_ONLINE || online === WI_FI_OFFLINE) {
            switch (shape) {
                case SHAPE_CIRCLE:
                    result = result.replace(`WIFI_SYMBOL_PLACEHOLDER`, svgCollection.wifiSymbolCircle);
                    break;
                case SHAPE_DIAMOND:
                    result = result.replace(`WIFI_SYMBOL_PLACEHOLDER`, svgCollection.wifiSymbolDiamond);
                    break;  
                case SHAPE_RAINDROP:
                    result = result.replace(`WIFI_SYMBOL_PLACEHOLDER`, svgCollection.wifiSymbolRaindrop);
                    break;
                case SHAPE_TRIANGLE:
                    result = result.replace(`WIFI_SYMBOL_PLACEHOLDER`, svgCollection.wifiSymbolTriangle);
                    break;
            }

            if (online === WI_FI_ONLINE) {
                result = result.replace(`WIFI_SYMBOL_STYLING`, `fill:#00587a;` );
            } else if (online === WI_FI_OFFLINE) {
                result = result.replace(`WIFI_SYMBOL_STYLING`, `fill:#bababa;`);
            }
        } else {
            result = result.replace(`WIFI_SYMBOL_PLACEHOLDER`, ``);
        }

        result = result.replace(`STROKE_STYLING`, (highlighted ? `stroke:#000;stroke-miterlimit:10;stroke-width:20px;` : ``));
    }

    return result;
};

module.exports = {getSymbol};
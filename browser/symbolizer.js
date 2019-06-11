/**
 * Provides tools for generating measurements icons
 */

const svgCollection = require('./svgCollection');

const wrapper = `<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" id="svg8" version="1.1" viewBox="0 0 40 40" height="40" width="40">CONTENT</svg>`;
const styles = {
    "v:chemicals.boreholes_time_series_with_chemicals": {
        default: `<circle cx="14" cy="14" r="10" stroke="purple" stroke-width="4" fill="purple" fill-opacity="0.4" />`,
        highlighted: `<circle cx="14" cy="14" r="10" stroke="purple" stroke-width="4" fill="red" fill-opacity="1" />`
    },
    "v:sensor.sensordata_with_correction": {
        default: `<circle cx="14" cy="14" r="10" stroke="blue" stroke-width="4" fill="blue" fill-opacity="0.4" />`,
        highlighted: `<circle cx="14" cy="14" r="10" stroke="blue" stroke-width="4" fill="red" fill-opacity="1" />`,
    }
};

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

module.exports = {styles, wrapper};
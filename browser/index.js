/**
 * @fileoverview Description of file, its uses and information
 * about its dependencies.
 */

'use strict';

import Plot from 'react-plotly.js';
import moment from 'moment';

/**
 *
 * @type {*|exports|module.exports}
 */
var cloud;

/**
 *
 * @type {*|exports|module.exports}
 */
var switchLayer;

/**
 *
 * @type {*|exports|module.exports}
 */
var backboneEvents;

/**
 *
 * @type {*|exports|module.exports}
 */
var utils;

var layerTree;

var React = require('react');

var ReactDOM = require('react-dom');

let exId = "watsonc";

let componentInstance = false;

/**
 *
 * @type {{set: module.exports.set, init: module.exports.init}}
 */
module.exports = module.exports = {
    set: function (o) {
        cloud = o.cloud;
        switchLayer = o.switchLayer;
        backboneEvents = o.backboneEvents;
        layerTree = o.layerTree;
        utils = o.utils;
        return this;
    },
    init: function () {
        utils.createMainTab(exId, __("Boreholes"), __("Info"), require('./../../../browser/modules/height')().max);

        var parent = this,
            layerNames = ["v:public.boreholes_time_series"];

        // Disable automatic creation of layer tree. We need to set "On" functions first
        layerTree.setAutomatic(false);

        layerNames.map(function (layerName) {
            layerTree.setOnEachFeature(layerName, function (feature, layer) {
                layer.on("click", function () {
                    console.log(feature.properties.boreholeno);

                    let html = "Bore hole no: " + feature.properties.boreholeno + "<br>"+
                        "Water level: " + feature.properties.watlevmsl;

                    layer.bindPopup(html, {
                        className: "custom-popup",
                        autoPan: true,
                        closeButton: true
                    }).openPopup();

                    setTimeout(function(){
                        $(".leaflet-popup-content").css("width", "200px");
                    }, 200);

                    if (componentInstance) {
                        componentInstance.setMeasurement(feature.properties);
                    } else {
                        throw new Error(`Unable to find the component instance`);
                    }
                });
            });

            layerTree.setOnSelect(layerName, function (id, layer) {

                console.log(layer.feature.properties.boreholeno);

            });

            layerTree.setStyle(layerName, {
                weight: 5,
                color: '#ff0000',
                dashArray: '',
                fillOpacity: 0.2
            });

            layerTree.setPointToLayer(layerName, (feature, latlng) => {
                return L.circleMarker(latlng);
            });
        });

        layerTree.create(false, true);





        class Borehole extends React.Component {
            constructor(props) {
                super(props);

                this.state = {
                    measurement: false
                };
            }
        
            componentDidMount() {}

            setMeasurement(measurement) {
                console.log(`### setMeasurement`, measurement);
                this.setState({ measurement });
            }

            render() {
                let measurement = (<p>### Please select the measurement ###</p>);
                if (this.state.measurement) {
                    console.log(this.state.measurement.timeofmeas);

                    let formattedDateAxisData = [];
                    
                    
                    let parsedTimeOfMeasurements = JSON.parse(this.state.measurement.timeofmeas);
                    let parsedWaterLevels = JSON.parse(this.state.measurement.watlevmsl);
                    
                    parsedTimeOfMeasurements.map(item => {
                        formattedDateAxisData.push(moment(item).format('YYYY-MM-DD HH:mm:ss'));
                    });

                    measurement = (<div>
                        <div>
                            <div>boreholeno: {this.state.measurement.boreholeno}</div>
                            <div>timeofmeas: {parsedTimeOfMeasurements.length} ### total ###</div>
                            <div>watlevmsl: {parsedWaterLevels.length} ### total ###</div>
                            <div>maksoftop: {JSON.parse(this.state.measurement.maksoftop).length} ### total ###</div>
                            <div>minofbottom: {JSON.parse(this.state.measurement.minofbottom).length} ### total ###</div>
                            <div>drilldepth: {JSON.parse(this.state.measurement.drilldepth).length}</div>
                            <div>zdvr90: {JSON.parse(this.state.measurement.zdvr90).length}</div>
                        </div>
                        <div>
                            <Plot
                                data={[{
                                    x: formattedDateAxisData,
                                    y: parsedWaterLevels,
                                    type: 'scatter',
                                    mode: 'markers',
                                    marker: {color: 'green'},
                                }]}
                                layout={{
                                    xaxis: {
                                        autorange: true,
                                        rangeselector: {buttons: [
                                            {
                                              count: 1,
                                              label: '1m',
                                              step: 'month',
                                              stepmode: 'backward'
                                            },
                                            {
                                              count: 6,
                                              label: '6m',
                                              step: 'month',
                                              stepmode: 'backward'
                                            },
                                            {step: 'all'}
                                        ]},
                                        rangeslider: {
                                            range: [
                                                moment(parsedTimeOfMeasurements[0]).format('YYYY-MM-DD'),
                                                moment(parsedTimeOfMeasurements[parsedTimeOfMeasurements.length - 1]).format('YYYY-MM-DD')    
                                            ]
                                        },
                                        type: 'date'
                                    },
                                    width: 490,
                                    height: 490,
                                    title: 'Bore hole no. ' + this.state.measurement.boreholeno
                                }}
                            />

                        </div>
                    </div>);
                }

                return (<div>{measurement}</div>);
            }
        }


        if (document.getElementById(exId)) {
            try {
                componentInstance = ReactDOM.render(<Borehole />, document.getElementById(exId));
            } catch (e) {
                console.log(e);
            }
        } else {
            console.warn(`Unable to find the container for watsonc extension (element id: ${exId})`);
        }
    }

};




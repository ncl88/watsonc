'use strict';

import BoreholePlotsComponent from './BoreholePlotsComponent';

const MODULE_NAME = `watsonc`;

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
var utils, layerTree, layers, state;

var React = require('react');

var ReactDOM = require('react-dom');
var moment = require('moment');

let exId = "watsonc";

const LAYER_NAMES = [`v:geus.boreholes_time_series_with_chemicals`];

let componentInstance = false;

let _self = false;

let dataSource = [];

/**
 *
 * @type {{set: module.exports.set, init: module.exports.init}}
 */
module.exports = module.exports = {
    set: function (o) {
        cloud = o.cloud;
        switchLayer = o.switchLayer;
        backboneEvents = o.backboneEvents;
        layers = o.layers;
        layerTree = o.layerTree;
        state = o.state;
        utils = o.utils;
        _self = this;
        return this;
    },
    init: function () {
        state.listenTo(MODULE_NAME, _self);
        state.listen(MODULE_NAME, `plotsUpdate`);

        utils.createMainTab(exId, __("Boreholes"), __("Info"), require('./../../../browser/modules/height')().max);

        const constructExistingPlotsPanel = (plots = false) => {
            backboneEvents.get().trigger(`${MODULE_NAME}:plotsUpdate`);

            let plotsRawMarkup = `<p>${__(`No plots were created yet`)}</p>`;

            let existingPlots = [];
            let plotsToProcess = ((plots) ? plots : _self.getExistingPlots());
            plotsToProcess.map(plot => {
                let removeButtons = ``;
                plot.measurements.map(measurement => {
                    let measurementDisplayTitle = measurement;
                    let splitMeasurementId = measurement.split(':');
                    let gid = parseInt(splitMeasurementId[0]);
                    if (dataSource.length > 0) {
                        dataSource.map(item => {
                            if (item.properties.gid === gid) {
                                measurementDisplayTitle = (`${item.properties.boreholeno}, ${JSON.parse(item.properties[splitMeasurementId[1]]).title} (#${ (parseInt(splitMeasurementId[2]) + 1) })`);
                                return false;
                            }
                        });
                    }

                    removeButtons = removeButtons + `<button
                        type="button"
                        class="btn btn-xs btn-primary js-delete-measurement"
                        data-plot-id="${plot.id}"
                        data-gid="${gid}"
                        data-key="${splitMeasurementId[1]}"
                        data-intake-index="${splitMeasurementId[2]}"
                        style="padding: 4px; margin: 1px;">
                        <i class="fa fa-remove"></i> ${measurementDisplayTitle}
                    </button>`;
                });

                existingPlots.push(`<div
                    class="well well-sm js-plot"
                    data-id="${plot.id}"
                    style="margin-bottom: 4px;">
                    <span>${plot.title}</span>
                    <span>${removeButtons}</span>
                </div>`);
            });

            if (existingPlots.length > 0) {
                plotsRawMarkup = existingPlots.join(``);
            }

            $(`.watsonc-custom-popup`).find(`.js-existing-plots-container`).empty();
            setTimeout(() => {
                $(`.watsonc-custom-popup`).find(`.js-existing-plots-container`).append(plotsRawMarkup);
                $(`.watsonc-custom-popup`).find(`.js-plot`).droppable({
                    drop: function (event, ui) {
                        componentInstance.addMeasurement($(this).data(`id`),
                            $(ui.draggable[0]).data(`gid`), $(ui.draggable[0]).data(`key`), $(ui.draggable[0]).data(`intake-index`));
                    }
                });

                $(`.watsonc-custom-popup`).find(`.js-delete-measurement`).click((event) => {
                    componentInstance.deleteMeasurement($(event.currentTarget).data(`plot-id`),
                        $(event.currentTarget).data(`gid`), $(event.currentTarget).data(`key`), $(event.currentTarget).data(`intake-index`));
                });
            }, 100);
        };

        backboneEvents.get().on("doneLoading:layers", e => {
            if (e === LAYER_NAMES[0]) {
                dataSource = layers.getMapLayers(false, LAYER_NAMES[0])[0].toGeoJSON().features;
                componentInstance.setDataSource(dataSource);
            }
        });

        state.getState().then(applicationState => {

            LAYER_NAMES.map(function (layerName) {
                layerTree.setOnEachFeature(layerName, function (feature, layer) {
                    layer.on("click", function (e) {
                        let plottedProperties = [];

                        // Getting all properties that are parsable JSON arrays with the length of number of time mesurements
                        for (let key in feature.properties) {
                            try {
                                let data = JSON.parse(feature.properties[key]);
                                if (typeof data === `object` && data !== null && `boreholeno` in data && `unit` in data && `title` in data && `measurements` in data && `timeOfMeasurement` in data) {
                                    let isPlottableProperty = true;
                                    if (Array.isArray(data.measurements) === false) {
                                        data.measurements = JSON.parse(data.measurements);
                                    }

                                    // Checking if number of measurements corresponds to the number of time measurements for each intake
                                    data.measurements.map((measurements, intakeIndex) => {
                                        if (data.measurements[intakeIndex].length !== data.timeOfMeasurement[intakeIndex].length) {
                                            console.warn(`${data.title} property has not corresponding number of measurements and time measurements for intake ${intakeIndex + 1}`);
                                            isPlottableProperty = false;
                                        }
                                    });

                                    if (isPlottableProperty && [`minofbottom`, `maksoftop`].indexOf(key) === -1) {
                                        for (let i = 0; i < data.measurements.length; i++) {
                                            plottedProperties.push({
                                                key,
                                                intakeIndex: i,
                                                boreholeno: data.boreholeno,
                                                title: data.title
                                            });
                                        }
                                    }
                                }
                            } catch (e) {
                            }
                        }

                        let plottedPropertiesControls = [];
                        plottedProperties.map(item => {
                            plottedPropertiesControls.push(`<span
                                class="btn btn-xs btn-primary js-plotted-property"
                                data-gid="${feature.properties.gid}"
                                data-key="${item.key}"
                                data-intake-index="${item.intakeIndex}"
                                style="padding: 4px; margin: 1px;">
                                <i class="fa fa-arrows-alt"></i> ${item.title} (#${item.intakeIndex + 1})
                            </span>`);
                        });

                        let html = `<div>
                            <div>
                                <h5>${__(`Borehole`)} no. ${feature.properties.boreholeno}</h5>
                            </div>
                            <div>${__(`Data series`)}:</div>
                            <div>${plottedPropertiesControls.join(``)}</div>
                            <div>${__(`Available plots`)}:</div>
                            <div class="js-existing-plots-container"></div>
                        </div>`;

                        let managePopup = L.popup({
                            className: `watsonc-custom-popup`,
                            autoPan: false,
                            maxHeight: 300,
                            closeButton: true
                        }).setLatLng(e.latlng).setContent(html).openOn(cloud.get().map);

                        $(`.watsonc-custom-popup`).find(`.js-plotted-property`).draggable({
                            containment: `.watsonc-custom-popup`,
                            revert: true,
                            revertDuration: 0
                        });

                        constructExistingPlotsPanel();

                        if (!componentInstance) {
                            throw new Error(`Unable to find the component instance`);
                        }
                    });

                }, "watsonc");

                layerTree.setOnSelect(layerName, function (id, layer) {
                    console.log(layer.feature.properties.boreholeno);
                });

                layerTree.setStyle(layerName, {
                    // weight: 5,
                    // color: '#ff0000',
                    // dashArray: '',
                    // fillOpacity: 0.2
                });

                layerTree.setOnLoad(layerName, function (store) {
                    setTimeout(()=>{

                    }, 5000)
                });

                // layerTree.setPointToLayer(layerName, (feature, latlng) => {
                // });
            });

            layerTree.create(false, true);

            if (document.getElementById(exId)) {
                let initialPlots = [];
                if (applicationState && `modules` in applicationState && MODULE_NAME in applicationState.modules && `plots` in applicationState.modules[MODULE_NAME]) {
                    initialPlots = applicationState.modules[MODULE_NAME].plots;
                }

                try {
                    componentInstance = ReactDOM.render(<BoreholePlotsComponent
                        initialPlots={initialPlots}
                        onPlotsChange={constructExistingPlotsPanel}/>, document.getElementById(exId));
                } catch (e) {
                    console.log(e);
                }
            } else {
                console.warn(`Unable to find the container for watsonc extension (element id: ${exId})`);
            }
        });
    },

    /**
     * Returns current module state
     */
    getState: () => {
        return {plots: _self.getExistingPlots()};
    },

    /**
     * Applies externally provided state
     */
    applyState: (newState) => {
        return new Promise((resolve, reject) => {
            if (newState && `plots` in newState && newState.plots.length > 0) {
                componentInstance.setPlots(newState.plots);
            }

            resolve();
        });
    },

    getExistingPlots: () => {
        if (componentInstance) {
            return componentInstance.getPlots();
        } else {
            throw new Error(`Unable to find the component instance`);
        }
    }
};




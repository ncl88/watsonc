/**
 * @fileoverview Description of file, its uses and information
 * about its dependencies.
 */

'use strict';

import BoreholePlotsComponent from './BoreholePlotsComponent';

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

let _self = false;

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
        _self = this;
        return this;
    },
    init: function () {
        utils.createMainTab(exId, __("Boreholes"), __("Info"), require('./../../../browser/modules/height')().max);

        var parent = this, layerNames = ["v:public.boreholes_time_series"];

        const constructExistingPlotsPanel = (plots = false) => {
            let plotsRawMarkup = `<p>${__(`No plots were created yet`)}</p>`;

            let existingPlots = [];
            let plotsToProcess = ((plots) ? plots : _self.getExistingPlots());
            plotsToProcess.map(plot => {
                let removeYAxisButtons = ``;
                plot.yAxes.map(yAxis => {
                    removeYAxisButtons = removeYAxisButtons + `<button
                        type="button"
                        class="btn btn-xs btn-primary js-delete-y-axis"
                        data-plot-id="${plot.id}"
                        data-axis="${yAxis}"
                        style="padding: 4px; margin: 1px;">
                        <i class="fa fa-remove"></i> ${yAxis}
                    </button>`;
                });

                existingPlots.push(`<div
                    class="well well-sm js-plot"
                    data-id="${plot.id}"
                    style="margin-bottom: 4px;">
                    <span>${plot.title}</span>
                    <span>${removeYAxisButtons}</span>
                </div>`);
            });

            if (existingPlots.length > 0) {
                plotsRawMarkup = existingPlots.join(``);
            }

            $(`.watsonc-custom-popup`).find(`.js-existing-plots-container`).empty();
            setTimeout(() => {
                $(`.watsonc-custom-popup`).find(`.js-existing-plots-container`).append(plotsRawMarkup);
                $(`.watsonc-custom-popup`).find(`.js-plot`).droppable({
                    drop: function(event, ui) {
                        componentInstance.addYAxis($(this).data(`id`), $(ui.draggable[0]).data(`key`));
                    }
                });

                $(`.watsonc-custom-popup`).find(`.js-delete-y-axis`).click((event) => {
                    componentInstance.deleteYAxis($(event.currentTarget).data(`plot-id`), $(event.currentTarget).data(`axis`));
                });
            }, 100);
        };

        layerNames.map(function (layerName) {
            layerTree.setOnEachFeature(layerName, function (feature, layer) {
                layer.on("click", function (e) {
                    let plottedProperties = [`drilldepth`, `maksoftop`, `minofbottom`, `watlevmsl`, `zdvr90`];

                    let plottedPropertiesControls = [];
                    for (let key in feature.properties) {
                        if (plottedProperties.indexOf(key) !== -1) {
                            plottedPropertiesControls.push(`<span
                                class="btn btn-xs btn-primary js-plotted-property"
                                data-gid="${feature.properties.gid}"
                                data-key="${key}"
                                style="padding: 4px; margin: 1px;">
                                <i class="fa fa-arrows-alt"></i> ${key}
                            </span>`);
                        }
                    }

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

        if (document.getElementById(exId)) {
            try {
                componentInstance = ReactDOM.render(<BoreholePlotsComponent
                    onPlotsChange={constructExistingPlotsPanel}/>, document.getElementById(exId));
            } catch (e) {
                console.log(e);
            }
        } else {
            console.warn(`Unable to find the container for watsonc extension (element id: ${exId})`);
        }
    },

    getExistingPlots: () => {
        if (componentInstance) {
            return componentInstance.getPlots();
        } else {
            throw new Error(`Unable to find the component instance`);
        }
    }

};




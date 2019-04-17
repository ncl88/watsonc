'use strict';

import ModalComponent from './components/ModalComponent';
import PlotsGridComponent from './components/PlotsGridComponent';
import IntroModal from './components/IntroModal';
import TitleFieldComponent from './../../../browser/modules/shared/TitleFieldComponent';

import moment from 'moment';

const MODULE_NAME = `watsonc`;

/**
 * The feature dialog constants
 */
const FEATURE_CONTAINER_ID = 'watsonc-features-dialog';
const FORM_FEATURE_CONTAINER_ID = 'watsonc-features-dialog-form';

/**
 * The plots dialog constants
 */
const PLOTS_CONTAINER_ID = 'watsonc-plots-dialog';
const FORM_PLOTS_CONTAINER_ID = 'watsonc-plots-dialog-form';

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
var utils, layerTree, layers, anchor, state, urlparser;

var React = require('react');

var ReactDOM = require('react-dom');

const LAYER_NAMES = [
    `v:chemicals.boreholes_time_series_with_chemicals`,
    `chemicals.boreholes_time_series_without_chemicals`,
    `v:sensor.sensordata_with_correction`,
    `sensor.sensordata_without_correction`,
];

const STYLES = {
    "v:chemicals.boreholes_time_series_with_chemicals": {
        default: `<circle cx="14" cy="14" r="10" stroke="purple" stroke-width="4" fill="purple" fill-opacity="0.4" />`,
        highlighted: `<circle cx="14" cy="14" r="10" stroke="purple" stroke-width="4" fill="red" fill-opacity="1" />`
    },
    "v:sensor.sensordata_with_correction": {
        default: `<circle cx="14" cy="14" r="10" stroke="blue" stroke-width="4" fill="blue" fill-opacity="0.4" />`,
        highlighted: `<circle cx="14" cy="14" r="10" stroke="blue" stroke-width="4" fill="red" fill-opacity="1" />`,
    },
    wrapper: `<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" id="svg8" version="1.1" viewBox="0 0 40 40" height="40" width="40">CONTENT</svg>`
};

let plotsGridComponentInstance = false, modalComponentInstance = false, infoModalInstance = false, titleFieldComponentInstance = false;

let lastSelectedChemical = false, categoriesOverall = false;

let _self = false;

let lastFeature = false;

let lastTitleAsLink = null;

let dataSource = [];

let boreholesDataSource = [];
let waterLevelDataSource = [];

let store;

let categories = {};
let limits = {};
let names = {};

var jquery = require('jquery');
require('snackbarjs');

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
        anchor = o.anchor;
        state = o.state;
        urlparser = o.urlparser;
        utils = o.utils;
        _self = this;
        return this;
    },
    init: function () {
        state.listenTo(MODULE_NAME, _self);
        state.listen(MODULE_NAME, `plotsUpdate`);
        state.listen(MODULE_NAME, `chemicalChange`);

        $(`#js-open-state-snapshots-panel`).click(() => {
            $(`[href="#state-snapshots-content"]`).trigger(`click`);
        });

        $(`#js-open-watsonc-panel`).click(() => {
            $(`[href="#watsonc-content"]`).trigger(`click`);
        });

        backboneEvents.get().on(`startLoading:layers`, layerKey => {
            if (cloud.get().getZoom() < 15 && layerKey === "v:chemicals.boreholes_time_series_with_chemicals") {
                switchLayer.init("v:chemicals.boreholes_time_series_with_chemicals", false, true, false);
                switchLayer.init("v:sensor.sensordata_with_correction", false, true, false);

                setTimeout(()=>{
                    let applicationWideControls = $(`*[data-gc2-id="chemicals.boreholes_time_series_with_chemicals"]`);
                    applicationWideControls.prop('checked', false);
                }, 200);
            }
        });

        cloud.get().on(`moveend`, () => {
            if (cloud.get().getZoom() < 15) {
                switchLayer.init("v:chemicals.boreholes_time_series_with_chemicals", false, true, false);
                switchLayer.init("v:sensor.sensordata_with_correction", false, true, false);

                jquery.snackbar({
                    id: "snackbar-watsonc",
                    content: "<span id='conflict-progress'>" + __("Zoom tættere på for at aktivere data-funktionerne.") + "</span>",
                    htmlAllowed: true,
                    timeout: 1000000
                });
            } else {
                /*
                if (layerTree.getActiveLayers().indexOf(LAYER_NAMES[0]) === -1) {
                    switchLayer.init("v:chemicals.boreholes_time_series_with_chemicals", true, true, false);
                    switchLayer.init("v:sensor.sensordata_with_correction", true, true, false);
                }
                */

                setTimeout(function () {
                    jquery("#snackbar-watsonc").snackbar("hide");
                }, 200);
            }
        });

        $.ajax({
            url: '/api/sql/jupiter?q=SELECT * FROM codes.compunds&base64=false',
            scriptCharset: "utf-8",
            success: function (response) {
                if (`features` in response) {
                    categories = {};
                    limits = {};

                    response.features.map(function (v) {
                        categories[v.properties.kategori.trim()] = {};
                        names[v.properties.compundno] = v.properties.navn;
                    });

                    names['watlevmsl'] = "Vandstand";

                    for (var key in categories) {
                        response.features.map(function (v) {
                            if (key === v.properties.kategori) {
                                categories[key][v.properties.compundno] = v.properties.navn;
                                limits["_" + v.properties.compundno] = [v.properties.attention || 0, v.properties.limit || 0];
                            }
                        });
                    }

                    // Breadcrumbs
                    _self.buildBreadcrumbs();

                    categoriesOverall = {};
                    categoriesOverall[LAYER_NAMES[0]] = categories;
                    categoriesOverall[LAYER_NAMES[2]] = {"Vandstand": {"0": "watlevmsl"}};
                    if (infoModalInstance) {
                        infoModalInstance.setCategories(categoriesOverall);
                    }

                    // Setup menu
                    let dd = $('li .dropdown-toggle');
                    dd.on('click', function (event) {
                        $(".dropdown-top").not($(this).parent()).removeClass('open');
                        $('.dropdown-submenu').removeClass('open');
                        $(this).parent().toggleClass('open');
                    });

                    // Open intro modal only if there is no predefined state
                    if (!urlparser.urlVars || !urlparser.urlVars.state) {
                        _self.openMenuModal();
                    }

                    backboneEvents.get().trigger(`${MODULE_NAME}:initialized`);
                } else {
                    console.error(`Unable to request codes.compunds`);
                }
            },
            error: function () {}
        });

        backboneEvents.get().on("doneLoading:layers", e => {
            if (e === LAYER_NAMES[0]) {
                dataSource = [];
                boreholesDataSource = layers.getMapLayers(false, LAYER_NAMES[0])[0].toGeoJSON().features;
                dataSource = dataSource.concat(waterLevelDataSource);
                dataSource = dataSource.concat(boreholesDataSource);
                if (plotsGridComponentInstance) {
                    plotsGridComponentInstance.setDataSource(dataSource);
                }
            } else if (e === LAYER_NAMES[2]) {
                dataSource = [];
                waterLevelDataSource = layers.getMapLayers(false, LAYER_NAMES[2])[0].toGeoJSON().features;
                dataSource = dataSource.concat(waterLevelDataSource);
                dataSource = dataSource.concat(boreholesDataSource);
                if (plotsGridComponentInstance) {
                    plotsGridComponentInstance.setDataSource(dataSource);
                }
            }
        });

        backboneEvents.get().on(`doneLoading:layers`, e => {
            if ([LAYER_NAMES[0], LAYER_NAMES[2]].indexOf(e) > -1) {
                if (plotsGridComponentInstance) {
                    let plots = plotsGridComponentInstance.getPlots();
                    plots = _self.syncPlotData(plots, e);
                    _self.setStyleForParticipatingMeasurements(plots);
                    plotsGridComponentInstance.setPlots(plots);
                }
            }
        });

        state.getState().then(applicationState => {
            LAYER_NAMES.map(layerName => {
                layerTree.setOnEachFeature(layerName, (feature, layer) => {
                    layer.on("click", function (e) {
                        $("#" + FEATURE_CONTAINER_ID).animate({
                            bottom: "0"
                        }, 500, function () {
                            $("#" + FEATURE_CONTAINER_ID).find(".expand-less").show();
                            $("#" + FEATURE_CONTAINER_ID).find(".expand-more").hide();
                        });

                        let titleAsLink = false;
                        if (layerName.indexOf(`chemicals.boreholes_time_series_with_chemicals`) > -1) {
                            titleAsLink = true;
                        }

                        _self.createModal(feature, false, titleAsLink);
                        if (!plotsGridComponentInstance) {
                            throw new Error(`Unable to find the component instance`);
                        }
                    });
                }, "watsonc");

                let svgCirclePart = false;
                if (layerName === `v:chemicals.boreholes_time_series_with_chemicals`) {
                    svgCirclePart = STYLES[layerName].default;
                } else if (layerName === `v:sensor.sensordata_with_correction`) {
                    svgCirclePart = STYLES[layerName].default;
                }

                if (svgCirclePart) {
                    let icon = L.icon({
                        iconUrl: 'data:image/svg+xml;base64,' + btoa(STYLES.wrapper.replace(`CONTENT`, svgCirclePart)),
                        iconAnchor: [14, 14],
                        watsoncStatus: `default`
                    });

                    layerTree.setPointToLayer(layerName, (feature, latlng) => {
                        return L.marker(latlng, { icon });
                    });
                }
            });

            // Renewing the already created store by rebuilding the layer tree
            layerTree.create(false).then(() => {
                let activeLayers = layerTree.getActiveLayers();
                activeLayers.map(activeLayerKey => {
                    // Reloading (applying updated store settings) layers that need it
                    if (LAYER_NAMES.indexOf(activeLayerKey) !== -1) {
                        layerTree.reloadLayer(activeLayerKey);
                    }
                });

                // Activating specific layers if they have not been activated before
                [LAYER_NAMES[1], LAYER_NAMES[3]].map(layerNameToEnable => {
                    if (activeLayers.indexOf(layerNameToEnable) === -1) {
                        switchLayer.init(layerNameToEnable, true, true, false);
                    }
                });
            });

            if (document.getElementById(FORM_PLOTS_CONTAINER_ID)) {
                let initialPlots = [];
                if (applicationState && `modules` in applicationState && MODULE_NAME in applicationState.modules && `plots` in applicationState.modules[MODULE_NAME]) {
                    initialPlots = applicationState.modules[MODULE_NAME].plots;
                }
                
                try {
                    plotsGridComponentInstance = ReactDOM.render(<PlotsGridComponent
                        initialPlots={initialPlots}
                        onPlotsChange={(plots = false) => {
                            backboneEvents.get().trigger(`${MODULE_NAME}:plotsUpdate`);

                            if (plots) {
                                _self.setStyleForParticipatingMeasurements(plots);

                                // Plots were updated from the PlotsGridComponent component
                                if (modalComponentInstance) {
                                    _self.createModal(false, plots);
                                }
                            }
                        }}/>, document.getElementById(FORM_PLOTS_CONTAINER_ID));
                } catch (e) {
                    console.log(e);
                }
                


                // ### @todo Remove when the backend will work correctly
                setTimeout(() => {
                    backboneEvents.get().trigger(`${MODULE_NAME}:initialized`);
                }, 1000);
                setTimeout(() => {
                    _self.openMenuModal();
                }, 2000);




            } else {
                console.warn(`Unable to find the container for watsonc extension (element id: ${FORM_PLOTS_CONTAINER_ID})`);
            }
        });

        // Setting up feature dialog
        $(`#` + FEATURE_CONTAINER_ID).find(".expand-less").on("click", function () {
            $("#" + FEATURE_CONTAINER_ID).animate({
                bottom: (($("#" + FEATURE_CONTAINER_ID).height() * -1) + 30) + "px"
            }, 500, function () {
                $(`#` + FEATURE_CONTAINER_ID).find(".expand-less").hide();
                $(`#` + FEATURE_CONTAINER_ID).find(".expand-more").show();
            });
        });

        $(`#` + FEATURE_CONTAINER_ID).find(".expand-more").on("click", function () {
            $("#" + FEATURE_CONTAINER_ID).animate({
                bottom: "0"
            }, 500, function () {
                $(`#` + FEATURE_CONTAINER_ID).find(".expand-less").show();
                $(`#` + FEATURE_CONTAINER_ID).find(".expand-more").hide();
            });
        });

        $(`#` + FEATURE_CONTAINER_ID).find(".close-hide").on("click", function () {
            $("#" + FEATURE_CONTAINER_ID).animate({
                bottom: "-100%"
            }, 500, function () {
                $(`#` + FEATURE_CONTAINER_ID).find(".expand-less").show();
                $(`#` + FEATURE_CONTAINER_ID).find(".expand-more").hide();
            });
        });

        // Setting up plots dialog
        let plotsId = `#` + PLOTS_CONTAINER_ID;
        let modalHeaderHeight = 70;
        $(plotsId).find(".expand-less").on("click", function () {
            $(plotsId).find(".expand-less").hide();
            $(plotsId).find(".expand-half").show();
            $(plotsId).find(".expand-more").show();

            $(plotsId).animate({
                top: ($(document).height() - modalHeaderHeight) + 'px'
            }, 500, function () {
                $(plotsId).find('.modal-body').css(`max-height`, );
            });
        });

        $(plotsId).find(".expand-half").on("click", function () {
            $(plotsId).find(".expand-less").show();
            $(plotsId).find(".expand-half").hide();
            $(plotsId).find(".expand-more").show();

            $(plotsId).animate({
                top: "60%"
            }, 500, function () {
                $(plotsId).find('.modal-body').css(`max-height`, ($(document).height() * 0.4 - modalHeaderHeight - 10) + 'px');
            });
        });

        $(plotsId).find(".expand-more").on("click", function () {
            $(plotsId).find(".expand-less").show();
            $(plotsId).find(".expand-half").show();
            $(plotsId).find(".expand-more").hide();

            $(plotsId).animate({
                top: "20%"
            }, 500, function () {
                $(plotsId).find('.modal-body').css(`max-height`, ($(document).height() * 0.8 - modalHeaderHeight - 10) + 'px');
            });
        });

        $(plotsId).attr(`style`, `
            margin-bottom: 0px;
            width: 80%;
            max-width: 80%;
            right: 10%;
            left: 10%;
            bottom: 0px;
        `);

        /*
        $(`#watsonc-plots-dialog-controls`).attr(`style`, `
            position: absolute;
            top: 0px;
            right: 0px;
            padding: 20px;
            width: 150px;
        `);
        */

        try {
            $(`#watsonc-plots-dialog-title-input`).css(`display`, `inline`);
            titleFieldComponentInstance = ReactDOM.render(<TitleFieldComponent
                saveButtonText={__(`Save`)}
                layout="dense"
                onAdd={(title) => {
                    if (plotsGridComponentInstance) {
                        plotsGridComponentInstance.handleCreatePlot(title);
                    }
                }} type="userOwned"/>, document.getElementById(`watsonc-plots-dialog-title-input`));
        } catch (e) {
            console.log(e);
        }

        $(plotsId).find(`.expand-less`).trigger(`click`);
        $(plotsId).find(`.js-modal-title-text`).text(__(`Time series`));
        $(`#search-border`).trigger(`click`);
    },

    buildBreadcrumbs(secondLevel = false, thirdLevel = false, isWaterLevel = false) {

console.log(`### buildBreadcrumbs`);

        $(`.js-layer-slide-breadcrumbs`).empty();
        if (secondLevel !== false) {
            let firstLevel = `Kemi`;
            let secondLevelMarkup = `<li class="active" style="color: rgba(255, 255, 255, 0.84);">${secondLevel}</li>`;
            if (isWaterLevel) {
                firstLevel = `Vandstand`;
                secondLevelMarkup = ``;
            }

            $(`.js-layer-slide-breadcrumbs`).append(`<ol class="breadcrumb" style="background-color: transparent; margin-bottom: 0px;">
                <li class="active" style="color: rgba(255, 255, 255, 0.84);"><i class="fa fa-database"></i> ${firstLevel}</li>
                ${secondLevelMarkup}
                <li class="active" style="color: rgba(255, 255, 255, 0.84);">
                    <span style="color: rgb(160, 244, 197); font-weight: bold;">${thirdLevel}<span> 
                    <button type="button" class="btn btn-xs btn-link js-clear-breadcrubms" title="${__(`Select another chemical`)}">
                        <i class="fa fa-remove"></i> ${__(`Select another chemical`)}
                    </button>
                </li>
            </ol>`);

            $(`.js-layer-slide-breadcrumbs`).find(`.js-clear-breadcrubms`).off();
            $(`.js-layer-slide-breadcrumbs`).find(`.js-clear-breadcrubms`).click(() => {
                $(`[name="chem"]`).prop('checked', false);
                lastSelectedChemical = false;

                // Unsetting the onLoad handler
                layerTree.setOnLoad("v:chemicals.boreholes_time_series_with_chemicals", false, "watsonc");

                // Turning off current vector layers
                console.log(`### 4`, LAYER_NAMES[0], LAYER_NAMES[2]);
                if (layerTree.getActiveLayers().indexOf(LAYER_NAMES[0]) > -1) switchLayer.init(LAYER_NAMES[0], false);
                if (layerTree.getActiveLayers().indexOf(LAYER_NAMES[2]) > -1) switchLayer.init(LAYER_NAMES[2], false);

                _self.buildBreadcrumbs();
                _self.openMenuModal();
            });
        } else {
            $(`.js-layer-slide-breadcrumbs`).append(`<button type="button" class="navbar-toggle" id="burger-btn">
                <i class="fa fa-database"></i> ${__(`Select data`)}
            </button>`);

            console.log('### click assigned');
            $(`.js-layer-slide-breadcrumbs`).find(`#burger-btn`).off();
            $(`.js-layer-slide-breadcrumbs`).find(`#burger-btn`).click(() => {
                _self.openMenuModal();
            });
        }
    },

    /**
     * Open module menu modal dialog
     * 
     * @returns {void}
     */
    openMenuModal: () => {
        const onApplyHandler = (parameters) => {
            // Disabling vector layers
            [LAYER_NAMES[0], LAYER_NAMES[2]].map(layerNameToEnable => {
                switchLayer.init(layerNameToEnable, false);
            });

            if (parameters.chemical) {
                _self.enableChemical(parameters.chemical, parameters.layers);
            } else {
                parameters.layers.map(layerName => {
                    layerTree.reloadLayer(layerName);
                });
            }
        };

        const onCloseHandler = () => {
            $('#watsonc-menu-dialog').modal('hide');
        };

        const introlModalPlaceholderId = `watsonc-intro-modal-placeholder`;
        if ($(`#${introlModalPlaceholderId}`).is(`:empty`)) {
            try {
                infoModalInstance = ReactDOM.render(<IntroModal
                    anchor={anchor}
                    state={state}
                    urlparser={urlparser}
                    backboneEvents={backboneEvents}
                    layers={[{
                        id: LAYER_NAMES[0],
                        title: __(`boreholes_time_series_with_chemicals`)
                    }, {
                        id: LAYER_NAMES[2],
                        title: __(`sensordata_with_correction`)
                    }]}
                    categories={categoriesOverall ? categoriesOverall : []}
                    onApply={onApplyHandler}
                    onClose={onCloseHandler}
                />, document.getElementById(introlModalPlaceholderId));
            } catch (e) {
                console.error(e);
            }
        }

        $('#watsonc-menu-dialog').modal({
            backdrop: `static`
        });
    },

    /**
     * Synchronizes plot data
     * 
     * @param {Array}  plots    Plots
     * @param {String} storeKey Vector store key to sync with
     * 
     * @return {Array}
     */
    syncPlotData: (plots, storeKey) => {
        if (Array.isArray(plots) && plots.length > 0) {
            let stores = layerTree.getStores();
            if (storeKey in stores && stores[storeKey].geoJSON && stores[storeKey].geoJSON.features.length > 0) {
                plots.map(plot => {
                    plot.measurements.map(measurement => {
                        let parsedMeasurement = measurement.split(`:`);
                        if (parsedMeasurement.length === 3) {
                            let measurementId = parseInt(parsedMeasurement[0]);
                            let measurementKey = parsedMeasurement[1];
                            let intakeIndex = parseInt(parsedMeasurement[2]);

                            let probablyStaleDataRaw = plot.measurementsCachedData[measurement].data.properties[measurementKey];

                            stores[storeKey].geoJSON.features.map(feature => {
                                if (feature.properties.gid === measurementId) {
                                    if (probablyStaleDataRaw.length < feature.properties[measurementKey].length) {
                                        // @todo Sync
                                    }
                                }
                            });
                        } else {
                            console.error(`Unsupported measurement notation ${measurement}`);
                        }
                    });
                });
            }
        }

        return plots;
    },

    createModal: (feature = false, plots = false, titleAsLink = null) => {
        if (!feature) {
            if (lastFeature) {
                feature = lastFeature;
            }
        }

        if (titleAsLink === null) {
            if (lastTitleAsLink !== null) {
                titleAsLink = lastTitleAsLink;
            }
        } else {
            lastTitleAsLink = titleAsLink;
        }

        if (feature) {
            lastFeature = feature;
            if (titleAsLink) {
                let link = `http://data.geus.dk/JupiterWWW/borerapport.jsp?dgunr=${encodeURIComponent(feature.properties.boreholeno)}`
                $("#" + FEATURE_CONTAINER_ID).find(`.modal-title`).html(`<a href="${link}" target="_blank" title="${feature.properties.boreholeno} @ data.geus.dk">${feature.properties.boreholeno}</a>`);
            } else {
                $("#" + FEATURE_CONTAINER_ID).find(`.modal-title`).html(`${feature.properties.boreholeno}`);
            }

            if (document.getElementById(FORM_FEATURE_CONTAINER_ID)) {
                try {
                    let existingPlots = (plots ? plots : plotsGridComponentInstance.getPlots());
                    _self.setStyleForParticipatingMeasurements(existingPlots);
                    setTimeout(() => {
                        ReactDOM.unmountComponentAtNode(document.getElementById(FORM_FEATURE_CONTAINER_ID));
                        modalComponentInstance = ReactDOM.render(<ModalComponent
                            feature={feature}
                            categories={categories}
                            dataSource={dataSource}
                            initialPlots={(existingPlots ? existingPlots : [])}
                            onAddMeasurement={(plotId, featureGid, featureKey, featureIntakeIndex) => {
                                plotsGridComponentInstance.addMeasurement(plotId, featureGid, featureKey, featureIntakeIndex);
                            }}
                            onDeleteMeasurement={(plotId, featureGid, featureKey, featureIntakeIndex) => {
                                plotsGridComponentInstance.deleteMeasurement(plotId, featureGid, featureKey, featureIntakeIndex);
                            }}
                            onPlotAdd={((newPlotTitle) => { plotsGridComponentInstance.addPlot(newPlotTitle); })}/>, document.getElementById(FORM_FEATURE_CONTAINER_ID));
                    }, 100);
                } catch (e) {
                    console.log(e);
                }
            } else {
                console.warn(`Unable to find the container for borehole component (element id: ${FORM_FEATURE_CONTAINER_ID})`);
            }
        }
    },

    /**
     * Sets style for measurements vector features that participate in any of plots
     * 
     * @param {Array} plots Current plots
     * 
     * @return {void}
     */
    setStyleForParticipatingMeasurements: (plots) => {
        // If specific chemical is activated, then do not style
        if (lastSelectedChemical === false) {
            let icons = {};

            icons[LAYER_NAMES[0]] = {
                highlighted: L.icon({
                    iconUrl: 'data:image/svg+xml;base64,' + btoa(STYLES.wrapper.replace(`CONTENT`, STYLES[LAYER_NAMES[0]].highlighted)),
                    iconAnchor: [14, 14],
                    watsoncStatus: `highlighted`
                }),
                default: L.icon({
                    iconUrl: 'data:image/svg+xml;base64,' + btoa(STYLES.wrapper.replace(`CONTENT`, STYLES[LAYER_NAMES[0]].default)),
                    iconAnchor: [14, 14],
                    watsoncStatus: `default`
                }),
            }

            icons[LAYER_NAMES[2]] = {
                highlighted: L.icon({
                    iconUrl: 'data:image/svg+xml;base64,' + btoa(STYLES.wrapper.replace(`CONTENT`, STYLES[LAYER_NAMES[2]].highlighted)),
                    iconAnchor: [14, 14],
                    watsoncStatus: `highlighted`
                }),
                default: L.icon({
                    iconUrl: 'data:image/svg+xml;base64,' + btoa(STYLES.wrapper.replace(`CONTENT`, STYLES[LAYER_NAMES[2]].default)),
                    iconAnchor: [14, 14],
                    watsoncStatus: `default`
                }),
            }

            let participatingIds = [];
            plots.map(plot => {
                plot.measurements.map(measurement => {
                    let splitMeasurement = measurement.split(`:`);
                    if (splitMeasurement.length === 3) {
                        let id = parseInt(splitMeasurement[0]);
                        if (participatingIds.indexOf(id) === -1) participatingIds.push(id);
                    }
                });
            });

            let mapLayers = layers.getMapLayers();
            mapLayers.map(layer => {
                if ([LAYER_NAMES[0], LAYER_NAMES[2]].indexOf(layer.id) > -1 && layer._layers) {
                    for (let key in layer._layers) {
                        let featureLayer = layer._layers[key];
                        if (featureLayer.feature && featureLayer.feature.properties && featureLayer.feature.properties.gid) {
                            let icon = false;
                            if (participatingIds.indexOf(featureLayer.feature.properties.gid) > -1) {
                                icon = icons[layer.id].highlighted;
                            } else {
                                icon = icons[layer.id].default;
                            }

                            if (icon && `setIcon` in featureLayer) {
                                // Do not set icon if the existing one is the same as the new one
                                let statusOfExistingIcon = (`watsoncStatus` in featureLayer.options.icon.options ? featureLayer.options.icon.options.watsoncStatus : false);
                                let statusOfNewIcon = icon.options.watsoncStatus;
                                if (statusOfExistingIcon === false) {
                                    featureLayer.setIcon(icon);
                                } else {
                                    if (statusOfExistingIcon !== statusOfNewIcon) {
                                        featureLayer.setIcon(icon);
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }
    },

    /**
     * Returns current module state
     */
    getState: () => {
        let plots = plotsGridComponentInstance.dehydratePlots(_self.getExistingPlots());
        return {
            plots,
            selectedChemical: lastSelectedChemical
        };
    },

    enableChemical(chemicalId, layersToEnable = []) {
        if (!chemicalId) throw new Error(`Chemical identifier was not provided`);

        if (categoriesOverall) {
            for (let layerName in categoriesOverall) {
                for (let key in categoriesOverall[layerName]) {
                    for (let key2 in categoriesOverall[layerName][key]) {
                        if (key2.toString() === chemicalId.toString()) {
                            if (layersToEnable.indexOf(layerName) === -1) layersToEnable.push(layerName);
                            _self.buildBreadcrumbs(key, categoriesOverall[layerName][key][key2], layerName === LAYER_NAMES[2]);
                            break;
                        }
                    }
                }
            }
        }

        lastSelectedChemical = chemicalId;
        backboneEvents.get().trigger(`${MODULE_NAME}:chemicalChange`);

        let chem = "_" + chemicalId;
        store = layerTree.getStores()["v:chemicals.boreholes_time_series_with_chemicals"];
        let fn = function (sqlStore) {
            store.layer.eachLayer(function (layer) {
                let feature = layer.feature;
                let maxColor;
                let latestColor;
                let iconSize;
                let iconAnchor;
                let maxMeasurement = 0;
                let maxMeasurementIntakes = [];
                let latestMeasurement = 0;
                let latestMeasurementIntakes = [];
                let json;
                let green = "rgb(16, 174, 140)";
                let yellow = "rgb(247, 168, 77)";
                let red = "rgb(252, 60, 60)";
                let white = "rgb(255, 255, 255)";

                try {
                    json = JSON.parse(feature.properties[chem]);
                } catch (e) {
                    return L.circleMarker(layer.getLatLng());
                }

                if (feature.properties[chem] !== null) {
                    let unit = json.unit;
                    // Find latest value
                    let intakes = json.timeOfMeasurement.length;
                    let currentValue;
                    let latestValue = moment("0001-01-01T00:00:00+00:00", "YYYY-MM-DDTHH:mm:ssZZ");
                    let latestPosition = {};

                    for (let i = 0; i < intakes; i++) {
                        let length = json.timeOfMeasurement[i].length - 1;
                        currentValue = moment(json.timeOfMeasurement[i][length], "YYYY-MM-DDTHH:mm:ssZZ");
                        if (currentValue.isAfter(latestValue)) {
                            latestValue = currentValue;
                            latestMeasurement = json.measurements[i][length];
                            latestPosition = {
                                intake: i,
                                measurement: length
                            }
                        }
                        latestMeasurementIntakes[i] = json.measurements[i][length];
                    }

                    // Find Highest value
                    intakes = json.measurements.length;
                    maxMeasurement = 0;
                    maxMeasurementIntakes = [];
                    let html = [];

                    for (let i = 0; i < intakes; i++) {
                        maxMeasurementIntakes[i] = 0;
                        let length = json.measurements[i].length;
                        for (let u = 0; u < length; u++) {
                            currentValue = json.measurements[i][u];
                            if (!(latestPosition.intake === i && latestPosition.measurement === u) && currentValue > maxMeasurement) {
                                maxMeasurement = currentValue;
                            }
                            if (currentValue > maxMeasurementIntakes[i]) {
                                maxMeasurementIntakes[i] = currentValue;
                            }
                        }
                    }

                    for (let i = 0; i < intakes; i++) {
                        html.push(`
                           <b style="color: rgb(16, 174, 140)">Intag: ${i + 1}</b><br>
                           Max: ${maxMeasurementIntakes[i]}<br>
                           Seneste: ${latestMeasurementIntakes[i]}<br>
                       `)
                    }

                    layer.bindTooltip(`<p><a target="_blank" href="https://data.geus.dk/JupiterWWW/borerapport.jsp?dgunr=${json.boreholeno}">DGU nr. ${json.boreholeno}</a></p>
                    <b style="color: rgb(16, 174, 140)">${names[chemicalId]} (${unit})</b><br>${html.join('<br>')}`);

                    if (chem === "_watlevmsl") {
                        maxColor = maxMeasurement === 0 ? white : "#00aaff";
                        latestColor = "#00aaff";
                    } else {
                        maxColor = maxMeasurement === 0 ? "#ffffff" : maxMeasurement <= limits[chem][0] ? green : maxMeasurement > limits[chem][0] && maxMeasurement <= limits[chem][1] ? yellow : red;
                        latestColor = latestMeasurement <= limits[chem][0] ? green : latestMeasurement > limits[chem][0] && latestMeasurement <= limits[chem][1] ? yellow : red;
                    }

                    iconSize = [30, 30];
                    iconAnchor = [15, 15];
                    layer.setZIndexOffset(10000);
                } else {
                    maxColor = latestColor = "#cccccc";
                    iconSize = [20, 20];
                    iconAnchor = [10, 10];
                    layer.setZIndexOffset(1);
                }

                var svg = `<svg
                   xmlns:dc="http://purl.org/dc/elements/1.1/"
                   xmlns:cc="http://creativecommons.org/ns#"
                   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                   xmlns:svg="http://www.w3.org/2000/svg"
                   xmlns="http://www.w3.org/2000/svg"
                   id="svg8"
                   version="1.1"
                   viewBox="0 0 84.688354 84.688354"
                   height="84.688354"
                   width="84.688354">
                   <defs
                       id="defs2" />
                   <g
                       transform="translate(-61.786713,-90.408127)"
                       id="layer1">
                       <path
                       style=";stroke-width:0.26458332;stroke:#000000;stroke-opacity:1;fill:${maxColor};stroke-width:0.26458332"
                       d="m 104.13089,175.09648 a 42.344177,42.344177 0 0 1 -36.671133,-21.17209 42.344177,42.344177 0 0 1 0,-42.34417 42.344177,42.344177 0 0 1 36.671133,-21.172093 l 0,42.344173 z"
                       id="path3729" />
                       <path
                       transform="scale(-1,1)"
                       style=";stroke-width:0.26458332;stroke:#000000;stroke-opacity:1;fill:${latestColor};stroke-width:0.26458332"
                       d="m -104.13089,175.09648 a 42.344177,42.344177 0 0 1 -36.67113,-21.17209 42.344177,42.344177 0 0 1 0,-42.34417 42.344177,42.344177 0 0 1 36.67113,-21.172093 l 0,42.344173 z"
                       id="path3729-3" />
                   </g>
                </svg>`;

                let iconUrl = 'data:image/svg+xml;base64,' + btoa(svg);
                let icon = L.icon({
                    iconUrl: iconUrl,
                    iconSize: iconSize,
                    iconAnchor: iconAnchor,
                    popupAnchor: iconAnchor,
                });

                layer.setIcon(icon);
            });
        };

        layerTree.setOnLoad("v:chemicals.boreholes_time_series_with_chemicals", fn, "watsonc");

        layersToEnable.map(layerName => {
            layerTree.reloadLayer(layerName);
        });
    },

    /**
     * Applies externally provided state
     */
    applyState: (newState) => {
        return new Promise((resolve, reject) => {
            let plotsWereProvided = false;
            if (newState && `plots` in newState && newState.plots.length > 0) {
                plotsWereProvided = true;
            }

            const continueWithInitialization = (populatedPlots) => {
                if (populatedPlots) {
                    plotsGridComponentInstance.setPlots(populatedPlots);
                }

                if (newState.selectedChemical) {
                    lastSelectedChemical = newState.selectedChemical;
    
                    if (plotsWereProvided) {
                        $(`[href="#watsonc-content"]`).trigger(`click`);
                    }
    
                    backboneEvents.get().once("allDoneLoading:layers", e => {
                        setTimeout(() => {
                            _self.enableChemical(newState.selectedChemical);
                            resolve();
                        }, 1000);
                    });
                } else {
                    $(`.js-clear-breadcrubms`).trigger(`click`);
                    if (plotsWereProvided) {
                        $(`[href="#watsonc-content"]`).trigger(`click`);
                    }
    
                    resolve();
                }
            }

            if (plotsWereProvided) {
                plotsGridComponentInstance.hydratePlots(newState.plots).then(continueWithInitialization).catch(error => {
                    console.error(`Error occured while hydrating plots at state application`, error);
                });
            } else {
                continueWithInitialization();
            }
        });
    },

    getExistingPlots: () => {
        if (plotsGridComponentInstance) {
            return plotsGridComponentInstance.getPlots();
        } else {
            throw new Error(`Unable to find the component instance`);
        }
    }
};




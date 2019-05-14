'use strict';

import ModalComponent from './components/ModalComponent';
import PlotsGridComponent from './components/PlotsGridComponent';
import MenuTimeSeriesComponent from './components/MenuTimeSeriesComponent';
import MenuProfilesComponent from './components/MenuProfilesComponent';
import IntroModal from './components/IntroModal';
import TitleFieldComponent from './../../../browser/modules/shared/TitleFieldComponent';
import { LAYER_NAMES, WATER_LEVEL_KEY } from './constants';

var wkt = require('terraformer-wkt-parser');

const utmZone = require('./../../../browser/modules/utmZone.js');
const evaluateMeasurement = require('./evaluateMeasurement');
const measurementIcon = require('./measurementIcon');

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
var layerTree, layers, anchor, state, urlparser;

var React = require('react');

var ReactDOM = require('react-dom');

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

let plotsGridComponentInstance = false, modalComponentInstance = false, infoModalInstance = false,
    menuTimeSeriesComponentInstance = false, menuProfilesComponentInstance = false;

let lastSelectedChemical = false, categoriesOverall = false;

let _self = false;

let lastFeature = false;

let lastTitleAsLink = null;

let dataSource = [];

let boreholesDataSource = [];
let waterLevelDataSource = [];

let lastEnabledMapState = {
    layers: [],
    chemical: false
};

let previousZoom = -1;

let bufferSlider, bufferValue;

let store;

let categories = {};
let limits = {};
let names = {};

let drawnItems = new L.FeatureGroup(), embedDrawControl = false, bufferedProfile = false;

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
        _self = this;
        return this;
    },
    init: function () {
        state.listenTo(MODULE_NAME, _self);
        state.listen(MODULE_NAME, `plotsUpdate`);
        state.listen(MODULE_NAME, `chemicalChange`);

        this.initializeSearchBar();

        var lc = L.control.locate({
            drawCircle: false
        }).addTo(cloud.get().map);

        $(`#find-me-btn`).click(() => {
            lc.stop();
            lc.start();
            setTimeout(() => {
                lc.stop();
            }, 5000);
        });

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
            if (previousZoom === -1 && cloud.get().getZoom() < 15 || previousZoom >= 15 && cloud.get().getZoom() < 15) {
                lastEnabledMapState.layers = layerTree.getActiveLayers();
            }

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
                setTimeout(function () {
                    jquery("#snackbar-watsonc").snackbar("hide");
                }, 200);

                if (lastEnabledMapState.layers.length > 0) {
                    if (lastEnabledMapState.chemical) {
                        _self.enableChemical(lastEnabledMapState.chemical, lastEnabledMapState.layers, () => {
                            lastEnabledMapState.layers = [];
                            lastEnabledMapState.chemical = false;
                        });
                    } else {
                        lastEnabledMapState.layers.map(item => {
                            if (item.indexOf(`v:`) === 0) {
                                switchLayer.init(item, true, true, false);
                            }
                        });
    
                        lastEnabledMapState.layers = [];
                    }
                }
            }

            previousZoom = cloud.get().getZoom();
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

                    names[WATER_LEVEL_KEY] = "Vandstand";

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
                    categoriesOverall[LAYER_NAMES[0]]["Vandstand"] = {"0": WATER_LEVEL_KEY};
                    categoriesOverall[LAYER_NAMES[2]] = {"Vandstand": {"0": WATER_LEVEL_KEY}};
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
                                if (menuTimeSeriesComponentInstance) {
                                    menuTimeSeriesComponentInstance.setPlots(plots);
                                }

                                // Plots were updated from the PlotsGridComponent component
                                if (modalComponentInstance) {
                                    _self.createModal(false, plots);
                                }
                            }
                        }}
                        onActivePlotsChange={(activePlots) => {
                            backboneEvents.get().trigger(`${MODULE_NAME}:plotsUpdate`);

                            if (menuTimeSeriesComponentInstance) {
                                menuTimeSeriesComponentInstance.setActivePlots(activePlots);
                            }
                        }}
                        onHighlightedPlotChange={(plotId, plots) => {
                            _self.setStyleForHighlightedPlot(plotId, plots);

                            if (menuTimeSeriesComponentInstance) {
                                menuTimeSeriesComponentInstance.setHighlightedPlot(plotId);
                            }
                        }}/>, document.getElementById(FORM_PLOTS_CONTAINER_ID));
                } catch (e) {
                    console.log(e);
                }
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

        let plotsId = `#` + PLOTS_CONTAINER_ID;

        // Setting up some items from the menu
        $('#search-ribbon').find('.js-data-sources').click(() => {
            $('#search-border').trigger("click");
            $(plotsId).find(".expand-more").trigger("click");
        });

        // Setting up plots dialog
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

        // Initializing TimeSeries management component
        $(`[data-module-id="profile-drawing"]`).click(() => {
            if ($(`#watsonc-timeseries`).children().length === 0) {
                try {
                    menuTimeSeriesComponentInstance = ReactDOM.render(<MenuTimeSeriesComponent
                        initialPlots={plotsGridComponentInstance.getPlots()}
                        initialActivePlots={plotsGridComponentInstance.getActivePlots()}
                        onPlotCreate={plotsGridComponentInstance.handleCreatePlot}
                        onPlotDelete={plotsGridComponentInstance.handleDeletePlot}
                        onPlotHighlight={plotsGridComponentInstance.handleHighlightPlot}
                        onPlotShow={plotsGridComponentInstance.handleShowPlot}
                        onPlotHide={plotsGridComponentInstance.handleHidePlot}/>, document.getElementById(`watsonc-timeseries`));
                } catch (e) {
                    console.log(e);
                }
            }
        });

        // Initializing profiles tab
        if ($(`#profile-drawing-content`).length === 0) throw new Error(`Unable to get the profile drawing tab`);
        try {
            menuProfilesComponentInstance = ReactDOM.render(<MenuProfilesComponent
                cloud={cloud}/>, document.getElementById(`profile-drawing-content`));

            backboneEvents.get().on(`reset:all reset:profile-drawing off:all` , () => {
                menuProfilesComponentInstance.stopDrawing();
            });
        } catch (e) {
            console.log(e);
        }

        $(plotsId).find(`.expand-less`).trigger(`click`);
        $(plotsId).find(`.js-modal-title-text`).text(__(`Calypso dashboard`));
        $(`#search-border`).trigger(`click`);
    },

    initializeSearchBar() {
        let searchBar = $(`#js-watsonc-search-field`);
        $(searchBar).parent().attr(`style`, `padding-top: 8px;`);
        $(searchBar).attr(`style`, `max-width: 200px; float: right;`);
        $(searchBar).append(`<div class="input-group">
            <input type="text" class="form-control" placeholder="${__(`Search`) + '...'}" style="color: white;"/>
            <span class="input-group-btn">
                <button class="btn btn-primary" type="button" style="color: white;">
                    <i class="fa fa-search"></i>
                </button>
            </span>
        </div>`);

        $(searchBar).find('input').focus(function() {
            $(this).attr(`placeholder`, __(`Enter borehole, installation, station`) + '...');
            $(searchBar).animate({"max-width": `400px`});
        });

        $(searchBar).find('input').blur(function() {
            $(this).attr(`placeholder`, __(`Search`) + '...');
            if ($(this).val() === ``) {
                $(searchBar).animate({"max-width": `200px`});
            }
        });

        $(searchBar).find('button').click(() => { alert(`Search button was clicked`); });
    },

    buildBreadcrumbs(secondLevel = false, thirdLevel = false, isWaterLevel = false) {
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
                if (layerTree.getActiveLayers().indexOf(LAYER_NAMES[0]) > -1) switchLayer.init(LAYER_NAMES[0], false);
                if (layerTree.getActiveLayers().indexOf(LAYER_NAMES[2]) > -1) switchLayer.init(LAYER_NAMES[2], false);

                _self.buildBreadcrumbs();
                _self.openMenuModal();
            });
        } else {
            $(`.js-layer-slide-breadcrumbs`).append(`<button type="button" class="navbar-toggle" id="burger-btn">
                <i class="fa fa-database"></i> ${__(`Select data`)}
            </button>`);

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

            if (cloud.get().getZoom() < 15) {
                lastEnabledMapState = parameters;
            } else {
                if (parameters.chemical) {
                    _self.enableChemical(parameters.chemical, parameters.layers);
                } else {
                    parameters.layers.map(layerName => {
                        layerTree.reloadLayer(layerName);
                    });
                }
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
                    setTimeout(() => {
                        ReactDOM.unmountComponentAtNode(document.getElementById(FORM_FEATURE_CONTAINER_ID));
                        modalComponentInstance = ReactDOM.render(<ModalComponent
                            feature={feature}
                            categories={categories}
                            dataSource={dataSource}
                            names={names}
                            limits={limits}
                            initialPlots={(existingPlots ? existingPlots : [])}
                            onAddMeasurement={(plotId, featureGid, featureKey, featureIntakeIndex) => {
                                plotsGridComponentInstance.addMeasurement(plotId, featureGid, featureKey, featureIntakeIndex);
                            }}
                            onDeleteMeasurement={(plotId, featureGid, featureKey, featureIntakeIndex) => {
                                plotsGridComponentInstance.deleteMeasurement(plotId, featureGid, featureKey, featureIntakeIndex);
                            }}
                            onPlotAdd={((newPlotTitle) => { plotsGridComponentInstance.addPlot(newPlotTitle, true); })}/>, document.getElementById(FORM_FEATURE_CONTAINER_ID));
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
     * Sets style for highlighted plot
     * 
     * @param {Number} plotId Plot identifier
     * @param {Array}  plots  Existing plots
     * 
     * @return {void}
     */
    setStyleForHighlightedPlot: (plotId, plots) => {
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
                if (plot.id === plotId) {
                    plot.measurements.map(measurement => {
                        let splitMeasurement = measurement.split(`:`);
                        if (splitMeasurement.length === 3) {
                            let id = parseInt(splitMeasurement[0]);
                            if (participatingIds.indexOf(id) === -1) participatingIds.push(id);
                        }
                    });
                }
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

    enableChemical(chemicalId, layersToEnable = [], onComplete = false) {
        if (!chemicalId) throw new Error(`Chemical identifier was not provided`);
        if (categoriesOverall) {
            for (let layerName in categoriesOverall) {
                for (let key in categoriesOverall[layerName]) {
                    for (let key2 in categoriesOverall[layerName][key]) {
                        if (key2.toString() === chemicalId.toString() || categoriesOverall[layerName][key][key2] === chemicalId.toString()) {
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
        let fn = function (store) {
            if (layersToEnable.indexOf(store.id) > -1) {
                let stores = layerTree.getStores();
                stores[store.id].layer.eachLayer(function (layer) {
                    let feature = layer.feature;

                    let maxColor;
                    let latestColor;
                    let iconSize;
                    let iconAnchor;

                    let featureData = false;
                    if (chem in feature.properties) {
                        featureData = feature.properties[chem];
                    } else if (chemicalId in feature.properties) {
                        featureData = feature.properties[chemicalId];
                    }

                    let json;
                    try {
                        json = JSON.parse(featureData);
                    } catch (e) {
                        return L.circleMarker(layer.getLatLng());
                    }

                    if (featureData !== null) {
                        let measurementData = evaluateMeasurement(json, limits, chem);
                        maxColor = measurementData.maxColor;
                        latestColor = measurementData.latestColor;

                        let html = [];
                        for (let i = 0; i < measurementData.numberOfIntakes; i++) {
                            html.push(`
                            <b style="color: rgb(16, 174, 140)">Intag: ${i + 1}</b><br>
                            Max: ${measurementData.maxMeasurementIntakes[i]}<br>
                            Seneste: ${measurementData.latestMeasurementIntakes[i]}<br>
                        `)
                        }

                        layer.bindTooltip(`<p><a target="_blank" href="https://data.geus.dk/JupiterWWW/borerapport.jsp?dgunr=${json.boreholeno}">DGU nr. ${json.boreholeno}</a></p>
                        <b style="color: rgb(16, 174, 140)">${names[chemicalId]} (${json.unit})</b><br>${html.join('<br>')}`);

                        iconSize = [30, 30];
                        iconAnchor = [15, 15];
                        layer.setZIndexOffset(10000);
                    } else {
                        maxColor = latestColor = "#cccccc";
                        iconSize = [20, 20];
                        iconAnchor = [10, 10];
                        layer.setZIndexOffset(1);
                    }

                    let icon = L.icon({
                        iconUrl: measurementIcon.generate(maxColor, latestColor),
                        iconSize: iconSize,
                        iconAnchor: iconAnchor,
                        popupAnchor: iconAnchor,
                    });

                    layer.setIcon(icon);
                });
            }
        };

        layerTree.setOnLoad(LAYER_NAMES[0], fn, "watsonc");
        layerTree.setOnLoad(LAYER_NAMES[2], fn, "watsonc");

        layersToEnable.map(layerName => {
            layerTree.reloadLayer(layerName);
        });

        if (onComplete) onComplete();
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




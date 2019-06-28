'use strict';

import { Provider } from 'react-redux';

import ModalComponent from './components/ModalComponent';
import DashboardComponent from './components/DashboardComponent';
import MenuTimeSeriesComponent from './components/MenuTimeSeriesComponent';
import MenuDataSourceAndTypeSelectorComponent from './components/MenuDataSourceAndTypeSelectorComponent';
import MenuProfilesComponent from './components/MenuProfilesComponent';
import IntroModal from './components/IntroModal';
import { LAYER_NAMES, WATER_LEVEL_KEY } from './constants';

import reduxStore from './redux/store';

const symbolizer = require('./symbolizer');

const evaluateMeasurement = require('./evaluateMeasurement');

const MODULE_NAME = `watsonc`;

/**
 * The feature dialog constants
 */
const FEATURE_CONTAINER_ID = 'watsonc-features-dialog';
const FORM_FEATURE_CONTAINER_ID = 'watsonc-features-dialog-form';

/**
 * The plots dialog constants
 */
const DASHBOARD_CONTAINER_ID = 'watsonc-plots-dialog-form';
let PLOTS_ID = `#` + DASHBOARD_CONTAINER_ID;

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

let dashboardComponentInstance = false, modalComponentInstance = false, infoModalInstance = false,
    menuTimeSeriesComponentInstance = false, menuDataSourceAndTypeSelectorComponentInstance = false, menuProfilesComponentInstance = false;

let lastSelectedChemical = false, categoriesOverall = false, enabledLoctypeIds = [];

let _self = false;

let lastFeatures = false;

let lastTitleAsLink = null;

let dataSource = [];

let boreholesDataSource = [];
let waterLevelDataSource = [];

let lastEnabledMapState = {
    layers: [],
    chemical: false
};

let previousZoom = -1;

let store;

let categories = {};
let limits = {};
let names = {};

var jquery = require('jquery');
require('snackbarjs');

const DATA_SOURCES = [{
    originalLayerKey: LAYER_NAMES[0],
    additionalKey: ``,
    title: __(`Jupiter drilling`)
}, {
    originalLayerKey: LAYER_NAMES[2],
    additionalKey: `1`,
    title: __(`CALYPSO stations`)
}, {
    originalLayerKey: LAYER_NAMES[2],
    additionalKey: `3`,
    title: __(`CALYPSO stations`)
}, {
    originalLayerKey: LAYER_NAMES[2],
    additionalKey: `4`,
    title: __(`CALYPSO stations`)
}];

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
        state.listen(MODULE_NAME, `enabledLoctypeIdsChange`);

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

                    _self.buildBreadcrumbs();

                    categoriesOverall = {};
                    categoriesOverall[LAYER_NAMES[0]] = categories;
                    categoriesOverall[LAYER_NAMES[0]]["Vandstand"] = {"0": WATER_LEVEL_KEY};
                    categoriesOverall[LAYER_NAMES[2]] = {"Vandstand": {"0": WATER_LEVEL_KEY}};

                    if (infoModalInstance) infoModalInstance.setCategories(categoriesOverall);

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
                if (dashboardComponentInstance) dashboardComponentInstance.setDataSource(dataSource);
            } else if (e === LAYER_NAMES[2]) {
                dataSource = [];
                waterLevelDataSource = layers.getMapLayers(false, LAYER_NAMES[2])[0].toGeoJSON().features;
                dataSource = dataSource.concat(waterLevelDataSource);
                dataSource = dataSource.concat(boreholesDataSource);
                if (dashboardComponentInstance) dashboardComponentInstance.setDataSource(dataSource);
            }
        });

        backboneEvents.get().on(`doneLoading:layers`, e => {
            if ([LAYER_NAMES[0], LAYER_NAMES[2]].indexOf(e) > -1) {
                if (dashboardComponentInstance) {
                    let plots = dashboardComponentInstance.getPlots();
                    plots = _self.syncPlotData(plots, e);
                    dashboardComponentInstance.setPlots(plots);
                }
            }
        });

        state.getState().then(applicationState => {
            $(PLOTS_ID).attr(`style`, `
                margin-bottom: 0px;
                width: 80%;
                max-width: 80%;
                right: 10%;
                left: 10%;
                bottom: 0px;`);

            LAYER_NAMES.map(layerName => {
                layerTree.setOnEachFeature(layerName, (clickedFeature, layer) => {
                    layer.on("click", function (e) {
                        $("#" + FEATURE_CONTAINER_ID).animate({
                            bottom: "0"
                        }, 500, function () {
                            $("#" + FEATURE_CONTAINER_ID).find(".expand-less").show();
                            $("#" + FEATURE_CONTAINER_ID).find(".expand-more").hide();
                        });

                        var clickBounds = L.latLngBounds(e.latlng, e.latlng), intersectingFeatures = [],

                        res = [156543.033928, 78271.516964, 39135.758482, 19567.879241, 9783.9396205,
                            4891.96981025, 2445.98490513, 1222.99245256, 611.496226281, 305.748113141, 152.87405657,
                            76.4370282852, 38.2185141426, 19.1092570713, 9.55462853565, 4.77731426782, 2.38865713391,
                            1.19432856696, 0.597164283478, 0.298582141739, 0.149291, 0.074645535];

                        let distance = 10 * res[cloud.get().getZoom()];

                        let mapObj = cloud.get().map;
                        for (var l in mapObj._layers) {
                            var overlay = mapObj._layers[l];
                            if (overlay._layers) {
                                for (var f in overlay._layers) {
                                    var feature = overlay._layers[f];
                                    var bounds;
                                    if (feature.getBounds) {
                                        bounds = feature.getBounds();
                                    } else if (feature._latlng) {
                                        let circle = new L.circle(feature._latlng, {radius: distance});
                                        // DIRTY HACK
                                        circle.addTo(mapObj);
                                        bounds = circle.getBounds();
                                        circle.removeFrom(mapObj);
                                    }

                                    if (bounds && clickBounds.intersects(bounds) && overlay.id) {
                                        intersectingFeatures.push(feature.feature);
                                    }
                                }
                            }
                        }

                        let titleAsLink = false;
                        if (layerName.indexOf(`chemicals.boreholes_time_series_with_chemicals`) > -1) {
                            titleAsLink = true;
                        }

                        let clickedFeatureAlreadyDetected = false;
                        intersectingFeatures.map(feature => {
                            if (feature.properties.boreholeno === clickedFeature.properties.boreholeno) {
                                clickedFeatureAlreadyDetected = true;
                            }
                        });

                        if (clickedFeatureAlreadyDetected === false) intersectingFeatures.unshift(clickedFeature);
                        _self.createModal(intersectingFeatures, false, titleAsLink);
                        if (!dashboardComponentInstance) {
                            throw new Error(`Unable to find the component instance`);
                        }
                    });
                }, "watsonc");

                let svgCirclePart = symbolizer.getSymbol(layerName);
                if (svgCirclePart) {
                    layerTree.setPointToLayer(layerName, (feature, latlng) => {
                        let renderIcon = true;
                        if (layerName === LAYER_NAMES[2]) {
                            if (feature.properties.loctypeid &&
                                (enabledLoctypeIds.indexOf(parseInt(feature.properties.loctypeid) + '') === -1 && enabledLoctypeIds.indexOf(parseInt(feature.properties.loctypeid)) === -1)) {
                                renderIcon = false;
                            }
                        }

                        if (renderIcon) {
                            let localSvgCirclePart = symbolizer.getSymbol(layerName, {
                                online: feature.properties.status,
                                shape: feature.properties.loctypeid,
                            });

                            let icon = L.icon({
                                iconUrl: 'data:image/svg+xml;base64,' + btoa(localSvgCirclePart),
                                iconAnchor: [8, 33],
                                watsoncStatus: `default`
                            });

                            return L.marker(latlng, { icon });
                        } else {
                            return null;
                        }
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

            if (document.getElementById(DASHBOARD_CONTAINER_ID)) {
                let initialPlots = [];
                if (applicationState && `modules` in applicationState && MODULE_NAME in applicationState.modules && `plots` in applicationState.modules[MODULE_NAME]) {
                    initialPlots = applicationState.modules[MODULE_NAME].plots;
                }

                let initialProfiles = [];
                if (applicationState && `modules` in applicationState && MODULE_NAME in applicationState.modules && `profiles` in applicationState.modules[MODULE_NAME]) {
                    initialProfiles = applicationState.modules[MODULE_NAME].profiles;
                }

                try {
                    dashboardComponentInstance = ReactDOM.render(<DashboardComponent
                        initialPlots={initialPlots}
                        initialProfiles={initialProfiles}
                        onPlotsChange={(plots = false) => {
                            backboneEvents.get().trigger(`${MODULE_NAME}:plotsUpdate`);
                            if (plots) {
                                if (menuTimeSeriesComponentInstance) menuTimeSeriesComponentInstance.setPlots(plots);
                                // Plots were updated from the DashboardComponent component
                                if (modalComponentInstance) _self.createModal(false, plots);
                            }
                        }}
                        onProfilesChange={(profiles = false) => {
                            backboneEvents.get().trigger(`${MODULE_NAME}:plotsUpdate`);
                            if (profiles && menuProfilesComponentInstance) menuProfilesComponentInstance.setProfiles(profiles);
                        }}
                        onActivePlotsChange={(activePlots) => {
                            backboneEvents.get().trigger(`${MODULE_NAME}:plotsUpdate`);
                            if (menuTimeSeriesComponentInstance) menuTimeSeriesComponentInstance.setActivePlots(activePlots);
                        }}
                        onActiveProfilesChange={(activeProfiles) => {
                            backboneEvents.get().trigger(`${MODULE_NAME}:plotsUpdate`);
                            if (menuProfilesComponentInstance) menuProfilesComponentInstance.setActiveProfiles(activeProfiles);
                        }}
                        onHighlightedPlotChange={(plotId, plots) => {
                            _self.setStyleForHighlightedPlot(plotId, plots);
                            if (menuTimeSeriesComponentInstance) menuTimeSeriesComponentInstance.setHighlightedPlot(plotId);
                        }}/>, document.getElementById(DASHBOARD_CONTAINER_ID));
                } catch (e) {
                    console.log(e);
                }
            } else {
                console.warn(`Unable to find the container for watsonc extension (element id: ${DASHBOARD_CONTAINER_ID})`);
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

        // Initializing data source and types selector
        if ($(`#data-source-and-types-selector-content`).children().length === 0) {
            try {
                ReactDOM.render(<Provider store={reduxStore}>
                    <MenuDataSourceAndTypeSelectorComponent
                        onApply={_self.onApplyLayersAndChemical}
                        ref={inst => { menuDataSourceAndTypeSelectorComponentInstance = inst; }}
                        layers={DATA_SOURCES} />
                </Provider>, document.getElementById(`data-source-and-types-selector-content`));
            } catch (e) {
                console.log(e);
            }
        }

        // Initializing TimeSeries management component
        $(`[data-module-id="timeseries"]`).click(() => {
            if ($(`#watsonc-timeseries`).children().length === 0) {
                try {
                    menuTimeSeriesComponentInstance = ReactDOM.render(<MenuTimeSeriesComponent
                        initialPlots={dashboardComponentInstance.getPlots()}
                        initialActivePlots={dashboardComponentInstance.getActivePlots()}
                        onPlotCreate={dashboardComponentInstance.handleCreatePlot}
                        onPlotDelete={dashboardComponentInstance.handleDeletePlot}
                        onPlotHighlight={dashboardComponentInstance.handleHighlightPlot}
                        onPlotShow={dashboardComponentInstance.handleShowPlot}
                        onPlotHide={dashboardComponentInstance.handleHidePlot}/>, document.getElementById(`watsonc-timeseries`));
                } catch (e) {
                    console.log(e);
                }
            }
        });

        // Initializing profiles tab
        if ($(`#profile-drawing-content`).length === 0) throw new Error(`Unable to get the profile drawing tab`);

        // Initializing TimeSeries management component
        $(`[data-module-id="profile-drawing"]`).click(() => {
            try {
                ReactDOM.render(<Provider store={reduxStore}>
                    <MenuProfilesComponent
                        ref={inst => {
                            menuProfilesComponentInstance = inst;

                            backboneEvents.get().on(`reset:all reset:profile-drawing off:all` , () => {
                                menuProfilesComponentInstance.stopDrawing();
                            });
                        }}
                    cloud={cloud}
                    initialProfiles={dashboardComponentInstance.getProfiles()}
                    initialActiveProfiles={dashboardComponentInstance.getActiveProfiles()}
                    onProfileCreate={dashboardComponentInstance.handleCreateProfile}
                    onProfileDelete={dashboardComponentInstance.handleDeleteProfile}
                    onProfileHighlight={dashboardComponentInstance.handleHighlightProfile}
                    onProfileShow={dashboardComponentInstance.handleShowProfile}
                    onProfileHide={dashboardComponentInstance.handleHideProfile}/>
                </Provider>, document.getElementById(`profile-drawing-content`));
            } catch (e) {
                console.log(e);
            }
        });

        if (dashboardComponentInstance) dashboardComponentInstance.onSetMin();
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
        $(`.js-layer-slide-breadcrumbs`).attr('style', 'height: 60px; padding-top: 10px;');
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
                </li>
            </ol>`);
        }
    },

    onApplyLayersAndChemical: (parameters) => {
        // Disabling vector layers
        [LAYER_NAMES[0], LAYER_NAMES[2]].map(layerNameToEnable => {
            switchLayer.init(layerNameToEnable, false);
        });

        if (cloud.get().getZoom() < 15) {
            lastEnabledMapState = parameters;
        } else {
            let filteredLayers = [];
            enabledLoctypeIds = [];
            parameters.layers.map(layerName => {
                if (layerName.indexOf(`#`) > -1) {
                    if (filteredLayers.indexOf(layerName.split(`#`)[0]) === -1) filteredLayers.push(layerName.split(`#`)[0]);
                    enabledLoctypeIds.push(layerName.split(`#`)[1]);
                } else {
                    if (filteredLayers.indexOf(layerName) === -1) filteredLayers.push(layerName);
                }
            });

            backboneEvents.get().trigger(`${MODULE_NAME}:enabledLoctypeIdsChange`);
            if (parameters.chemical) {
                _self.enableChemical(parameters.chemical, filteredLayers);
            } else {
                lastSelectedChemical = parameters.chemical;
                filteredLayers.map(layerName => {
                    layerTree.reloadLayer(layerName);
                });
            }
        }
    },

    /**
     * Open module menu modal dialog
     * 
     * @returns {void}
     */
    openMenuModal: () => {
        const onCloseHandler = () => {
            $('#watsonc-menu-dialog').modal('hide');
        };

        const introlModalPlaceholderId = `watsonc-intro-modal-placeholder`;
        if ($(`#${introlModalPlaceholderId}`).is(`:empty`)) {
            try {
                ReactDOM.render(<Provider store={reduxStore}>
                    <IntroModal
                        ref={inst => {
                            infoModalInstance = inst;
                        }}
                        anchor={anchor}
                        state={state}
                        urlparser={urlparser}
                        backboneEvents={backboneEvents}
                        layers={DATA_SOURCES}
                        categories={categoriesOverall ? categoriesOverall : []}
                        onApply={_self.onApplyLayersAndChemical}
                        onClose={onCloseHandler}
                    /></Provider>, document.getElementById(introlModalPlaceholderId));
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

    createModal: (features, plots = false, titleAsLink = null) => {
        if (features === false) {
            if (lastFeatures) {
                features = lastFeatures;
            }
        }

        if (titleAsLink === null) {
            if (lastTitleAsLink !== null) {
                titleAsLink = lastTitleAsLink;
            }
        } else {
            lastTitleAsLink = titleAsLink;
        }

        if (features !== false) {
            lastFeatures = features;

            let titles = [];
            features.map(item => {
                if (titleAsLink) {
                    let link = `http://data.geus.dk/JupiterWWW/borerapport.jsp?dgunr=${encodeURIComponent(item.properties.boreholeno)}`;
                    titles.push(`<a href="${link}" target="_blank" title="${item.properties.boreholeno} @ data.geus.dk">${item.properties.boreholeno}</a>`);
                } else {
                    titles.push(`${item.properties.boreholeno}`);
                }
            });

            if (titles.length === 1) {
                $("#" + FEATURE_CONTAINER_ID).find(`.modal-title`).html(titles[0]);
            } else {
                $("#" + FEATURE_CONTAINER_ID).find(`.modal-title`).html(`${__(`Boreholes`)} (${titles.join(`, `)})`);
            }

            if (document.getElementById(FORM_FEATURE_CONTAINER_ID)) {
                try {
                    let existingPlots = (plots ? plots : dashboardComponentInstance.getPlots());
                    
                    setTimeout(() => {
                        ReactDOM.unmountComponentAtNode(document.getElementById(FORM_FEATURE_CONTAINER_ID));
                        modalComponentInstance = ReactDOM.render(<ModalComponent
                            features={features}
                            categories={categories}
                            dataSource={dataSource}
                            names={names}
                            limits={limits}
                            initialPlots={(existingPlots ? existingPlots : [])}
                            onAddMeasurement={(plotId, featureGid, featureKey, featureIntakeIndex) => {
                                dashboardComponentInstance.addMeasurement(plotId, featureGid, featureKey, featureIntakeIndex);
                            }}
                            onDeleteMeasurement={(plotId, featureGid, featureKey, featureIntakeIndex) => {
                                dashboardComponentInstance.deleteMeasurement(plotId, featureGid, featureKey, featureIntakeIndex);
                            }}
                            onPlotAdd={((newPlotTitle) => { dashboardComponentInstance.addPlot(newPlotTitle, true); })}/>, document.getElementById(FORM_FEATURE_CONTAINER_ID));
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
                                icon = L.icon({
                                    iconUrl: 'data:image/svg+xml;base64,' + btoa(getSymbol(layer.id, {
                                        online: featureLayer.feature.properties.status,
                                        shape: featureLayer.feature.properties.loctypeid,
                                        highlighted: true
                                    })),
                                    iconAnchor: [8, 33],
                                    watsoncStatus: `highlighted`
                                });
                            } else {
                                icon = L.icon({
                                    iconUrl: 'data:image/svg+xml;base64,' + btoa(getSymbol(layer.id, {
                                        online: featureLayer.feature.properties.status,
                                        shape: featureLayer.feature.properties.loctypeid,
                                        highlighted: false
                                    })),
                                    iconAnchor: [8, 33],
                                    watsoncStatus: `default`
                                });
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

    enableChemical(chemicalId, layersToEnable = [], onComplete = false) {
        if (!chemicalId) throw new Error(`Chemical identifier was not provided`);

        let layersToEnableWereProvided = (layersToEnable.length > 0);
        if (categoriesOverall) {
            for (let layerName in categoriesOverall) {
                for (let key in categoriesOverall[layerName]) {
                    for (let key2 in categoriesOverall[layerName][key]) {
                        if (key2.toString() === chemicalId.toString() || categoriesOverall[layerName][key][key2] === chemicalId.toString()) {
                            if (layersToEnableWereProvided === false) {
                                if (layersToEnable.indexOf(layerName) === -1) layersToEnable.push(layerName);
                            }

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
                    let zIndexOffset;

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

                    if (featureData !== null && json) {
                        let measurementData = evaluateMeasurement(json, limits, chem);
                        maxColor = measurementData.maxColor;
                        latestColor = measurementData.latestColor;

                        let html = [];
                        for (let i = 0; i < measurementData.numberOfIntakes; i++) {
                            html.push(`<b style="color: rgb(16, 174, 140)">Intag: ${i + 1}</b><br>
                            Max: ${measurementData.maxMeasurementIntakes[i]}<br>
                            Seneste: ${measurementData.latestMeasurementIntakes[i]}<br>`);
                        }

                        layer.bindTooltip(`<p><a target="_blank" href="https://data.geus.dk/JupiterWWW/borerapport.jsp?dgunr=${json.boreholeno}">DGU nr. ${json.boreholeno}</a></p>
                        <b style="color: rgb(16, 174, 140)">${names[chemicalId]} (${json.unit})</b><br>${html.join('<br>')}`);

                        zIndexOffset = 10000;
                    } else {
                        maxColor = latestColor = "#cccccc";
                        zIndexOffset = 1;
                    }

                    let localSvg = symbolizer.getSymbol(stores[store.id].layer.id, {
                        online: feature.properties.status,
                        shape: feature.properties.loctypeid,
                        leftPartColor: maxColor,
                        rightPartColor: latestColor
                    });

                    let icon = L.icon({
                        iconUrl: 'data:image/svg+xml;base64,' + btoa(localSvg),
                        iconAnchor: [8, 33],
                        popupAnchor: [15, 15],
                        watsoncStatus: `default`
                    });

                    layer.setIcon(icon);
                    layer.setZIndexOffset(zIndexOffset);
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

    getExistingPlots: () => {
        if (dashboardComponentInstance) {
            return dashboardComponentInstance.getPlots();
        } else {
            throw new Error(`Unable to find the component instance`);
        }
    },

    /**
     * Returns current module state
     */
    getState: () => {
        let plots = dashboardComponentInstance.dehydratePlots(_self.getExistingPlots());
        return {
            plots,
            selectedChemical: lastSelectedChemical,
            enabledLoctypeIds
        };
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
                    dashboardComponentInstance.setPlots(populatedPlots);
                }

                if (newState.enabledLoctypeIds && Array.isArray(newState.enabledLoctypeIds)) {
                    enabledLoctypeIds = newState.enabledLoctypeIds;
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
                dashboardComponentInstance.hydratePlots(newState.plots).then(continueWithInitialization).catch(error => {
                    console.error(`Error occured while hydrating plots at state application`, error);
                });
            } else {
                continueWithInitialization();
            }
        });
    }
};

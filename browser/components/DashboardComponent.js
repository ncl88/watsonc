import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import reduxStore from './../redux/store';

import ReactTooltip from 'react-tooltip';
import {SELECT_CHEMICAL_DIALOG_PREFIX, TEXT_FIELD_DIALOG_PREFIX, VIEW_MATRIX, VIEW_ROW} from './../constants';
import PlotManager from './../PlotManager';
import ProfileManager from './../ProfileManager';
import TextFieldModal from './TextFieldModal';
import SortablePlotComponent from './SortablePlotComponent';
import SortableProfileComponent from './SortableProfileComponent';
import SortablePlotsGridComponent from './SortablePlotsGridComponent';
import { isNumber } from 'util';
import arrayMove from 'array-move';

const uuidv1 = require('uuid/v1');

const DASHBOARD_ITEM_PLOT = 0;
const DASHBOARD_ITEM_PROFILE = 1;

const DISPLAY_MIN = 0;
const DISPLAY_HALF = 1;
const DISPLAY_MAX = 2;
let currentDisplay = DISPLAY_HALF, previousDisplay = DISPLAY_MAX;

let modalHeaderHeight = 70;

let _self = false, resizeTimeout = false;

/**
 * Component creates plots management form and is the source of truth for plots overall
 */
class DashboardComponent extends React.Component {
    constructor(props) {
        super(props);

        let dashboardItems = [];
        if (this.props.initialPlots) {
            this.props.initialPlots.map(item => {
                dashboardItems.push({
                    type: DASHBOARD_ITEM_PLOT,
                    item
                });
            });
        }

        this.state = {
            view: VIEW_MATRIX,
            newPlotName: ``,
            dashboardItems,
            plots: this.props.initialPlots,
            profiles: [],
            activePlots: [],
            activeProfiles: [],
            dataSource: [],
            highlightedPlot: false,
            createdProfileChemical: false,
            createdProfileName: false,
            lastUpdate: false
        };

        this.plotManager = new PlotManager();
        this.profileManager = new ProfileManager();

        this.handleShowPlot = this.handleShowPlot.bind(this);
        this.handleHidePlot = this.handleHidePlot.bind(this);
        this.handleCreatePlot = this.handleCreatePlot.bind(this);
        this.handleDeletePlot = this.handleDeletePlot.bind(this);
        this.handleHighlightPlot = this.handleHighlightPlot.bind(this);

        this.handleShowProfile = this.handleShowProfile.bind(this);
        this.handleHideProfile = this.handleHideProfile.bind(this);
        this.handleCreateProfile = this.handleCreateProfile.bind(this);
        this.handleDeleteProfile = this.handleDeleteProfile.bind(this);
        this.handleProfileClick = this.handleProfileClick.bind(this);
        this.handleChangeDatatypeProfile = this.handleChangeDatatypeProfile.bind(this);

        this.getFeatureByGidFromDataSource = this.getFeatureByGidFromDataSource.bind(this);
        this.handleNewPlotNameChange = this.handleNewPlotNameChange.bind(this);
        this.handlePlotSort = this.handlePlotSort.bind(this);

        _self = this;
    }

    componentWillMount() {
        $(window).resize(function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                _self.setState({lastUpdate: new Date()});
            }, 500);
        });

        this.profileManager.getAll().then(profiles => {
            let dashboardItemsCopy = JSON.parse(JSON.stringify(this.state.dashboardItems));
            profiles.map(item => {
                dashboardItemsCopy.push({
                    type: DASHBOARD_ITEM_PROFILE,
                    item
                });
            });

            this.setState({
                profiles,
                dashboardItems: dashboardItemsCopy
            });
        });
    }

    componentDidMount() {
        this.nextDisplayType();
    }

    dehydratePlots(plots) { return this.plotManager.dehydratePlots(plots); }
    hydratePlots(plots) { return this.plotManager.hydratePlots(plots); }

    getProfiles() {
        return JSON.parse(JSON.stringify(this.state.profiles));
    }

    getActiveProfiles() {
        return JSON.parse(JSON.stringify(this.state.activeProfiles));
    }

    handleCreateProfile(data, activateOnCreate = true, callback = false) {
        this.profileManager.create(data).then(newProfile => {
            let profilesCopy = JSON.parse(JSON.stringify(this.state.profiles));
            profilesCopy.unshift(newProfile);

            if (activateOnCreate) {
                let activeProfilesCopy = JSON.parse(JSON.stringify(this.state.activeProfiles));
                if (activeProfilesCopy.indexOf(newProfile.key) === -1) activeProfilesCopy.push(newProfile.key);

                let dashboardItemsCopy = JSON.parse(JSON.stringify(this.state.dashboardItems));
                dashboardItemsCopy.push({
                    type: DASHBOARD_ITEM_PROFILE,
                    item: newProfile
                });

                this.setState({
                    profiles: profilesCopy,
                    dashboardItems: dashboardItemsCopy,
                    activeProfiles: activeProfilesCopy
                });

                this.props.onActiveProfilesChange(activeProfilesCopy);                
            } else {
                this.setState({profiles: profilesCopy});
            }

            if (callback) callback();

            this.props.onProfilesChange(profilesCopy);
        }).catch(error => {
            console.error(`Error occured while creating profile (${error})`)
        });
    }

    handleChangeDatatypeProfile(profileKey) {
        let selectedProfile = false;
        this.state.profiles.map(item => {
            if (item.key === profileKey) {
                selectedProfile = item;
            }
        });

        if (selectedProfile === false) throw new Error(`Unable to find the profile with key ${profileKey}`);

        this.setState({createdProfileChemical: false}, () => {
            const abortDataTypeChange = () => {
                this.setState({createdProfileChemical: false});
                $('#' + SELECT_CHEMICAL_DIALOG_PREFIX).modal('hide');
            }

            const uniqueKey = uuidv1();

            try {
                ReactDOM.render(<div key={`tmp_key_chemical_${uniqueKey}`}>
                    <Provider store={reduxStore}>
                        <ChemicalSelectorModal
                            useLocalSelectedChemical={true}
                            localSelectedChemical={this.state.selectedChemical}
                            onClickControl={(selectorValue) => {
                                this.setState({createdProfileChemical: selectorValue}, () => {
                                    try {
                                        ReactDOM.render(<div key={`tmp_key_text_${uniqueKey}`}>
                                            <TextFieldModal
                                                title={__(`Enter the name of created profile`)}
                                                onClickControl={(title) => {
                                                    jquery.snackbar({
                                                        id: "snackbar-watsonc",
                                                        content: "<span id='conflict-progress'>" + __("The profile with the new datatype is being created") + "</span>",
                                                        htmlAllowed: true,
                                                        timeout: 1000000
                                                    });

                                                    this.handleCreateProfile({
                                                        title,
                                                        profile: selectedProfile.value.profile,
                                                        buffer: selectedProfile.value.buffer,
                                                        depth: selectedProfile.value.depth,
                                                        compound: this.state.createdProfileChemical,
                                                        boreholeNames: selectedProfile.value.boreholeNames,
                                                        layers: selectedProfile.value.layers,
                                                    }, true, () => {
                                                        this.setState({createdProfileChemical: false}, () => {
                                                            jquery("#snackbar-watsonc").snackbar("hide");
                                                        });
                                                    });
                                                }}
                                                onCancelControl={abortDataTypeChange}/>
                                        </div>, document.getElementById(`${TEXT_FIELD_DIALOG_PREFIX}-placeholder`));
                                    } catch (e) {
                                        console.error(e);
                                    }

                                    $('#' + TEXT_FIELD_DIALOG_PREFIX).modal({backdrop: `static`});
                                });

                                $('#' + SELECT_CHEMICAL_DIALOG_PREFIX).modal('hide');
                            }}
                            onCancelControl={abortDataTypeChange}/>
                    </Provider>
                </div>, document.getElementById(`${SELECT_CHEMICAL_DIALOG_PREFIX}-placeholder`));
            } catch (e) {
                console.error(e);
            }

            $('#' + SELECT_CHEMICAL_DIALOG_PREFIX).modal({backdrop: `static`});
        });
    }

    handleProfileClick(e) {
        if (e && e.points && e.points.length === 1 && e.points[0].data && e.points[0].data.text) {
            if (e.points[0].data.text.indexOf(`Boring DGU`) > -1) {
                let boreholeNumber = false;
                let lines = e.points[0].data.text.split(`<br>`);
                lines.map(item => {
                    if (item.indexOf(`Boring DGU`) > -1) {
                        boreholeNumber = item.replace(`Boring DGU`, ``).trim();
                    }
                });

                if (boreholeNumber !== false) {
                    this.props.onOpenBorehole(boreholeNumber);
                }
            }
        }
    }

    handleDeleteProfile(profileKey, callback = false) {
        this.profileManager.delete(profileKey).then(() => {
            let profilesCopy = JSON.parse(JSON.stringify(this.state.profiles));

            let profileWasDeleted = false;
            profilesCopy.map((profile, index) => {
                if (profile.key === profileKey) {
                    profilesCopy.splice(index, 1);
                    profileWasDeleted = true;
                    return false;
                }
            });

            if (profileWasDeleted === false) {
                console.warn(`Profile ${profileKey} was deleted only from backend storage`);
            }
   
            let dashboardItemsCopy = JSON.parse(JSON.stringify(this.state.dashboardItems));
            dashboardItemsCopy.map((item, index) => {
                if (item.type === DASHBOARD_ITEM_PROFILE) {
                    if (item.key === profileKey) {
                        dashboardItemsCopy.splice(index, 1);
                        return false;
                    }
                }
            });

            let activeProfilesCopy = JSON.parse(JSON.stringify(this.state.activeProfiles));
            activeProfilesCopy.map((profile, index) => {
                if (profile === profileKey) {
                    activeProfilesCopy.splice(index, 1);
                    return false;
                }
            });

            if (callback) callback();

            this.setState({
                profiles: profilesCopy,
                activeProfiles: activeProfilesCopy,
                dashboardItems: dashboardItemsCopy
            });

            this.props.onProfilesChange(profilesCopy);
        }).catch(error => {
            console.error(`Error occured while deleting profile (${error})`)
        });
    }

    handleShowProfile(profileId) {
        if (!profileId) throw new Error(`Empty profile identifier`);

        let activeProfiles = JSON.parse(JSON.stringify(this.state.activeProfiles));
        if (activeProfiles.indexOf(profileId) === -1) activeProfiles.push(profileId);
        this.setState({activeProfiles}, () => {
            this.props.onActiveProfilesChange(this.state.activeProfiles);
        });
    }

    handleHideProfile(profileId) {
        if (!profileId) throw new Error(`Empty profile identifier`);

        let activeProfiles = JSON.parse(JSON.stringify(this.state.activeProfiles));
        if (activeProfiles.indexOf(profileId) > -1) activeProfiles.splice(activeProfiles.indexOf(profileId), 1);
        this.setState({activeProfiles}, () => {
            this.props.onActiveProfilesChange(this.state.activeProfiles);
        });
    }

    getPlots() {
        return JSON.parse(JSON.stringify(this.state.plots));
    }

    getActivePlots() {
        return JSON.parse(JSON.stringify(this.state.activePlots));
    }

    addPlot(newPlotName, activateOnCreate = false) {
        this.handleCreatePlot(newPlotName, activateOnCreate);
    }

    setPlots(plots) {
        let dashboardItemsCopy = [];
        this.state.dashboardItems.map(item => {
            if (item.type !== DASHBOARD_ITEM_PLOT) {
                dashboardItemsCopy.push(item);
            }
        });

        plots.map(item => {
            dashboardItemsCopy.push({
                type: DASHBOARD_ITEM_PLOT,
                item
            });
        });

        this.setState({ plots, dashboardItems: dashboardItemsCopy});
    }

    handleCreatePlot(title, activateOnCreate = false) {
        this.plotManager.create(title).then(newPlot => {
            let plotsCopy = JSON.parse(JSON.stringify(this.state.plots));
            plotsCopy.unshift(newPlot);

            let dashboardItemsCopy = JSON.parse(JSON.stringify(this.state.dashboardItems));
            dashboardItemsCopy.push({
                type: DASHBOARD_ITEM_PLOT,
                item: newPlot
            });

            if (activateOnCreate) {
                let activePlotsCopy = JSON.parse(JSON.stringify(this.state.activePlots));                
                if (activePlotsCopy.indexOf(newPlot.id) === -1) activePlotsCopy.push(newPlot.id);

                this.setState({
                    plots: plotsCopy,
                    dashboardItems: dashboardItemsCopy,
                    activePlots: activePlotsCopy
                });

                this.props.onActivePlotsChange(activePlotsCopy);                
            } else {
                this.setState({
                    plots: plotsCopy,
                    dashboardItems: dashboardItemsCopy
                });
            }

            this.props.onPlotsChange(plotsCopy);
        }).catch(error => {
            console.error(`Error occured while creating plot (${error})`)
        });
    }

    handleDeletePlot(id, name) {
        if (!id) throw new Error(`Empty plot identifier`);

        if (confirm(__(`Delete plot`) + ` ${name ? name : id}?`)) {
            this.plotManager.delete(id).then(() => {
                let plotsCopy = JSON.parse(JSON.stringify(this.state.plots));
                let plotWasDeleted = false;
                plotsCopy.map((plot, index) => {
                    if (plot.id === id) {
                        plotsCopy.splice(index, 1);
                        plotWasDeleted = true;
                        return false;
                    }
                });

                let dashboardItemsCopy = JSON.parse(JSON.stringify(this.state.dashboardItems));
                dashboardItemsCopy.map((item, index) => {
                    if (item.type === DASHBOARD_ITEM_PLOT) {
                        if (item.item.id === id) {
                            dashboardItemsCopy.splice(index, 1);
                            return false;
                        }
                    }
                });

                if (plotWasDeleted === false) {
                    console.warn(`Plot ${id} was deleted only from backend storage`);
                }
        
                this.setState({
                    plots: plotsCopy,
                    dashboardItems: dashboardItemsCopy
                });
                this.props.onPlotsChange(plotsCopy);
            }).catch(error => {
                console.error(`Error occured while creating plot (${error})`)
            });
        }
    }

    handleHighlightPlot(plotId) {
        if (!plotId) throw new Error(`Empty plot identifier`);

        this.setState({highlightedPlot: (plotId === this.state.highlightedPlot ? false : plotId)}, () => {
            this.props.onHighlightedPlotChange(this.state.highlightedPlot, this.state.plots);
        });
    }

    handleShowPlot(plotId) {
        if (!plotId) throw new Error(`Empty plot identifier`);

        let activePlots = JSON.parse(JSON.stringify(this.state.activePlots));
        if (activePlots.indexOf(plotId) === -1) activePlots.push(plotId);
        this.setState({activePlots}, () => {
            this.props.onActivePlotsChange(this.state.activePlots);
        });
    }

    handleHidePlot(plotId) {
        if (!plotId) throw new Error(`Empty plot identifier`);

        let activePlots = JSON.parse(JSON.stringify(this.state.activePlots));
        if (activePlots.indexOf(plotId) > -1) activePlots.splice(activePlots.indexOf(plotId), 1);
        this.setState({activePlots}, () => {
            this.props.onActivePlotsChange(this.state.activePlots);
        });
    }

    handleNewPlotNameChange(event) {
        this.setState({ newPlotName: event.target.value});
    }

    _modifyAxes(plotId, gid, measurementKey, measurementIntakeIndex, action) {
        if (!plotId) throw new Error(`Invalid plot identifier`);
        if ((!gid && gid !== 0) || !measurementKey || (!measurementIntakeIndex && measurementIntakeIndex !== 0)) throw new Error(`Invalid measurement location parameters`);

        let plots = JSON.parse(JSON.stringify(this.state.plots));
        let correspondingPlot = false;
        let correspondingPlotIndex = false;
        plots.map((plot, index) => {
            if (plot.id === plotId) {
                correspondingPlot = plot;
                correspondingPlotIndex = index;
            }
        });

        if (correspondingPlot === false) throw new Error(`Plot with id ${plotId} does not exist`);
        let measurementIndex = gid + ':' + measurementKey + ':' + measurementIntakeIndex;
        if (action === `add`) {
            if (correspondingPlot.measurements.indexOf(measurementIndex) === -1) {
                let measurementData = this.getFeatureByGidFromDataSource(gid);
                if (measurementData) {
                    var currentTime = new Date();
                    correspondingPlot.measurements.push(measurementIndex);
                    correspondingPlot.measurementsCachedData[measurementIndex] = {
                        data: measurementData,
                        created_at: currentTime.toISOString() 
                    }
                } else {
                    throw new Error(`Unable to find data for measurement index ${measurementIndex}`);
                }
            }
        } else if (action === `delete`) {
            if (correspondingPlot.measurements.indexOf(measurementIndex) === -1) {
                throw new Error(`Unable to find measurement ${measurementIndex} for ${plotId} plot`);
            } else {
                if (measurementIndex in correspondingPlot.measurementsCachedData) {
                    correspondingPlot.measurements.splice(correspondingPlot.measurements.indexOf(measurementIndex), 1);
                    delete correspondingPlot.measurementsCachedData[measurementIndex];
                } else {
                    throw new Error(`Data integrity violation: plot ${plotId} does not contain cached data for measurement ${measurementIndex}`);
                }
            }
        } else {
            throw new Error(`Unrecognized action ${action}`);
        }

        plots[correspondingPlotIndex] = correspondingPlot;

        let dashboardItemsCopy = JSON.parse(JSON.stringify(this.state.dashboardItems));
        dashboardItemsCopy.map((item, index) => {
            if (item.type === DASHBOARD_ITEM_PLOT) {
                if (item.item.id === correspondingPlot.id) {
                    dashboardItemsCopy[index].item = correspondingPlot;
                    return false;
                }
            }
        });

        this.plotManager.update(correspondingPlot).then(() => {
            this.setState({
                plots,
                dashboardItems: dashboardItemsCopy
            });

            this.props.onPlotsChange(plots);
        }).catch(error => {
            console.error(`Error occured while updating plot (${error})`)
        });
    }

    setDataSource(dataSource) {
        let plots = JSON.parse(JSON.stringify(this.state.plots));
        let updatePlotsPromises = [];
        plots.map((plot, index) => {
            let plotWasUpdatedAtLeastOnce = false;
            plot.measurements.map(measurementIndex => {
                let splitMeasurementIndex = measurementIndex.split(`:`);
                if (splitMeasurementIndex.length !== 3) throw new Error(`Invalid measurement index`);

                let measurementData = false;
                dataSource.map(item => {
                    if (item.properties.gid === parseInt(splitMeasurementIndex[0])) {
                        measurementData = item;
                        return false;
                    }
                });

                if (measurementData) {
                    var currentTime = new Date();
                    plots[index].measurementsCachedData[measurementIndex] = {
                        data: measurementData,
                        created_at: currentTime.toISOString() 
                    }

                    plotWasUpdatedAtLeastOnce = true;
                }
            });

            if (plotWasUpdatedAtLeastOnce) {
                updatePlotsPromises.push(this.plotManager.update(plots[index]));
            }
        });

        Promise.all(updatePlotsPromises).then(() => {
            let dashboardItemsCopy = JSON.parse(JSON.stringify(this.state.dashboardItems));
            dashboardItemsCopy.map((item, index) => {
                if (item.type === DASHBOARD_ITEM_PLOT) {
                    plots.map(updatedPlot => {
                        if (item.item.id === updatedPlot.id) {
                            dashboardItemsCopy[index].item = updatedPlot;
                            return false;
                        }
                    });
                }
            });

            this.setState({ dataSource, plots, dashboardItems: dashboardItemsCopy });
        }).catch(errors => {
            console.error(`Unable to update measurement data upon updating the data source`, errors);
        });
    }

    getFeatureByGidFromDataSource(gid, check = true) {
        if (check && isNumber(gid) === false) {
            throw new Error(`Invalid gid ${gid} was provided`);
        }

        let featureWasFound = false;
        this.state.dataSource.map(item => {
            if (item.properties.gid === gid) {
                featureWasFound = item;
                return false;
            }
        });

        return featureWasFound;
    }

    addMeasurement(plotId, gid, measurementKey, measurementIntakeIndex) {
        this._modifyAxes(plotId, gid, measurementKey, measurementIntakeIndex, `add`);
    }

    deleteMeasurement(plotId, gid, measurementKey, measurementIntakeIndex) {
        this._modifyAxes(plotId, gid, measurementKey, measurementIntakeIndex, `delete`);
    }

    handlePlotSort({oldIndex, newIndex}) {
        this.setState(({dashboardItems}) => ({
            dashboardItems: arrayMove(dashboardItems, oldIndex, newIndex)
        }));
    };

    onSetMin() {
        $(PLOTS_ID).animate({
            top: ($(document).height() - modalHeaderHeight) + 'px'
        }, 500, function () {
            $(PLOTS_ID).find('.modal-body').css(`max-height`, modalHeaderHeight + 'px');
        });

        $('.js-expand-less').hide();
        $('.js-expand-half').show();
        $('.js-expand-more').show();
        $(PLOTS_ID + ' .modal-body').css(`visibility`, `hidden`);
    }

    onSetHalf() {
        $(PLOTS_ID).animate({
            top: "50%"
        }, 500, function () {
            $(PLOTS_ID).find('.modal-body').css(`max-height`, ($(document).height() * 0.5 - modalHeaderHeight - 20) + 'px');
        });

        $('.js-expand-less').show();
        $('.js-expand-half').hide();
        $('.js-expand-more').show();
        $(PLOTS_ID + ' .modal-body').css(`visibility`, `visible`);
    }

    onSetMax() {
        $(PLOTS_ID).animate({
            top: "10%"
        }, 500, function () {
            $(PLOTS_ID).find('.modal-body').css(`max-height`, ($(document).height() * 0.9 - modalHeaderHeight - 10) + 'px');
        });

        $('.js-expand-less').show();
        $('.js-expand-half').show();
        $('.js-expand-more').hide();
        $(PLOTS_ID + ' .modal-body').css(`visibility`, `visible`);
    }

    nextDisplayType() {
        if (currentDisplay === DISPLAY_MIN) {
            this.onSetHalf();
            currentDisplay = DISPLAY_HALF;
            previousDisplay = DISPLAY_MIN;
        } else if (currentDisplay === DISPLAY_HALF) {
            if (previousDisplay === DISPLAY_MIN) {
                this.onSetMax();
                currentDisplay = DISPLAY_MAX;
            } else {
                this.onSetMin();
                currentDisplay = DISPLAY_MIN;
            }

            previousDisplay = DISPLAY_HALF;
        } else if (currentDisplay === DISPLAY_MAX) {
            this.onSetHalf();
            currentDisplay = DISPLAY_HALF;
            previousDisplay = DISPLAY_MAX;
        }
    }

    render() {
        let plotsControls = (<p style={{textAlign: `center`, paddingTop: `20px`}}>{__(`No timeseries were created or set as active yet`)}</p>);

        // Actualize elements location
        if (currentDisplay === DISPLAY_MIN) {
            this.onSetMin();
        } else if (currentDisplay === DISPLAY_HALF) {
            this.onSetHalf();
        } else if (currentDisplay === DISPLAY_MAX) {
            this.onSetMax();
        }

        let listItemHeightPx = Math.round(($(document).height() * 0.9 - modalHeaderHeight - 10) / 2);

        let localPlotsControls = [];
        this.state.dashboardItems.map((item, index) => {
            if (item.type === DASHBOARD_ITEM_PLOT) {
                let plot = item.item;
                if (this.state.activePlots.indexOf(plot.id) > -1) {
                    localPlotsControls.push(<SortablePlotComponent
                        key={`sortable_${index}`}
                        viewMode={this.state.view}
                        height={listItemHeightPx}
                        index={index}
                        handleDelete={this.handleDeletePlot}
                        meta={plot}/>);
                }
            } else if (item.type === DASHBOARD_ITEM_PROFILE) {
                let profile = item.item;
                if (this.state.activeProfiles.indexOf(profile.key) > -1) {
                    localPlotsControls.push(<SortableProfileComponent
                        key={`sortable_${index}`}
                        viewMode={this.state.view}
                        height={listItemHeightPx}
                        index={index}
                        handleChangeDatatype={this.handleChangeDatatypeProfile}
                        handleDelete={this.handleDeleteProfile}
                        handleClick={this.handleProfileClick}
                        meta={profile}/>);
                }
            } else {
                throw new Error(`Unrecognized dashboard item type ${item.type}`);
            }
        });

        if (localPlotsControls.length > 0) {
            plotsControls = (<SortablePlotsGridComponent axis="xy" onSortEnd={this.handlePlotSort} useDragHandle>{localPlotsControls}</SortablePlotsGridComponent>);
        }

        const setNoExpanded = () => {
            currentDisplay = DISPLAY_HALF;
            previousDisplay = DISPLAY_MAX;
            this.nextDisplayType();
        };

        const setHalfExpanded = () => {
            currentDisplay = DISPLAY_MIN;
            previousDisplay = DISPLAY_HALF;
            this.nextDisplayType();
        };

        const setFullExpanded = () => {
            currentDisplay = DISPLAY_HALF;
            previousDisplay = DISPLAY_MIN;
            this.nextDisplayType();
        };

        return (<div>
            <div className="modal-header" id="watsonc-plots-dialog-controls">
                <ReactTooltip/>
                <div className="modal-header-content">
                    <div style={{height: `40px`, display: `flex`}}>
                        <div style={{paddingRight: `20px`}}>
                            <div>
                                <button
                                    type="button"
                                    className="close js-expand-more expand-more"
                                    aria-hidden="true"
                                    onClick={setFullExpanded}
                                    style={{opacity: `1`}}
                                    title={__(`Expand dashboard`)}>
                                    <i className="material-icons" style={{fontWeight: `900`}}>expand_less</i>
                                </button>
                                <button
                                    type="button"
                                    className="close js-expand-half expand-half"
                                    aria-hidden="true"
                                    onClick={setHalfExpanded}
                                    style={{opacity: `1`}}
                                    title={__(`Open dashboard halfway`)}>
                                    <i className="material-icons" style={{fontWeight: `900`}}>swap_vert</i>
                                </button>
                                <button
                                    type="button"
                                    className="close js-expand-less expand-less"
                                    aria-hidden="true"
                                    onClick={setNoExpanded}
                                    style={{opacity: `1`}}
                                    title={__(`Minimize dashboard`)}>
                                    <i className="material-icons" style={{fontWeight: `900`}}>expand_more</i>
                                </button>
                            </div>
                        </div>
                        <div
                            style={{cursor: `pointer`}}
                            data-delay-show="500"
                            data-tip={__(`Click on the modal header to expand or minify the Dashboard`)}
                            onClick={this.nextDisplayType.bind(this)} >
                            {__(`Calypso dashboard`)}
                        </div>
                        <div
                            style={{paddingLeft: `10px`, cursor: `pointer`}}
                            data-delay-show="500"
                            data-tip={__(`Click on the modal header to expand or minify the Dashboard`)}
                            onClick={this.nextDisplayType.bind(this)}>
                            <p className="text-muted" style={{margin: `0px`}}>
                                ({__(`Timeseries total`).toLowerCase()}: {this.state.plots.length}, {__(`timeseries active`)}: {this.state.activePlots.length}; {__(`Profiles total`).toLowerCase()}: {this.state.profiles.length}, {__(`profiles active`)}: {this.state.activeProfiles.length})
                            </p>
                        </div>
                        <div style={{
                            flexGrow: `1`,
                            textAlign: `right`
                        }}>
                            <div className="btn-group btn-group-raised" role="group" style={{margin: `0px`}}>
                                <button
                                    type="button"
                                    disabled={this.state.view === VIEW_MATRIX}
                                    onClick={() => { this.setState({view: VIEW_MATRIX}); }}
                                    className="btn btn-sm btn-primary btn-default">{__(`Matrix view`)}</button>
                                <button
                                    type="button"
                                    disabled={this.state.view === VIEW_ROW}
                                    onClick={() => { this.setState({view: VIEW_ROW}); }}
                                    className="btn btn-sm btn-primary btn-default">{__(`Row view`)}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-body" style={{padding: `0px 20px 0px 0px`, margin: `0px`}}>
                <div className="form-group" style={{marginBottom: `0px`, paddingBottom: `0px`}}>{plotsControls}</div>
            </div>
        </div>);
    }
}

DashboardComponent.propTypes = {
    initialPlots: PropTypes.array.isRequired,
    onOpenBorehole: PropTypes.func.isRequired,
    onPlotsChange: PropTypes.func.isRequired,
    onActivePlotsChange: PropTypes.func.isRequired,
    onHighlightedPlotChange: PropTypes.func.isRequired,
};

export default DashboardComponent;
import React from 'react';
import PropTypes from 'prop-types';

import PlotManager from './../PlotManager';
import ProfileManager from './../ProfileManager';
import SortablePlotComponent from './SortablePlotComponent';
import SortableProfileComponent from './SortableProfileComponent';
import SortablePlotsGridComponent from './SortablePlotsGridComponent';
import { isNumber } from 'util';
import arrayMove from 'array-move';

const VIEW_MATRIX = 0;
const VIEW_ROW = 1;

const DASHBOARD_ITEM_PLOT = 0;
const DASHBOARD_ITEM_PROFILE = 1;

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
            highlightedPlot: false
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

        this.getFeatureByGidFromDataSource = this.getFeatureByGidFromDataSource.bind(this);
        this.handleNewPlotNameChange = this.handleNewPlotNameChange.bind(this);
        this.handlePlotSort = this.handlePlotSort.bind(this);
    }

    componentWillMount() {
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

                this.setState({
                    profiles: profilesCopy,
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
   
            if (callback) callback();

            this.setState({profiles: profilesCopy});
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

    render() {
        let plotsControls = (<p style={{textAlign: `center`}}>{__(`No timeseries were created or set as active yet`)}</p>);
        let containerClass = `list-group-item col-sm-12 col-md-12 col-lg-6`;
        if (this.state.view === VIEW_ROW) {
            containerClass = `list-group-item col-sm-12 col-md-12 col-lg-12`;
        }

        let localPlotsControls = [];

        this.state.dashboardItems.map((item, index) => {
            if (item.type === DASHBOARD_ITEM_PLOT) {
                let plot = item.item;
                if (this.state.activePlots.indexOf(plot.id) > -1) {
                    localPlotsControls.push(<SortablePlotComponent
                        key={`sortable_${index}`}
                        containerClass={containerClass}
                        index={index}
                        handleDelete={this.handleDeletePlot}
                        meta={plot}/>);
                }
            } else if (item.type === DASHBOARD_ITEM_PROFILE) {
                let profile = item.item;
                if (this.state.activeProfiles.indexOf(profile.key) > -1) {
                    localPlotsControls.push(<SortableProfileComponent
                        key={`sortable_${index}`}
                        containerClass={containerClass}
                        index={index}
                        handleDelete={this.handleDeleteProfile}
                        meta={profile}/>);
                }
            } else {
                throw new Error(`Unrecognized dashboard item type ${item.type}`);
            }
        });

        if (localPlotsControls.length > 0) {
            plotsControls = (<SortablePlotsGridComponent axis="xy" onSortEnd={this.handlePlotSort} useDragHandle>{localPlotsControls}</SortablePlotsGridComponent>);
        }

        return (<div>
            <div style={{height: `40px`}}>
                <div style={{float: `left`}}>
                    <p className="text-muted" style={{margin: `0px`}}>
                        {__(`Timeseries total`)}: {this.state.plots.length}, {__(`timeseries active`)}: {this.state.activePlots.length}; {__(`Profiles total`)}: {this.state.profiles.length}, {__(`profiles active`)}: {this.state.activeProfiles.length}
                    </p>
                </div>
                <div style={{float: `right`}}>
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
            <div>{plotsControls}</div>
        </div>);
    }
}

DashboardComponent.propTypes = {
    initialPlots: PropTypes.array.isRequired,
    onPlotsChange: PropTypes.func.isRequired,
    onActivePlotsChange: PropTypes.func.isRequired,
    onHighlightedPlotChange: PropTypes.func.isRequired,
};

export default DashboardComponent;
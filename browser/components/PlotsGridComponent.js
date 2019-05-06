import React from 'react';
import PropTypes from 'prop-types';

import PlotManager from './../PlotManager';
import SortablePlotComponent from './SortablePlotComponent';
import SortablePlotsGridComponent from './SortablePlotsGridComponent';
import { isNumber } from 'util';
import arrayMove from 'array-move';

/**
 * Component creates plots management form and is the source of truth for plots overall
 */
class PlotsGridComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            newPlotName: ``,
            plots: this.props.initialPlots,
            visiblePlots: [],
            dataSource: []
        };

        this.plotManager = new PlotManager();
        this.handleCreatePlot = this.handleCreatePlot.bind(this);
        this.handleDeletePlot = this.handleDeletePlot.bind(this);
        this.getFeatureByGidFromDataSource = this.getFeatureByGidFromDataSource.bind(this);
        this.handleNewPlotNameChange = this.handleNewPlotNameChange.bind(this);
        this.handlePlotSort = this.handlePlotSort.bind(this);
    }

    dehydratePlots(plots) { return this.plotManager.dehydratePlots(plots); }
    hydratePlots(plots) { return this.plotManager.hydratePlots(plots); }

    getPlots() {
        return JSON.parse(JSON.stringify(this.state.plots));
    }

    addPlot(newPlotName) {
        this.handleCreatePlot(newPlotName);
    }

    setPlots(plots) {
        this.setState({ plots });
    }

    handleCreatePlot(title) {
        this.plotManager.create(title).then(newPlot => {
            let plotsCopy = JSON.parse(JSON.stringify(this.state.plots));
            plotsCopy.push(newPlot);
            this.setState({ plots: plotsCopy });
            this.props.onPlotsChange(plotsCopy);
        }).catch(error => {
            console.error(`Error occured while creating plot (${error})`)
        });
    }


    handleHighlightPlot(plotId) {
        if (!plotId) throw new Error(`Empty plot identifier`);

    }

    handleShowPlot(plotId) {
        if (!plotId) throw new Error(`Empty plot identifier`);

    }
    handleHidePlot(plotId) {
        if (!plotId) throw new Error(`Empty plot identifier`);

    }

    handleDeletePlot(id) {
        if (!plotId) throw new Error(`Empty plot identifier`);

        if (confirm(__(`Delete plot`) + ` ${id}?`)) {
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
        
                if (plotWasDeleted === false) {
                    console.warn(`Plot ${id} was deleted only from backend storage`);
                }
        
                this.setState({ plots: plotsCopy });
                this.props.onPlotsChange(plotsCopy);
            }).catch(error => {
                console.error(`Error occured while creating plot (${error})`)
            });
        }
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
        
        this.plotManager.update(correspondingPlot).then(() => {
            this.setState({ plots });
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
            this.setState({ dataSource, plots });
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
        this.setState(({plots}) => ({
            plots: arrayMove(plots, oldIndex, newIndex)
        }));
    };

    render() {
        let plotsControls = (<p>{__(`No time series were created yet`)}</p>);

        let localPlotsControls = [];
        this.state.plots.map((plot, index) => {
            localPlotsControls.push(<SortablePlotComponent
                key={`borehole_plot_${index}`} index={index}
                handleDeletePlot={this.handleDeletePlot}
                meta={plot}/>);
        });

        if (localPlotsControls.length > 0) {
            plotsControls = (<SortablePlotsGridComponent axis="xy" onSortEnd={this.handlePlotSort} useDragHandle>{localPlotsControls}</SortablePlotsGridComponent>);
        }

        return (<div>{plotsControls}</div>);
    }
}

PlotsGridComponent.propTypes = {
    initialPlots: PropTypes.array.isRequired,
    onPlotsChange: PropTypes.func.isRequired,
};

export default PlotsGridComponent;
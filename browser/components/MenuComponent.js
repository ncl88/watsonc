import React from 'react';
import PropTypes from 'prop-types';

import TitleFieldComponent from './../../../../browser/modules/shared/TitleFieldComponent';
import MenuPlotComponent from './MenuPlotComponent';
import { isNumber } from 'util';

const uuidv4 = require('uuid/v4');

/**
 * Component creates plots management form and is the source of truth for plots overall
 */
class MenuPanelComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            newPlotName: ``,
            plots: this.props.initialPlots,
            dataSource: []
        };

        this.handleCreatePlot = this.handleCreatePlot.bind(this);
        this.handleDeletePlot = this.handleDeletePlot.bind(this);
        this.getFeatureByGidFromDataSource = this.getFeatureByGidFromDataSource.bind(this);
        this.handleNewPlotNameChange = this.handleNewPlotNameChange.bind(this);
    }

    componentDidMount() {}

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
        let plotsCopy = JSON.parse(JSON.stringify(this.state.plots));
        plotsCopy.push({
            id: uuidv4(),
            title,
            measurements: [],
            measurementsCachedData: {}
        });

        this.setState({ plots: plotsCopy });
        this.props.onPlotsChange(plotsCopy);
    }

    handleDeletePlot(id) {
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
            throw new Error(`Unable to delete plot with id ${id}`);
        }

        this.setState({ plots: plotsCopy });
        this.props.onPlotsChange(plotsCopy);
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
        this.setState({ plots });
        this.props.onPlotsChange(plots);
    }

    setDataSource(dataSource) {
        let plots = JSON.parse(JSON.stringify(this.state.plots));
        plots.map((plot, index) => {
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
                }
            });
        });

        this.setState({ dataSource, plots });
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

    render() {
        let plotsControls = (<p>{__(`No plots were created yet`)}</p>);

        let localPlotsControls = [];
        this.state.plots.map((plot, index) => {
            localPlotsControls.push(<li key={`borehole_plot_${index}`} className="list-group-item">
                <div>
                    <MenuPlotComponent
                        onDelete={(id) => { this.handleDeletePlot(id)}}
                        plotMeta={plot}/>
                </div>
            </li>);
        });

        if (localPlotsControls.length > 0) {
            plotsControls = (<ul className="list-group">{localPlotsControls}</ul>);
        }

        return (<div>
            <div>
                <h4>
                    {__(`Plots`)} 
                    <TitleFieldComponent onAdd={(title) => { this.handleCreatePlot(title) }} type="userOwned"/>
                </h4>
            </div>
            <div>{plotsControls}</div>
        </div>);
    }
}

MenuPanelComponent.propTypes = {
    initialPlots: PropTypes.array.isRequired,
    onPlotsChange: PropTypes.func.isRequired,
};

export default MenuPanelComponent;
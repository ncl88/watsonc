import React from 'react';
import PropTypes from 'prop-types';

import TitleFieldComponent from './../../../browser/modules/shared/TitleFieldComponent';
import PlotComponent from './PlotComponent';

const DEFAULT_X_AXIS = `timeofmeas`;

const uuidv4 = require('uuid/v4');

class BoreholePlotsComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            newPlotName: ``,
            plots: []
        };

        this.handleCreatePlotHandler = this.handleCreatePlotHandler.bind(this);
        this.handleNewPlotNameChange = this.handleNewPlotNameChange.bind(this);
    }

    componentDidMount() {}

    getPlots() {
        console.log(`### plots`, JSON.parse(JSON.stringify(this.state.plots)));
        return JSON.parse(JSON.stringify(this.state.plots));
    }

    setMeasurement(measurement) {
        this.setState({ measurement });
    }

    handleCreatePlotHandler(title) {
        let plotsCopy = JSON.parse(JSON.stringify(this.state.plots));
        plotsCopy.push({
            id: uuidv4(),
            title,
            xAxis: DEFAULT_X_AXIS,
            yAxes: []
        });

        this.setState({ plots: plotsCopy });
        this.props.onPlotsChange(plotsCopy);
    }

    handleNewPlotNameChange(event) {
        this.setState({ newPlotName: event.target.value});
    }

    _changeYAxes(plotId, measurementKey, action) {
        if (!plotId) throw new Error(`Invalid plot identifier`);

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
        if (action === `add`) {
            if (correspondingPlot.yAxes.indexOf(measurementKey) === -1) {
                correspondingPlot.yAxes.push(measurementKey);
            }
        } else if (action === `delete`) {
            if (correspondingPlot.yAxes.indexOf(measurementKey) === -1) {
                throw new Error(`Unable to find y axis for ${plotId} plot`);
            } else {
                correspondingPlot.yAxes.splice(correspondingPlot.yAxes.indexOf(measurementKey), 1);
            }
        } else {
            throw new Error(`Unrecognized action ${action}`);
        }

        plots[correspondingPlotIndex] = correspondingPlot;
        this.setState({ plots });
        this.props.onPlotsChange(plots);
    }


    addYAxis(plotId, measurementKey) {
        this._changeYAxes(plotId, measurementKey, `add`);
    }

    deleteYAxis(plotId, measurementKey) {
        this._changeYAxes(plotId, measurementKey, `delete`);
    }

    render() {
        let plotsControls = false;
        let measurementDescription = (<div><p>{__(`Please select the measurement`)}</p></div>);
        let createPlotControl = false;
        if (this.state.measurement) {
            measurementDescription = (<div>{__(`Borehole`)} no. {this.state.measurement.boreholeno}</div>);
            plotsControls = (<p>{__(`No plots were created yet`)}</p>);

            createPlotControl = (<div>
                <h4>
                    {__(`Plots`)} 
                    <TitleFieldComponent onAdd={(title) => { this.handleCreatePlotHandler(title) }} type="userOwned"/>
                </h4>
            </div>);

            let localPlotsControls = [];
            this.state.plots.map((plot, index) => {
                localPlotsControls.push(<li key={`borehole_plot_${index}`} className="list-group-item">
                    <div>
                        <PlotComponent
                            measurement={this.state.measurement}
                            plotMeta={plot}/>
                    </div>
                </li>);
            });

            if (localPlotsControls.length > 0) {
                plotsControls = (<ul className="list-group">{localPlotsControls}</ul>);
            }
        }

        return (<div>
            {measurementDescription}
            <hr/>
            {createPlotControl}
            <div>{plotsControls}</div>
        </div>);
    }
}

BoreholePlotsComponent.propTypes = {
    onPlotsChange: PropTypes.func.isRequired,
};

export default BoreholePlotsComponent;
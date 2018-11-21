import React from 'react';
import PropTypes from 'prop-types';
import { DragDropContextProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import ModalMeasurementComponent from './ModalMeasurementComponent';
import ModalPlotComponent from './ModalPlotComponent';
import TitleFieldComponent from './../../../../browser/modules/shared/TitleFieldComponent';
import SearchFieldComponent from './../../../../browser/modules/shared/SearchFieldComponent';

/**
 * Creates borehole parameters display and visualization panel
 */
class ModalComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            plots: this.props.initialPlots,
            measurementsSearchTerm: ``,
            plotsSearchTerm: ``
        }
    }

    setPlots(plots) {
        this.setState({ plots });
    }

    setMeasurementsSearchTerm(measurementsSearchTerm) {
        console.log(`### setMeasurementsSearchTerm`, measurementsSearchTerm);
        this.setState({ measurementsSearchTerm });
    }

    setPlotsSearchTerm(plotsSearchTerm) {
        console.log(`### setPlotsSearchTerm`, plotsSearchTerm);
        this.setState({ plotsSearchTerm });
    }

    render() {
        let plottedProperties = [];
        for (let key in this.props.feature.properties) {
            try {
                let data = JSON.parse(this.props.feature.properties[key]);
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


                            console.log(`### data`, data);


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

        // Preparing measurements
        let measurementsText = __(`Data series`);
        if (this.state.measurementsSearchTerm.length > 0) {
            measurementsText = __(`Found data series`);
        }

        let propertiesControls = [];
        plottedProperties.map((item, index) => {



            let display = true;
            if (this.state.measurementsSearchTerm.length > 0) {
                if (item.title.toLowerCase().indexOf(this.state.measurementsSearchTerm.toLowerCase()) === -1) {
                    display = false;
                }
            }

            if (display) {
                propertiesControls.push(<ModalMeasurementComponent
                    key={`measurement_` + index}
                    onAddMeasurement={this.props.onAddMeasurement}
                    gid={this.props.feature.properties.gid}
                    itemKey={item.key}
                    intakeIndex={item.intakeIndex}
                    title={item.title}/>);
            }
        });
        
        // Preparing plots
        let plotsText = __(`Plots`);
        if (this.state.plotsSearchTerm.length > 0) {
            plotsText = __(`Found plots`);
        }

        let plotsControls = (<p>{__(`No plots were created yet`)}</p>);
        if (this.state.plots && this.state.plots.length > 0) {
            plotsControls = [];
            this.state.plots.map((plot) => {
                let display = true;
                if (this.state.plotsSearchTerm.length > 0) {
                    if (plot.title.toLowerCase().indexOf(his.state.plotsSearchTerm.toLowerCase()) === -1) {
                        display = false;
                    }
                }

                if (display) {
                    plotsControls.push(<ModalPlotComponent
                        key={`plot_container_` + plot.id}
                        plot={plot}
                        dataSource={this.props.dataSource}/>);
                }
            });
        }

        return (<DragDropContextProvider backend={HTML5Backend}><div>
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-6">
                        <div>
                            <div>{measurementsText}</div>
                            <div>
                                <SearchFieldComponent id="measurements-search-control" onSearch={this.setMeasurementsSearchTerm.bind(this)}/>
                            </div>
                        </div>
                        <div>{propertiesControls}</div>
                    </div>
                    <div className="col-md-6">
                        <div>
                            <div>{plotsText}</div>
                            <div style={{ display: `flex` }}>
                                <div>
                                    <SearchFieldComponent id="plots-search-control" onSearch={this.setPlotsSearchTerm.bind(this)}/>
                                </div>
                                <div>
                                    <TitleFieldComponent id="new-plot-control" onAdd={(title) => { this.props.onPlotAdd(title) }} type="userOwned" customStyle={{ width: `100%` }}/>
                                </div>
                            </div>
                        </div>

                        <div>{plotsControls}</div>
                    </div>
                </div>
            </div>
        </div></DragDropContextProvider>);
    }
}

ModalComponent.propTypes = {
    feature: PropTypes.object.isRequired,
    initialPlots: PropTypes.array.isRequired,
    onPlotAdd: PropTypes.func.isRequired,
    onAddMeasurement: PropTypes.func.isRequired
};

export default ModalComponent;
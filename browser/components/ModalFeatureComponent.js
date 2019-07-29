import React from 'react';
import PropTypes from 'prop-types';

import withDragDropContext from './withDragDropContext';
import ModalMeasurementComponent from './ModalMeasurementComponent';
import ModalPlotComponent from './ModalPlotComponent';
import TitleFieldComponent from './../../../../browser/modules/shared/TitleFieldComponent';
import SearchFieldComponent from './../../../../browser/modules/shared/SearchFieldComponent';

const evaluateMeasurement = require('./../evaluateMeasurement');
const measurementIcon = require('./../measurementIcon');

/**
 * Creates borehole parameters display and visualization panel
 */
class ModalFeatureComponent extends React.Component {
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

                    //if (isPlottableProperty && [`minofbottom`, `maksoftop`].indexOf(key) === -1) {
                    if (isPlottableProperty) {
                        for (let i = 0; i < data.measurements.length; i++) {
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

        /**
         * Creates measurement control
         * 
         * @returns {Boolean|Object}
         */
        const createMeasurementControl = (item, key) => {
            let display = true;
            if (this.state.measurementsSearchTerm.length > 0) {
                if (item.title.toLowerCase().indexOf(this.state.measurementsSearchTerm.toLowerCase()) === -1) {
                    display = false;
                }
            }

            let control = false;
            if (display) {
                let json;
                try {
                    json = JSON.parse(this.props.feature.properties[item.key]);
                } catch (e) {
                    console.error(item);
                    throw new Error(`Unable to parse measurements data`);
                }

                let intakeName = `#` + (parseInt(item.intakeIndex) + 1);
                if (`intakes` in json && Array.isArray(json.intakes) && json.intakes[item.intakeIndex] !== null) {
                    intakeName = json.intakes[item.intakeIndex] + '';
                }

                let icon = false;
                if (!item.custom) {
                    let measurementData = evaluateMeasurement(json, this.props.limits, item.key, item.intakeIndex);
                    icon = measurementIcon.generate(measurementData.maxColor, measurementData.latestColor);
                }

                control = (<ModalMeasurementComponent
                    key={key}
                    icon={icon}
                    onAddMeasurement={this.props.onAddMeasurement}
                    gid={this.props.feature.properties.gid}
                    itemKey={item.key}
                    intakeIndex={item.intakeIndex}
                    intakeName={intakeName}
                    title={item.title}/>);
            }

            return control;
        };

        // Simulating the separate group for water level
        let categories = JSON.parse(JSON.stringify(this.props.categories));
        categories[`Vandstand`] = {};
        categories[`Vandstand`][`watlevmsl`] = `Water level`;

        let propertiesControls = [];
        if (Object.keys(categories).length > 0) {
            let numberOfDisplayedCategories = 0;
            for (let categoryName in categories) {
                let measurementsThatBelongToCategory = Object.keys(categories[categoryName]).map(e => categories[categoryName][e]);
                let measurementControls = [];
                plottedProperties = plottedProperties.filter((item, index) => {
                    if (measurementsThatBelongToCategory.indexOf(item.title) !== -1) {
                        // Measurement is in current category
                        let control = createMeasurementControl(item, ('measurement_' + index));
                        if (control) {
                            measurementControls.push(control);
                        }

                        return false;
                    } else {
                        return true;
                    }
                });

                if (measurementControls.length > 0) {
                    // Category has at least one displayed measurement
                    numberOfDisplayedCategories++;
                    propertiesControls.push(<div key={`category_` + numberOfDisplayedCategories}>
                        <div><h5>{categoryName.trim()}</h5></div>
                        <div>{measurementControls}</div>
                    </div>);
                }
            }

            // Placing uncategorized measurements in separate category
            let uncategorizedMeasurementControls = [];
            plottedProperties.slice().map((item, index) => {
                let control = createMeasurementControl(item, ('measurement_' + index));
                plottedProperties.splice(index, 1);
                if (control) {
                    uncategorizedMeasurementControls.push(control);
                }
            });

            if (`precipitation` in this.props.feature.properties && this.props.feature.properties.precipitation) {
                let control = createMeasurementControl({
                    custom: true,
                    title: __(`Precipitation`),
                    key: `precipitation`,
                    intakeIndex: 0
                }, `precipitation`);
                if (control) {
                    uncategorizedMeasurementControls.push(control);
                }
            }

            if (uncategorizedMeasurementControls.length > 0) {
                // Category has at least one displayed measurement
                numberOfDisplayedCategories++;
                propertiesControls.push(<div key={`uncategorized_category_0`}>
                    <div>
                        <h5>{__(`Uncategorized`)}</h5>
                    </div>
                    <div>{uncategorizedMeasurementControls}</div>
                </div>);
            }
        } else {
            plottedProperties.map((item, index) => {
                let control = createMeasurementControl(item, (`measurement_` + index));
                if (control) {
                    propertiesControls.push(control);
                }
            });
        }

        // Preparing plots
        let plotsText = __(`Time series`);
        if (this.state.plotsSearchTerm.length > 0) {
            plotsText = __(`Found time series`);
        }

        let plotsControls = (<p>{__(`No time series were created yet`)}</p>);
        if (this.state.plots && this.state.plots.length > 0) {
            plotsControls = [];
            this.state.plots.map((plot) => {
                let display = true;
                if (this.state.plotsSearchTerm.length > 0) {
                    if (plot.title.toLowerCase().indexOf(this.state.plotsSearchTerm.toLowerCase()) === -1) {
                        display = false;
                    }
                }

                if (display) {
                    plotsControls.push(<ModalPlotComponent
                        key={`plot_container_` + plot.id}
                        plot={plot}
                        onDeleteMeasurement={this.props.onDeleteMeasurement}
                        dataSource={this.props.dataSource}/>);
                }
            });
        }

        return (<div style={{ height: `inherit` }}>
            <div>
                <div className="measurements-modal_left-column">
                    <div>{measurementsText}</div>
                    <div className="form-group">
                        <SearchFieldComponent id="measurements-search-control" onSearch={(measurementsSearchTerm) => {
                            this.setState({ measurementsSearchTerm });
                        }}/>
                    </div>
                </div>
                <div className="measurements-modal_right-column">
                    <div>{plotsText}</div>
                    <div style={{ display: `flex` }}>
                        <div className="form-group">
                            <SearchFieldComponent id="plots-search-control" onSearch={(plotsSearchTerm) => {
                                this.setState({ plotsSearchTerm });
                            }}/>
                        </div>
                        <div className="form-group">
                            <TitleFieldComponent id="new-plot-control" onAdd={(title) => { this.props.onPlotAdd(title) }} type="userOwned" customStyle={{ width: `100%` }}/>
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ height: `calc(100% - 74px)`, display: `flex` }}>
                <div className="measurements-modal_left-column measurements-modal_scrollable">{propertiesControls}</div>
                <div className="measurements-modal_right-column measurements-modal_scrollable">{plotsControls}</div>
            </div>
        </div>);
    }
}

ModalFeatureComponent.propTypes = {
    categories: PropTypes.object.isRequired,
    feature: PropTypes.object.isRequired,
    names: PropTypes.object.isRequired,
    limits: PropTypes.object.isRequired,
    initialPlots: PropTypes.array.isRequired,
    onPlotAdd: PropTypes.func.isRequired,
    onAddMeasurement: PropTypes.func.isRequired,
    onDeleteMeasurement: PropTypes.func.isRequired
};

export default withDragDropContext(ModalFeatureComponent);
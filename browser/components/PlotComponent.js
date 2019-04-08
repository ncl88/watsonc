import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import Plot from 'react-plotly.js';

import SortableHandleComponent from './SortableHandleComponent';

/**
 * Creates single plot with multiple measurements displayed on it
 */
class MenuPanelPlotComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let plot = (<p className="text-muted">{__(`At least one y axis has to be provided`)}</p>);
        if (this.props.plotMeta.measurements && this.props.plotMeta.measurements.length > 0) {
            let colors = ['rgb(19,128,196)', 'rgb(16,174,140)', 'rgb(235,96,29)', 'rgb(247,168,77)', 'rgb(119,203,231)', `black`]

            let minTime = false;
            let maxTime = false;

            let legend = [];
            let data = [];
            this.props.plotMeta.measurements.map((measurementLocationRaw, index) => {
                if (measurementLocationRaw in this.props.plotMeta.measurementsCachedData &&
                    this.props.plotMeta.measurementsCachedData[measurementLocationRaw]) {
                   let measurementLocation = measurementLocationRaw.split(':');
                   if (measurementLocation.length !== 3) throw new Error(`Invalid key and intake notation: ${measurementLocationRaw}`);

                   let gid = parseInt(measurementLocation[0]);
                   let key = measurementLocation[1];
                   let intakeIndex = parseInt(measurementLocation[2]);

                    let feature = this.props.plotMeta.measurementsCachedData[measurementLocationRaw].data;
                    let createdAt = this.props.plotMeta.measurementsCachedData[measurementLocationRaw].created_at;

                    let measurementData = JSON.parse(feature.properties[key]);
                    if (Array.isArray(measurementData.measurements) === false) {
                        measurementData.measurements = JSON.parse(measurementData.measurements);
                    }

                    let localMinTime = measurementData.timeOfMeasurement[intakeIndex][0];
                    if (minTime === false) {
                        minTime = localMinTime;
                    } else {
                        if (moment(localMinTime).isBefore(minTime)) {
                            minTime = localMinTime;
                        }
                    }

                    let localMaxTime = measurementData.timeOfMeasurement[intakeIndex][measurementData.timeOfMeasurement[intakeIndex].length - 1];
                    if (maxTime === false) {
                        maxTime = localMaxTime;
                    } else {
                        if (moment(localMaxTime).isAfter(maxTime)) {
                            maxTime = localMaxTime;
                        }
                    }

                    data.push({
                        name: (`${measurementData.title} (${measurementData.unit})`),
                        x: measurementData.timeOfMeasurement[intakeIndex],
                        y: measurementData.measurements[intakeIndex],
                        type: 'scattergl',
                        mode: 'lines+markers',
                        marker: {
                            color: colors[index]
                        }
                    });

                    legend.push(<div key={index} style={{
                        display: `inline-block`,
                        border: `1px solid lightgray`,
                        borderRadius: `4px`,
                        padding: `0px`,
                        marginRight: `0px`
                    }}>
                        <div style={{
                            width: '10px',
                            height: '10px',
                            backgroundColor: colors[index],
                            display: `inline-block`,
                            marginRight: `0px`
                        }}></div>
                        <div style={{ display: `inline-block` }}>{`${feature.properties.boreholeno} ${measurementData.title} (${__(`units`)}: ${measurementData.unit}, ${__(`updated at`)}: ${createdAt})`}</div>
                    </div>);
                } else {
                    console.error(`Plot does not contain measurement ${measurementLocationRaw}`);
                }
            });

            let layout = {
                displayModeBar: false,
                width: 520,
                height: 420,
                margin: {
                    l: 5,
                    r: 5,
                    b: 40,
                    t: 5,
                    pad: 4
                },
                showlegend: false,
                xaxis: {
                    autorange: true,
                    margin: 0,
                    type: 'date'
                },
                yaxis: {
                    autorange: true
                },
                autosize: true
            };

            plot = (<div style={{ paddingBottom: `20px` }}>
                <div style={{ border: `1px solid lightgray`, paddingBottom: `20px` }}>
                    <Plot data={data} layout={layout}/>
                </div>
                <div>{legend}</div>
            </div>);
        }

        return (<div>
            <div>
                <h5>{this.props.plotMeta.title}  <SortableHandleComponent title={this.props.plotMeta.title}/> <a
                        className="btn"
                        href="javascript:void(0)"
                        title={__(`Delete`) + ` ` + this.props.plotMeta.title}
                        onClick={() => { this.props.onDelete(this.props.plotMeta.id)}}
                        style={{padding: `0px`}}>
                        <i className="fa fa-remove"></i> {__(`Delete`)}
                    </a>
                </h5>
            </div>
            <div>{plot}</div>
        </div>);
    }
}

MenuPanelPlotComponent.propTypes = {
    onDelete: PropTypes.func.isRequired,
    plotMeta: PropTypes.object.isRequired
};

export default MenuPanelPlotComponent;
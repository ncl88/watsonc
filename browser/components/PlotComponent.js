import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import moment from 'moment';
import Plot from 'react-plotly.js';

import {LIMIT_CHAR} from '../constants';
import LoadingOverlay from './../../../../browser/modules/shared/LoadingOverlay';
import SortableHandleComponent from './SortableHandleComponent';

const utils = require('./../utils');

/**
 * Creates single plot with multiple measurements displayed on it
 */
class MenuPanelPlotComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false
        };
    }

    download() {
        let data = [];
        this.props.plotMeta.measurements.map((measurementLocationRaw, index) => {
            if (measurementLocationRaw in this.props.plotMeta.measurementsCachedData &&
                this.props.plotMeta.measurementsCachedData[measurementLocationRaw]) {
                let measurementLocation = measurementLocationRaw.split(':');
                if (measurementLocation.length !== 3) throw new Error(`Invalid key and intake notation: ${measurementLocationRaw}`);

                let key = measurementLocation[1];
                let intakeIndex = parseInt(measurementLocation[2]);

                let feature = this.props.plotMeta.measurementsCachedData[measurementLocationRaw].data;

                let measurementData = JSON.parse(feature.properties[key]);
                if (Array.isArray(measurementData.measurements) === false) {
                    measurementData.measurements = JSON.parse(measurementData.measurements);
                }

                data.push({
                    name: (`${feature.properties.boreholeno} - ${measurementData.title} (${measurementData.unit})`),
                    x: measurementData.timeOfMeasurement[intakeIndex],
                    y: measurementData.measurements[intakeIndex],
                });
            } else {
                console.error(`Plot does not contain measurement ${measurementLocationRaw}`);
            }
        });

        this.setState({loading: true});
        axios.post('/api/extension/watsonc/download-plot', {
            title: this.props.plotMeta.title,
            data
        }, {responseType: 'arraybuffer'}).then(response => {
            const filename = this.props.plotMeta.title.replace(/\s+/g, '_').toLowerCase() + '.xlsx';
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);

            this.setState({loading: false});
        }).catch(error => {
            console.error(error);
            alert(`Error occured while generating plot XSLS file`);
            this.setState({loading: false});
        })

    }

    render() {
        let plot = (<p className="text-muted">{__(`At least one y axis has to be provided`)}</p>);
        let data = [];
        if (this.props.plotMeta.measurements && this.props.plotMeta.measurements.length > 0) {
            let colors = ['rgb(19,128,196)', 'rgb(16,174,140)', 'rgb(235,96,29)', 'rgb(247,168,77)', 'rgb(119,203,231)', `black`]

            let minTime = false;
            let maxTime = false;

            let yAxis2LayoutSettings = false;
            this.props.plotMeta.measurements.map((measurementLocationRaw, index) => {
                if (measurementLocationRaw in this.props.plotMeta.measurementsCachedData &&
                    this.props.plotMeta.measurementsCachedData[measurementLocationRaw]) {
                    let measurementLocation = measurementLocationRaw.split(':');

                    let feature = this.props.plotMeta.measurementsCachedData[measurementLocationRaw].data;
                    if (measurementLocation.length === 3) {
                        let key = measurementLocation[1];
                        let intakeIndex = parseInt(measurementLocation[2]);
                        let createdAt = this.props.plotMeta.measurementsCachedData[measurementLocationRaw].created_at;
    
                        let measurementData = JSON.parse(feature.properties[key]);    
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

                        let textValues = [];
                        if (measurementData.attributes && Array.isArray(measurementData.attributes[intakeIndex]) && measurementData.attributes[intakeIndex].length > 0) {
                            let xValues = [], yValues = [];

                            measurementData.attributes[intakeIndex].map((item, index) => {
                                if (item === LIMIT_CHAR) {
                                    xValues.push(measurementData.timeOfMeasurement[intakeIndex][index]);
                                    yValues.push(measurementData.measurements[intakeIndex][index]);
                                    textValues.push(measurementData.measurements[intakeIndex][index] + ' ' + LIMIT_CHAR);
                                } else {
                                    textValues.push(measurementData.measurements[intakeIndex][index]);
                                }
                            });

                            if (xValues.length > 0) {
                                data.push({
                                    x: xValues,
                                    y: yValues,
                                    type: 'scattergl',
                                    mode: 'markers',
                                    hoverinfo: 'none',
                                    showlegend: false,
                                    marker: {
                                        color: 'rgba(17, 157, 255, 0)',
                                        size: 20,
                                        line: {
                                            color: 'rgb(231, 0, 0)',
                                            width: 3
                                        }
                                    },
                                });
                            }
                        }

                        let title = utils.getMeasurementTitle(feature);
                        let plotData = {
                            name: (`${title} (${measurementData.intakes ? measurementData.intakes[intakeIndex] : (intakeIndex + 1)}) - ${measurementData.title} (${measurementData.unit})`),
                            x: measurementData.timeOfMeasurement[intakeIndex],
                            y: measurementData.measurements[intakeIndex],
                            type: 'scattergl',
                            mode: 'lines+markers',
                            hoverinfo: 'text',
                            marker: {
                                color: colors[index]
                            }
                        };

                        if (textValues.length > 0) plotData.hovertext = textValues;
                        data.push(plotData);
                    } else if (measurementLocation.length === 4) {
                        let key = measurementLocation[1];
                        let customSpecificator = measurementLocation[2];

                        if ([`daily`, `weekly`, `monthly`].indexOf(customSpecificator) === -1) {
                            throw new Error(`The custom specificator (${customSpecificator}) is invalid`);
                        }
    
                        let measurementData = JSON.parse(feature.properties[key]);
                        let measurementDataCopy = JSON.parse(JSON.stringify(measurementData.data));
                        data.push(measurementDataCopy[customSpecificator].data[0]);

                        let range = [0, 0];
                        for (let key in measurementDataCopy) {
                            if (measurementDataCopy[key].layout.yaxis2.range) {
                                if (measurementDataCopy[key].layout.yaxis2.range[0] < range[0]) range[0] = measurementDataCopy[key].layout.yaxis2.range[0];
                                if (measurementDataCopy[key].layout.yaxis2.range[1] > range[1]) range[1] = measurementDataCopy[key].layout.yaxis2.range[1];
                            }

                            yAxis2LayoutSettings = measurementDataCopy[key].layout.yaxis2;
                        }

                        yAxis2LayoutSettings.range = range;
                        yAxis2LayoutSettings.showgrid = false;
                    } else {
                        throw new Error(`Invalid key and intake notation: ${measurementLocationRaw}`);
                    }
                } else {
                    console.error(`Plot does not contain measurement ${measurementLocationRaw}`);
                }
            });

            let layout = {
                displayModeBar: false,
                margin: {
                    l: 30,
                    r: (yAxis2LayoutSettings ? 30 : 5),
                    b: 30,
                    t: 5,
                    pad: 4
                },
                xaxis: {
                    autorange: true,
                    margin: 0,
                    type: 'date'
                },
                yaxis: {
                    autorange: true,
                },
                showlegend: true,
                legend: {
                    orientation: "h",
                    y: -0.2
                },
                autosize: true
            };

            if (yAxis2LayoutSettings) {
                layout.yaxis2 = yAxis2LayoutSettings;
            }

            plot = (<Plot
                data={data}
                layout={layout}
                onLegendDoubleClick={() => false}
                style={{width: "100%", height: `${this.props.height - 60}px`}}/>);
        }

        return (<div style={{maxHeight: ($(document).height() * 0.4 + 40) + 'px'}}>
            {this.state.loading ? <LoadingOverlay/> : false}
            <div style={{height: `40px`}}>
                <div style={{float: `left`}}>
                    <h4>{this.props.plotMeta.title}</h4>
                </div>
                <div style={{float: `right`}}>
                    <a
                        className="btn btn-primary"
                        href="javascript:void(0)"
                        disabled={data.length === 0}
                        title={__(`Download`) + ` ` + this.props.plotMeta.title}
                        onClick={() => { this.download()}}
                        style={{padding: `0px`, marginLeft: `10px`}}>
                        <i className="fa fa-download"></i> {__(`Download`)}</a>
                     <SortableHandleComponent title={this.props.plotMeta.title}/>
                     <a
                        className="btn"
                        href="javascript:void(0)"
                        title={__(`Delete`) + ` ` + this.props.plotMeta.title}
                        onClick={() => { this.props.onDelete(this.props.plotMeta.id)}}
                        style={{padding: `0px`, marginLeft: `20px`}}>
                        <i className="fa fa-remove"></i> {__(`Delete`)}</a> 
                </div>
            </div>
            <div style={{height: `${this.props.height - 50}px`, border: `1px solid lightgray`}}>{plot}</div>
        </div>);
    }
}

MenuPanelPlotComponent.propTypes = {
    onDelete: PropTypes.func.isRequired,
    plotMeta: PropTypes.object.isRequired
};

export default MenuPanelPlotComponent;
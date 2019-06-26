import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import moment from 'moment';
import Plot from 'react-plotly.js';

import LoadingOverlay from './../../../../browser/modules/shared/LoadingOverlay';
import SortableHandleComponent from './SortableHandleComponent';

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
                    name: (`DGU ${feature.properties.boreholeno} - ${measurementData.title} (${measurementData.unit})`),
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

            this.props.plotMeta.measurements.map((measurementLocationRaw, index) => {
                if (measurementLocationRaw in this.props.plotMeta.measurementsCachedData &&
                    this.props.plotMeta.measurementsCachedData[measurementLocationRaw]) {
                    let measurementLocation = measurementLocationRaw.split(':');
                    if (measurementLocation.length !== 3) throw new Error(`Invalid key and intake notation: ${measurementLocationRaw}`);

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
                        name: (`DGU ${feature.properties.boreholeno} - ${measurementData.title} (${measurementData.unit}${createdAt ? `, ` + __(`updated at`) + ` ` + moment(createdAt).format(`D MMM YYYY`) : ``})`),
                        x: measurementData.timeOfMeasurement[intakeIndex],
                        y: measurementData.measurements[intakeIndex],
                        type: 'scattergl',
                        mode: 'lines+markers',
                        marker: {
                            color: colors[index]
                        }
                    });
                } else {
                    console.error(`Plot does not contain measurement ${measurementLocationRaw}`);
                }
            });

            let layout = {
                displayModeBar: false,
                margin: {
                    l: 30,
                    r: 5,
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
                    orientation: "h"
                },
                autosize: true
            };

            plot = (<div style={{ paddingBottom: `20px` }}>
                <div style={{ border: `1px solid lightgray`, paddingBottom: `20px` }}>
                    <Plot data={data} useResizeHandler={true} layout={layout} style={{width: "100%", height: "100%"}}/>
                </div>
                <div>{legend}</div>
            </div>);
        }

        return (<div>
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
            <div>{plot}</div>
        </div>);
    }
}

MenuPanelPlotComponent.propTypes = {
    onDelete: PropTypes.func.isRequired,
    plotMeta: PropTypes.object.isRequired
};

export default MenuPanelPlotComponent;
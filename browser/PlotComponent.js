import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import Plot from 'react-plotly.js';

/**
 * Creates single plot with multiple measurements displayed on it
 */
class PlotComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {}

    render() {
        let plot = (<p className="text-muted">{__(`At least one y axis has to be provided`)}</p>);
        if (this.props.plotMeta.measurements && this.props.plotMeta.measurements.length > 0) {
            let colors = [`red`, `green`, `blue`, `orange`, `purple`, `black`];

            let minTime = false;
            let maxTime = false;

            let legend = [];
            let data = [];
            this.props.plotMeta.measurements.map((measurementLocationRaw, index) => {
                let measurementLocation = measurementLocationRaw.split(':');
                if (measurementLocation.length !== 3) throw new Error(`Invalid key and intake notation: ${measurementLocationRaw}`);

                let gid = parseInt(measurementLocation[0]);
                let key = measurementLocation[1];
                let intakeIndex = parseInt(measurementLocation[2]);

                // Selecting the corresponding measurement (layer feature)
                let feature = this.props.getFeatureByGid(gid);
                if (feature) {
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
                        type: 'scatter',
                        mode: 'markers',
                        marker: {
                            color: colors[index]
                        },
                    });

                    legend.push(<div key={index} style={{
                        display: `inline-block`,
                        border: `1px solid lightgray`,
                        borderRadius: `4px`,
                        padding: `4px`,
                        marginRight: `4px`
                    }}>
                        <div style={{
                            width: '10px',
                            height: '10px',
                            backgroundColor: colors[index],
                            display: `inline-block`,
                            marginRight: `6px`
                        }}></div>
                        <div style={{ display: `inline-block` }}>{`${feature.properties.boreholeno} ${measurementData.title} (${measurementData.unit})`}</div>
                    </div>);
                } else {
                    console.warn(`Premature plot initialization for feature id ${gid}`);
                }
            });

            let layout = {
                displayModeBar: false,
                width: 420,
                height: 420,
                showlegend: false,
                xaxis: {
                    autorange: true,
                    rangeselector: {buttons: [{
                          count: 1,
                          label: '1m',
                          step: 'month',
                          stepmode: 'backward'
                        }, {
                          count: 6,
                          label: '6m',
                          step: 'month',
                          stepmode: 'backward'
                        },
                        {step: 'all'}
                    ]},
                    rangeslider: {
                        range: [
                            moment(minTime).subtract(1,'days').format('YYYY-MM-DD'),
                            moment(maxTime).add(1,'days').format('YYYY-MM-DD')    
                        ]
                    },
                    type: 'date'
                },
                yaxis: {
                    autorange: true
                }
            };

            plot = (<div style={{ paddingBottom: `20px` }}>
                <div style={{ border: `1px solid lightgray`, paddingBottom: `20px` }}>
                    <Plot data={data} layout={layout}/>
                </div>
                <div>
                    {legend}
                </div>
            </div>);
        }

        return (<div>
            <div>
                <h5 title={this.props.plotMeta.id}>
                    {this.props.plotMeta.title}  <a href="javascript:void(0)" onClick={() => { this.props.onDelete(this.props.plotMeta.id)}}>
                        <i className="fa fa-remove"></i>
                    </a>
                </h5>
            </div>
            <div>{plot}</div>
        </div>);
    }
}

PlotComponent.propTypes = {
    getFeatureByGid: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    plotMeta: PropTypes.object.isRequired
};

export default PlotComponent;
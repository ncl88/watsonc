import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import Plot from 'react-plotly.js';

class PlotComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {}

    render() {
        let plot = (<p className="text-muted">{__(`At least one y axis has to be provided`)}</p>);
        if (this.props.plotMeta.xAxis && this.props.plotMeta.yAxes.length > 0) {
            let formattedDateAxisData = [];
            let parsedTimeOfMeasurements = JSON.parse(this.props.measurement[this.props.plotMeta.xAxis]);
            parsedTimeOfMeasurements.map(item => {
                formattedDateAxisData.push(moment(item).format('YYYY-MM-DD HH:mm:ss'));
            });

            // @todo Implement color picker
            let colors = [`red`, `green`, `blue`, `orange`, `purple`];

            let data = [];
            this.props.plotMeta.yAxes.map((yAxis, index) => {
                let localParsedData = JSON.parse(this.props.measurement[yAxis])
                data.push({
                    name: yAxis,
                    x: parsedTimeOfMeasurements,
                    y: localParsedData,
                    type: 'scatter',
                    mode: 'markers',
                    marker: {
                        color: colors[index]
                    },
                });
            });

            let layout = {
                displayModeBar: false,
                width: 450,
                height: 450,
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
                            moment(parsedTimeOfMeasurements[0]).format('YYYY-MM-DD'),
                            moment(parsedTimeOfMeasurements[parsedTimeOfMeasurements.length - 1]).format('YYYY-MM-DD')    
                        ]
                    },
                    type: 'date'
                },
                yaxis: {
                    autorange: true
                }
            };

            plot = (<Plot data={data} layout={layout}/>);
        }

        return (<div>
            <div>
                <h5>{this.props.plotMeta.title} (<span className="text-muted" style={{ fontSize: `12px` }}>{this.props.plotMeta.id}</span>)</h5>
            </div>
            <div>{plot}</div>
        </div>);
    }
}

PlotComponent.propTypes = {
    measurement: PropTypes.object.isRequired,
    plotMeta: PropTypes.object.isRequired
};

export default PlotComponent;
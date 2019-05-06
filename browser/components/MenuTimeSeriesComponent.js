import React from 'react';
import PropTypes from 'prop-types';

import PlotComponent from './PlotComponent';
import { isNumber } from 'util';
import TitleFieldComponent from './../../../../browser/modules/shared/TitleFieldComponent';

const uuidv4 = require('uuid/v4');

/**
 * Component for managing time series
 */
class MenuTimeSeriesComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            plots: this.props.initialPlots,
        };
    }

    componentDidMount() {}

    handleChecked(event) {

        console.log(`###`, event.target.checked);

    }

    render() {

        /*
            onPlotDelete={plotsGridComponentInstance.handleDeletePlot}
            onPlotHighlight={plotsGridComponentInstance.handleHighlightPlot}
            onPlotShow={plotsGridComponentInstance.handleShowPlot}
            onPlotHide
        */

        let plotsTable = [];
        this.state.plots.map((plot, index) => {
            
            console.log(`### plot`, plot);

            let isChecked = true;

            plotsTable.push(<tr key={`borehole_plot_control_${index}`}>
                <td>
                    <div className="form-group">
                        <div className="checkbox">
                            <label>
                                <input type="checkbox" checked={isChecked} onChange={this.handleChecked}/>
                            </label>
                        </div>
                    </div>
                </td>
                <td>{plot.title}</td>
                <td>
                    <div className="form-group">
                        <div className="radio">
                            <label>
                                <input type="radio" name="sample1" value="option1" checked={isChecked} onChange={this.handleChecked}/>
                            </label>
                        </div>
                    </div>
                </td>
                <td>
                    <a href="javascript:void(0)" className="btn btn-raised btn-xs" style={{padding: `4px`, margin: `0px`}}>
                        <i className="material-icons">delete</i>
                    </a>
                </td>
            </tr>);
        });

        if (Array.isArray(plotsTable) && plotsTable.length > 0) {
            plotsTable = (<table className="table table-striped table-hover">
                <thead>
                    <tr style={{color: `rgb(0, 150, 136)`}}>
                        <td style={{width: `40px`}}><i className="material-icons">border_all</i></td>
                        <td style={{width: `70%`}}>{__(`Title`)}</td>
                        <td><i class="fas fa-map-marked-alt fas-material-adapt"></i></td>
                        <td><i className="material-icons">delete</i></td>
                    </tr>
                </thead>
                <tbody>{plotsTable}</tbody>
            </table>);
        } else {
            plotsTable = (<p>{__(`No time series were created yet`)}</p>);
        }

       return (<div>
            <div>
                <h4>{__(`Timeseries`)}
                    <TitleFieldComponent
                        saveButtonText={__(`Save`)}
                        layout="dense"
                        onAdd={(title) => {
                            console.log(`### on add plot`, title);
                        }} type="userOwned"/>
                </h4>
            </div>
            <div>{plotsTable}</div>
        </div>);
    }
}

MenuTimeSeriesComponent.propTypes = {
    initialPlots: PropTypes.array.isRequired,
};

export default MenuTimeSeriesComponent;
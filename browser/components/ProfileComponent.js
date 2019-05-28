import React from 'react';
import PropTypes from 'prop-types';
import Plot from 'react-plotly.js';

import SortableHandleComponent from './SortableHandleComponent';

/**
 * Creates single profile with multiple measurements displayed on it
 */
class ProfileComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        console.log(this.props);

        let plot = (<p className="text-muted">{__(`At least one y axis has to be provided`)}</p>);
        let legend = false;
        if (this.props.plotMeta) {
            plot = (<div style={{ paddingBottom: `20px` }}>
                <div style={{ border: `1px solid lightgray`, paddingBottom: `20px` }}>
                    <Plot data={this.props.plotMeta.value.data.data} useResizeHandler={true} layout={this.props.plotMeta.value.data.layout} style={{width: "100%", height: "100%"}}/>
                </div>
                <div>{legend}</div>
            </div>);
        }

        return (<div>
            <div>
                <h5>{this.props.plotMeta.title} <SortableHandleComponent title={this.props.plotMeta.title}/> <a
                        className="btn"
                        href="javascript:void(0)"
                        title={__(`Delete`) + ` ` + this.props.plotMeta.value.title}
                        onClick={() => { this.props.onDelete(this.props.plotMeta.key)}}
                        style={{padding: `0px`, marginLeft: `10px`}}>
                        <i className="fa fa-remove"></i> {__(`Delete`)}
                    </a>
                </h5>
            </div>
            <div>{plot}</div>
        </div>);
    }
}

ProfileComponent.propTypes = {
    onDelete: PropTypes.func.isRequired,
    plotMeta: PropTypes.object.isRequired
};

export default ProfileComponent;
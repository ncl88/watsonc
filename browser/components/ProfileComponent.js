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
        let dataCopy = JSON.parse(JSON.stringify(this.props.plotMeta.value.data.data));
        dataCopy.map((item, index) => {
            if (!dataCopy[index].mode) dataCopy[index].mode = 'lines';
            if (dataCopy[index].fillcolor && dataCopy[index].fillcolor.indexOf('%') > -1) dataCopy[index].fillcolor = decodeURIComponent(dataCopy[index].fillcolor);

            if (item.line && item.line.color && item.line.color.indexOf('%') > -1) {    
                dataCopy[index].line.color = decodeURIComponent(item.line.color);
            }
        });

        let plot = (<p className="text-muted">{__(`At least one y axis has to be provided`)}</p>);
        if (this.props.plotMeta) {
            plot = (<div style={{ paddingBottom: `20px` }}>
                <div style={{ border: `1px solid lightgray`, paddingBottom: `20px` }}>
                    <Plot
                        data={dataCopy}
                        useResizeHandler={true}
                        onClick={this.props.onClick}
                        config={{modeBarButtonsToRemove: ['autoScale2d']}}
                        layout={this.props.plotMeta.value.data.layout}
                        style={{width: "100%", height: "100%"}}/>
                </div>
            </div>);
        }

        return (<div>
            <div style={{height: `40px`}}>
                <div style={{float: `left`}}>
                    <h4>{this.props.plotMeta.value.title}</h4>
                </div>
                <div style={{float: `right`}}>
                    <a
                        className="btn btn-primary"
                        href="javascript:void(0)"
                        title={__(`Change datatype`) + ` ` + this.props.plotMeta.value.title}
                        onClick={() => { this.props.onChangeDatatype(this.props.plotMeta.key)}}
                        style={{padding: `0px`}}>
                        <i className="fa fa-edit"></i> {__(`Change datatype`)}
                    </a> <SortableHandleComponent title={this.props.plotMeta.value.title}/> <a
                        className="btn"
                        href="javascript:void(0)"
                        title={__(`Delete`) + ` ` + this.props.plotMeta.value.title}
                        onClick={() => { this.props.onDelete(this.props.plotMeta.key)}}
                        style={{padding: `0px`, marginLeft: `20px`}}>
                        <i className="fa fa-remove"></i> {__(`Delete`)}
                    </a>
                </div>
            </div>
            <div>{plot}</div>
        </div>);
    }
}

ProfileComponent.propTypes = {
    onDelete: PropTypes.func.isRequired,
    onChangeDatatype: PropTypes.func.isRequired,
    plotMeta: PropTypes.object.isRequired
};

export default ProfileComponent;
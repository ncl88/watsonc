import React from 'react';
import {sortableHandle} from 'react-sortable-hoc';

const SortableHandleComponent = (props) => {
    return (<a
        className="btn btn-primary"
        href="javascript:void(0)"
        title={__(`Move`) + ` ` + props.title}
        style={{padding: `0px`, marginLeft: `20px`}}>
        <i className="fa fa-bars"></i> {__(`Move`)}
    </a>);
}

export default sortableHandle(SortableHandleComponent);
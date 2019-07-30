import React from 'react';
import PropTypes from 'prop-types';
import {sortableElement} from 'react-sortable-hoc';
import {VIEW_ROW} from './../constants';

import PlotComponent from './PlotComponent';

/**
 * Wrapper for making a Plot component sortable inside of Plots grid
 */
const SortablePlotComponent = (props) => {
    return (<li className={props.viewMode === VIEW_ROW ? `list-group-item col-sm-12 col-md-12 col-lg-12` : `list-group-item col-sm-12 col-md-12 col-lg-6`} style={{
        height: `${props.height}px`,
        padding: `0px 16px 0px 16px`
    }}>
        <div>
            <PlotComponent
                onDelete={(id) => { props.handleDelete(id)}}
                height={props.height}
                viewMode={props.viewMode}
                plotMeta={props.meta}/>
        </div>
    </li>);
}

SortablePlotComponent.propTypes = {
    handleDelete: PropTypes.func.isRequired,
    meta: PropTypes.object.isRequired,
};

export default sortableElement(SortablePlotComponent);
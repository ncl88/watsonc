import React from 'react';
import PropTypes from 'prop-types';
import {sortableElement} from 'react-sortable-hoc';

import PlotComponent from './PlotComponent';

/**
 * Wrapper for making a Plot component sortable inside of Plots grid
 */
const SortablePlotComponent = (props) => {
    return (<li  className="list-group-item col-sm-12 col-md-12 col-lg-6">
        <div>
            <PlotComponent onDelete={(id) => { props.handleDelete(id)}} plotMeta={props.meta}/>
        </div>
    </li>);
}

SortablePlotComponent.propTypes = {
    handleDelete: PropTypes.func.isRequired,
    meta: PropTypes.object.isRequired,
};

export default sortableElement(SortablePlotComponent);
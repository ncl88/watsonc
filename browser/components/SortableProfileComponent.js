import React from 'react';
import PropTypes from 'prop-types';
import {sortableElement} from 'react-sortable-hoc';

import ProfileComponent from './ProfileComponent';

/**
 * Wrapper for making a Profile component sortable inside of Plots&Profiles grid
 */
const SortableProfileComponent = (props) => {
    return (<li className={props.containerClass ? props.containerClass : `list-group-item col-sm-12 col-md-12 col-lg-6`}>
        <div>
            <ProfileComponent onDelete={(id) => { props.handleDelete(id)}} plotMeta={props.meta}/>
        </div>
    </li>);
}

SortableProfileComponent.propTypes = {
    handleDelete: PropTypes.func.isRequired,
    meta: PropTypes.object.isRequired,
};

export default sortableElement(SortableProfileComponent);
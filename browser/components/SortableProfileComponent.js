import React from 'react';
import PropTypes from 'prop-types';
import {sortableElement} from 'react-sortable-hoc';

import ProfileComponent from './ProfileComponent';

/**
 * Wrapper for making a Profile component sortable inside of Plots&Profiles grid
 */
const SortableProfileComponent = (props) => {
    return (<li className={props.containerClass ? props.containerClass : `list-group-item col-sm-12 col-md-12 col-lg-6`} style={{
        height: `${props.height}px`,
        padding: `0px 16px 0px 16px`
    }}>
        <div>
            <ProfileComponent
                onDelete={(id) => { props.handleDelete(id)}}
                onClick={props.handleClick}
                height={props.height}
                onChangeDatatype={(id) => { props.handleChangeDatatype(id)}}
                plotMeta={props.meta}/>
        </div>
    </li>);
}

SortableProfileComponent.propTypes = {
    handleDelete: PropTypes.func.isRequired,
    handleClick: PropTypes.func.isRequired,
    handleChangeDatatype: PropTypes.func.isRequired,
    meta: PropTypes.object.isRequired,
};

export default sortableElement(SortableProfileComponent);
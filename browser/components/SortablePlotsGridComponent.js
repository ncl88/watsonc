import React from 'react';
import {sortableContainer} from 'react-sortable-hoc';

const SortablePlotsGridComponent = sortableContainer(({children}) => {
    return (<ul className="list-group row" style={{marginBottom: `0px`}}>{children}</ul>);
});

export default SortablePlotsGridComponent;
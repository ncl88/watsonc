import React from 'react';
import {sortableContainer} from 'react-sortable-hoc';

const SortablePlotsGridComponent = sortableContainer(({children}) => {
    return (<ul className="list-group row">{children}</ul>);
});

export default SortablePlotsGridComponent;
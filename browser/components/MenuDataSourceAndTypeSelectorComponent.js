import React from 'react';
import PropTypes from 'prop-types';

/**
 * Creates data source and type selector
 */
class MenuDataSourceAndTypeSelectorComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            opened: false
        }
    }

    render() {

        console.log(`###`, this.state);

        let openedSymbol = (<i className="fas fa-chevron-right"></i>);
        if (this.state.opened) {
            openedSymbol = (<i className="fas fa-chevron-down"></i>);
        }

        return (<div>
            <div>
                <a href="javascript:void(0)" role="tab" data-toggle="tab" data-module-ignore="true" onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.setState({opened: !this.state.opened});
                }}>
                    <i data-container="body" data-toggle="tooltip" data-placement="left" title={__(`Data sources and -types`)} className="fas fa-database fas-material-adapt"></i>
                    <span className="module-title">{__(`Data sources and -types`)}</span>   {openedSymbol}
                </a>
            </div>
            <div>


            </div>
        </div>);
    }
}

MenuDataSourceAndTypeSelectorComponent.propTypes = {
    
};

export default MenuDataSourceAndTypeSelectorComponent;
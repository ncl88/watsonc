import React from 'react';
import PropTypes from 'prop-types';

import withDragDropContext from './withDragDropContext';
import ModalMeasurementComponent from './ModalMeasurementComponent';
import ModalPlotComponent from './ModalPlotComponent';
import ModalFeatureComponent from './ModalFeatureComponent';
import TitleFieldComponent from './../../../../browser/modules/shared/TitleFieldComponent';
import SearchFieldComponent from './../../../../browser/modules/shared/SearchFieldComponent';

const evaluateMeasurement = require('./../evaluateMeasurement');
const measurementIcon = require('./../measurementIcon');

/**
 * Creates borehole parameters display and visualization panel
 */
class ModalComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTabIndex: 0
        }
    }

    setPlots(plots) {
        this.setState({ plots });
    }

    render() {
        let tabs = false;
        if (this.props.features.length > 1) {
            let tabControls = [];
            this.props.features.map((item, index) => {
                tabControls.push(<li key={`modal_tab_${index}`} className={index === this.state.activeTabIndex ? `active` : ``}>
                    <a href="javascript:void(0)" onClick={() => { this.setState({activeTabIndex: index})}}>{item.properties.boreholeno}</a>
                </li>);
            });

            tabs = (<ul className="nav nav-tabs watsonc-modal-tabs" style={{marginBottom: `15px`}}>{tabControls}</ul>)
        }

        return (<div style={{ height: `inherit` }}>
            {tabs}
            <div>
                <ModalFeatureComponent key={`item_${this.state.activeTabIndex}`} feature={this.props.features[this.state.activeTabIndex]} {...this.props}/>
            </div>
        </div>);
    }
}

ModalComponent.propTypes = {
    categories: PropTypes.object.isRequired,
    features: PropTypes.array.isRequired,
    names: PropTypes.object.isRequired,
    limits: PropTypes.object.isRequired,
    initialPlots: PropTypes.array.isRequired,
    onPlotAdd: PropTypes.func.isRequired,
    onAddMeasurement: PropTypes.func.isRequired,
    onDeleteMeasurement: PropTypes.func.isRequired
};

export default withDragDropContext(ModalComponent);
import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { connect } from 'react-redux';
import reduxStore from '../redux/store';

import DataSourceSelector from './DataSourceSelector';
import ChemicalSelectorModal from './ChemicalSelectorModal';

const utils = require('./../utils');

/**
 * Creates data source and type selector
 */
class MenuDataSourceAndTypeSelectorComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    applyParameters() {
        this.props.onApply({
            layers: this.props.selectedLayers,
            chemical: (this.props.selectedChemical ? this.props.selectedChemical : false)
        });
    }

    render() {
        let chemicalName = __(`Not selected`);
        if (this.props.selectedChemical) {
            chemicalName = utils.getChemicalName(this.props.selectedChemical, this.props.categories);
        }

        return (<div>
            <div style={{display: `flex`}}>
                <div style={{flexGrow: `1`}}>
                    <DataSourceSelector layers={this.props.layers}/>
                </div>
                <div style={{flexGrow: `1`}}>
                    <p>{__(`Select datatype`)}</p>
                    <p>{chemicalName} <button
                        type="button"
                        disabled={this.props.selectedLayers.length === 0}
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                            const dialogPrefix = `watsonc-select-chemical-dialog`;
                            const selectChemicalModalPlaceholderId = `${dialogPrefix}-placeholder`;

                            if ($(`#${selectChemicalModalPlaceholderId}`).children().length > 0) {
                                ReactDOM.unmountComponentAtNode(document.getElementById(selectChemicalModalPlaceholderId))
                            }

                            try {
                                ReactDOM.render(<div>
                                    <Provider store={reduxStore}>
                                        <ChemicalSelectorModal onClickControl={() => {
                                            $('#' + dialogPrefix).modal('hide');
                                        }}/>
                                    </Provider>
                                </div>, document.getElementById(selectChemicalModalPlaceholderId));
                            } catch (e) {
                                console.error(e);
                            }

                            $('#' + dialogPrefix).modal({backdrop: `static`});
                        }}><i className="fas fa-edit" title={__(`Edit`)}></i></button>
                    </p>
                </div>
            </div>
            <div>
                <button
                    type="button"
                    disabled={this.props.selectedLayers.length === 0}
                    className="btn btn-raised btn-block btn-primary btn-sm"
                    onClick={this.applyParameters.bind(this)}>{__(`Apply`)}</button>
            </div>
        </div>);
    }
}

MenuDataSourceAndTypeSelectorComponent.propTypes = {};

const mapStateToProps = state => ({
    selectedLayers: state.global.selectedLayers,
    selectedChemical: state.global.selectedChemical,
    categories: state.global.categories
});

export default connect(mapStateToProps)(MenuDataSourceAndTypeSelectorComponent);
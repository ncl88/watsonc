import React from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';

import DataSourceSelector from './DataSourceSelector';

/**
 * Creates data source and type selector
 */
class MenuDataSourceAndTypeSelectorComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            opened: false,
        }
    }

    applyParameters() {
        this.props.onApply({
            layers: this.props.selectedLayers,
            chemical: (this.props.selectedChemical ? this.props.selectedChemical : false)
        });
    }

    render() {
        let openedSymbol = (<i className="fas fa-chevron-right"></i>);
        if (this.state.opened) {
            openedSymbol = (<i className="fas fa-chevron-down"></i>);
        }

        console.log(`### this.props`, this.props.categories);

        let chemicalName = __(`Not selected`);
        if (this.props.selectedChemical) {
            for (let layerName in this.props.categories) {
                for (let groupName in this.props.categories[layerName]) {
                    for (let key in this.props.categories[layerName][groupName]) {
                        if ((key + '') === (this.props.selectedChemical + '')) {
                            chemicalName = this.props.categories[layerName][groupName][key];
                        }
                    }
                }
            }
        }

        return (<div>
            <div>
                <a href="javascript:void(0)" role="tab" data-toggle="tab" data-module-ignore="true" onClick={(e) => {
                    this.setState({opened: !this.state.opened});
                    e.preventDefault();
                    e.stopPropagation();
                }}>
                    <i data-container="body" data-toggle="tooltip" data-placement="left" title={__(`Data sources and -types`)} className="fas fa-database fas-material-adapt"></i>
                    <span className="module-title">{__(`Data sources and -types`)}</span>   {openedSymbol}
                </a>
            </div>
            {this.state.opened ? (<div style={{
                paddingTop: `20px`,
                paddingBottom: `10px`,
                borderBottom: `1px solid #e0e0e0`
            }}>
                <div>
                    <DataSourceSelector
                        layers={this.props.layers}/>
                </div>
                <div style={{paddingTop: `20px`}}>
                    <p>{__(`Select datatype`)}</p>
                    <p>{chemicalName} <button
                        type="button"
                        disabled={this.props.selectedLayers.length === 0}
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                            const selectChemicalModalPlaceholderId = `watsonc-select-chemical-dialog-placeholder`;
                            $(`#${selectChemicalModalPlaceholderId}`).empty();
                            try {
                                ReactDOM.render(<div>
                                    <ChemicalSelector/>
                                </div>, document.getElementById(selectChemicalModalPlaceholderId));
                            } catch (e) {
                                console.error(e);
                            }

                            $('#watsonc-select-chemical-dialog').modal({
                                backdrop: `static`
                            });
                        }}><i className="fas fa-edit"></i></button>
                    </p>
                </div>
                <div style={{width: `220px`}}>
                    <button
                        type="button"
                        disabled={this.props.selectedLayers.length === 0}
                        className="btn btn-raised btn-block btn-primary btn-sm"
                        onClick={this.applyParameters.bind(this)}>{__(`Apply`)}</button>
                </div>
            </div>) : false}
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
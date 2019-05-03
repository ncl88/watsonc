import React from 'react';
import PropTypes from 'prop-types';

import StateSnapshotsDashboard from './../../../../browser/modules/stateSnapshots/components/StateSnapshotsDashboard';
import SearchFieldComponent from './../../../../browser/modules/shared/SearchFieldComponent';
import { LAYER_NAMES, WATER_LEVEL_KEY } from './../constants';

const MODE_INDEX = 0;
const MODE_NEW = 1;
const MODE_SELECT = 2;
const MODE_REGISTER_NEW_DATA = 3;

/**
 * Intro modal window content
 */
class IntroModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            mode: MODE_INDEX,
            categories: this.props.categories,
            layers: this.props.layers,
            selectedLayers: [],
            selectedChemical: false,
            searchTerm: ``
        };

        this.handleSearch = this.handleSearch.bind(this);
        this.toggleLayer = this.toggleLayer.bind(this);
    }

    setCategories(categories) {
        this.setState({ categories });
    }

    handleSearch(searchTerm) {
        this.setState({searchTerm});
    }

    toggleLayer(layerName) {
        let selectedLayers = this.state.selectedLayers.slice(0);
        if (selectedLayers.indexOf(layerName) === -1) {
            selectedLayers.push(layerName);
        } else {
            selectedLayers.splice(selectedLayers.indexOf(layerName), 1);
        }

        this.setState({selectedLayers});
    }

    applyParameters() {
        this.props.onApply({
            layers: this.state.selectedLayers,
            chemical: (this.state.selectedChemical ? this.state.selectedChemical : false)
        });
    }

    generateWaterGroup() {
        return (<div key={`chemical_group_key_water_level`}>
            <div>
                <h5>{__(`Water level`)}</h5>
            </div>
            <div>
                <div>
                    <div style={{ display: `inline-block`}}>
                        <label>
                            <input name="chem_modal" type="radio" checked={this.state.selectedChemical === WATER_LEVEL_KEY}
                                onChange={() => { this.setState({ selectedChemical: WATER_LEVEL_KEY })}}/> <span className="js-chemical-name">{__(`Water level`)}</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>);
    }

    generateChemicalGroups() {
        let chemicalGroupsForLayer = [];
        for (let layerName in this.state.categories) {
            if (layerName === LAYER_NAMES[0]) {
                for (let key in this.state.categories[layerName]) {
                    let chemicalsMarkup = [];
                    for (let key2 in this.state.categories[layerName][key]) {
                        if (this.state.searchTerm === `` || this.state.categories[layerName][key][key2].toLowerCase().indexOf(this.state.searchTerm.toLowerCase()) > -1) {
                            chemicalsMarkup.push(<div key={`chemical_${key2}`}>
                                <div style={{ display: `inline-block`}}>
                                    <label>
                                        <input
                                            name="chem_modal"
                                            type="radio"
                                            checked={this.state.selectedChemical === key2}
                                            onChange={() => { this.setState({ selectedChemical: key2 })}}/> <span className="js-chemical-name">{this.state.categories[layerName][key][key2]}</span>
                                    </label>
                                </div>
                            </div>);
                        }
                    }

                    if (chemicalsMarkup.length > 0) {
                        chemicalGroupsForLayer.push(<div key={`chemical_group_key_${key}`}>
                            <div>
                                <h5>{key}</h5>
                            </div>
                            <div>{chemicalsMarkup}</div>
                        </div>);
                    }
                }
            }
        }

        return chemicalGroupsForLayer;
    }

    render() {
        let layerGroupsList = false;
        if (this.state.mode === MODE_NEW) {
            layerGroupsList = [];

            if (this.state.selectedLayers.length > 0) {
                let waterGroup = this.generateWaterGroup();
                layerGroupsList.push(waterGroup);
            }

            if (this.state.selectedLayers.indexOf(LAYER_NAMES[0]) > -1) {
                let chemicalGroups = this.generateChemicalGroups();
                layerGroupsList = layerGroupsList.concat(chemicalGroups);
            }
        }

        let modalBodyStyle = {
            paddingLeft: `0px`,
            paddingRight: `0px`,
            paddingTop: `35px`,
            paddingBottom: `0px`
        };

        let buttonColumnStyle = {
            paddingTop: `30px`,
            backgroundColor: `rgb(0, 150, 136)`,
            height: `90px`,
        };

        let buttonStyle = {
            color: `white`,
            fontSize: `20px`,
            fontWeight: `600`,
            cursor: `pointer`
        };

        let leftColumnBorder = {borderRadius: `0px 0px 0px 40px`};
        let rightColumnBorder = {borderRadius: `0px 0px 40px 0px`};
        if (this.state.mode !== MODE_INDEX) {
            modalBodyStyle.minHeight = `550px`;
            leftColumnBorder = {};
            rightColumnBorder = {};
        }

        let shadowStyle = {
            boxShadow: `0 6px 8px 0 rgba(0, 0, 0, 0.5), 0 6px 20px 0 rgba(0, 0, 0, 0.19)`,
            zIndex: 1000
        };

        return (<div className="modal-content" style={{minWidth: `1000px`, marginTop: `20%`, borderRadius: `40px`}}>
            <div className="modal-header" style={{color: `#009688`, textAlign: `center`, paddingTop: `35px`}}>
                <h4 className="modal-title" style={{fontSize: `34px`, textTransform: `uppercase`, fontWeight: `700`}}>
                    <span>{__(`Welcome to Calypso`)}</span>
                </h4>
            </div>
            <div className="modal-body" style={modalBodyStyle}>
                <div className="container" style={{padding: `0px`}}>
                    <div className="row-fluid">
                        <div className="col-md-6 text-center"
                            style={Object.assign({}, buttonColumnStyle, leftColumnBorder, (this.state.mode === MODE_NEW ? shadowStyle : {}))}
                            onClick={() => { this.setState({mode: MODE_NEW}) }}>
                            <div style={buttonStyle}>
                                {__(`New project`)}    {this.state.mode === MODE_NEW ? (<i className="fas fa-chevron-down"></i>) : (<i className="fas fa-chevron-right"></i>)}
                            </div>
                        </div>
                        <div className="col-md-6 text-center" style={Object.assign({}, buttonColumnStyle, rightColumnBorder, {
                            borderLeft: `1px solid white`
                        }, (this.state.mode === MODE_SELECT ? shadowStyle : {}))} onClick={() => { this.setState({mode: MODE_SELECT}) }}>
                            <div style={buttonStyle}>
                                {__(`Open existing project`)}    {this.state.mode === MODE_SELECT ? (<i className="fas fa-chevron-down"></i>) : (<i className="fas fa-chevron-right"></i>)}
                            </div>
                        </div>
                    </div>
                </div>

                {this.state.mode === MODE_NEW ? (<div className="container" style={{paddingTop: `20px`}}>
                    <div className="row-fluid">
                        <div className="col-md-6">
                            <p>{__(`Please select at least one layer`)}</p>
                            <div>
                                {this.state.layers.map((item, index) => (<div key={`layer_${index}`}>
                                    <div className="checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={this.state.selectedLayers.indexOf(item.id) !== -1}
                                                onChange={() => { this.toggleLayer(item.id); }}/> {item.title}
                                        </label>
                                    </div>
                                </div>))}
                            </div>
                        </div>
                        <div className="col-md-6">
                            {this.state.selectedLayers.length > 0 ? (<div>
                                <SearchFieldComponent onSearch={this.handleSearch}/>
                                {layerGroupsList.length > 0 ? (<div style={{ maxHeight: `400px`, overflowY: `scroll`}}>{layerGroupsList}</div>) : (<p>{__(`Nothing found`)}</p>)}
                            </div>) : false}
                        </div>
                    </div>
                </div>) : false}

                {this.state.mode === MODE_SELECT ? (<div className="container" style={{paddingTop: `20px`}}>
                    <div className="row-fluid">
                        <div className="col-md-12">
                            <StateSnapshotsDashboard readOnly={true} showStateSnapshotTypes={false} playOnly={true} {...this.props} onStateSnapshotApply={this.props.onClose}/>
                        </div>
                    </div>
                </div>) : false}
            </div>

            <div className="modal-footer" style={{padding: `0px`}}>
                {this.state.mode === MODE_NEW ? (<div className="container">
                    <div className="row-fluid">
                        <div className="col-md-12" style={{textAlign: `right`, paddingTop: `10px`, paddingBottom: `10px`}}>
                            <button
                                type="button"
                                disabled={this.state.selectedLayers.length === 0}
                                className="btn btn-raised btn-primary"
                                data-dismiss="modal"
                                onClick={this.applyParameters.bind(this)}>{__(`Continue`)}<div className="ripple-container"></div></button>
                        </div>
                    </div>
                </div>) : false}
            </div>
        </div>);
    }
}

IntroModal.propTypes = {
    layers: PropTypes.array.isRequired,
    categories: PropTypes.object.isRequired,
    onApply: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};

export default IntroModal;
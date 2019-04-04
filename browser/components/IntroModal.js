import React from 'react';
import PropTypes from 'prop-types';

import StateSnapshotsDashboard from './../../../../browser/modules/stateSnapshots/components/StateSnapshotsDashboard';
import SearchFieldComponent from './../../../../browser/modules/shared/SearchFieldComponent';

const MODE_INDEX = 0;
const MODE_NEW = 1;
const MODE_SELECT = 2;

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

    render() {

        console.log(`### state`, this.state);

        let layerGroupsList = false;

        if (this.state.mode === MODE_NEW) {
            layerGroupsList = [];
            for (let layerName in this.state.categories) {
                if (this.state.selectedLayers.indexOf(layerName) > -1) {
                    let chemicalGroupsForLayer = [];
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

                    let humanReadableLayerName = layerName;
                    this.state.layers.map(item => {
                        if (item.id === layerName) {
                            humanReadableLayerName = item.title;
                        }
                    });

                    if (chemicalGroupsForLayer.length > 0) {
                        layerGroupsList.push(<div key={`layer_key_${layerName}`}>
                            <div>
                                <h4>{humanReadableLayerName}</h4>
                            </div>
                            <div style={{ maxHeight: `400px`, overflowY: `scroll`}}>{chemicalGroupsForLayer}</div>
                        </div>);
                    }
                }
            }
        }

        return (<div className="modal-content" style={{minHeight: `400px`, minWidth: `1000px`, marginTop: `10%`}}>
            <div className="modal-header">
                <h4 className="modal-title">
                    {this.state.mode === MODE_INDEX ? (<span>{__(`Get started`)}</span>) : false}
                    {this.state.mode === MODE_NEW ? (<span>{__(`New project`)}</span>) : false}
                    {this.state.mode === MODE_SELECT ? (<span>{__(`Open existing project`)}</span>) : false}

                    {this.state.mode === MODE_NEW || this.state.mode === MODE_SELECT ? (<button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => { this.setState({mode: MODE_INDEX}) }}>
                        <i className="fas fa-arrow-left"></i>   {__(`Back to main menu`)}
                    </button>) : false}
                </h4>
            </div>
            <div className="modal-body" style={{minHeight: `400px`}}>
                {this.state.mode === MODE_INDEX ? (<div className="container">
                    <div className="row-fluid">
                        <div className="col-md-6 text-center" style={{paddingTop: `70px`}}>
                            <button type="button" className="btn btn-primary btn-lg" onClick={() => { this.setState({mode: MODE_NEW}) }}>
                                <i className="fas fa-plus"></i>   {__(`New project`)}
                            </button>
                        </div>
                        <div className="col-md-6 text-center" style={{paddingTop: `70px`}}>
                            <button type="button" className="btn btn-primary btn-lg" onClick={() => { this.setState({mode: MODE_SELECT}) }}>
                                <i className="fas fa-folder-open"></i>   {__(`Open existing project`)}
                            </button>
                        </div>
                    </div>
                </div>) : false}

                {this.state.mode === MODE_NEW ? (<div className="container">
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
                                {layerGroupsList.length > 0 ? layerGroupsList : (<p>{__(`Nothing found`)}</p>)}
                            </div>) : false}
                        </div>
                    </div>
                </div>) : false}

                {this.state.mode === MODE_SELECT ? (<div className="container">
                    <div className="row-fluid">
                        <div className="col-md-12">
                            <StateSnapshotsDashboard readOnly={true} playOnly={true} {...this.props} onStateSnapshotApply={this.props.onClose}/>
                        </div>
                    </div>
                </div>) : false}
            </div>

            <div className="modal-footer">
                {this.state.mode === MODE_NEW ? (<div className="container">
                    <div className="row-fluid">
                        <div className="col-md-12" style={{ textAlign: `right` }}>
                            <button
                                type="button"
                                disabled={this.state.selectedLayers.length === 0}
                                className="btn btn-primary"
                                data-dismiss="modal"
                                onClick={this.applyParameters.bind(this)}>{__(`Continue without selecting chemical`)}<div className="ripple-container"></div></button>
                            <button
                                type="button"
                                disabled={this.state.selectedLayers.length === 0 || this.state.selectedChemical === false}
                                className="btn btn-primary"
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
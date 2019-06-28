import React from 'react';
import { connect } from 'react-redux';

import SearchFieldComponent from './../../../../browser/modules/shared/SearchFieldComponent';
import { selectChemical } from '../redux/actions';

const uuidv4 = require('uuid/v4');

/**
 * Chemical selector
 */
class ChemicalSelector extends React.Component {
    constructor(props) {
        super(props);

        this.state = {searchTerm: ``};
        this.handleSearch = this.handleSearch.bind(this);
    }

    generateWaterGroup(runId) {
        return (<div key={`chemical_group_key_water_level`}>
            <div>
                <h5>{__(`Water level`)}</h5>
            </div>
            <div>
                <div>
                    <div style={{ display: `inline-block`}}>
                        <label>
                            <input
                                name={`chem_modal_${runId}`}
                                type="radio"
                                checked={this.props.selectedChemical === WATER_LEVEL_KEY}
                                onChange={() => { this.props.selectChemical(WATER_LEVEL_KEY)}}/> <span className="js-chemical-name">{__(`Water level`)}</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>);
    }

    generateChemicalGroups(runId) {
        let chemicalGroupsForLayer = [];
        for (let layerName in this.props.categories) {
            if (layerName === LAYER_NAMES[0]) {
                for (let key in this.props.categories[layerName]) {
                    let chemicalsMarkup = [];
                    for (let key2 in this.props.categories[layerName][key]) {
                        if (this.state.searchTerm === `` || this.props.categories[layerName][key][key2].toLowerCase().indexOf(this.state.searchTerm.toLowerCase()) > -1) {
                            chemicalsMarkup.push(<div key={`chemical_${key2}`}>
                                <div style={{ display: `inline-block`}}>
                                    <label>
                                        <input
                                            name={`chem_modal_${runId}`}
                                            type="radio"
                                            checked={this.props.selectedChemical === key2}
                                            onChange={() => { this.props.selectChemical(key2)}}/> <span className="js-chemical-name">{this.props.categories[layerName][key][key2]}</span>
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

    handleSearch(searchTerm) {
        this.setState({searchTerm});
    }

    render() {
        let runId = uuidv4();

        let layerGroupsList = [];
        if (this.props.selectedLayers.length > 0) {
            let waterGroup = this.generateWaterGroup(runId);
            layerGroupsList.push(waterGroup);
        }

        if (this.props.selectedLayers.indexOf(LAYER_NAMES[0]) > -1) {
            let chemicalGroups = this.generateChemicalGroups(runId);
            layerGroupsList = layerGroupsList.concat(chemicalGroups);
        }

        return (<div>
            {this.props.selectedLayers.length > 0 ? (<div>
                <SearchFieldComponent onSearch={this.handleSearch}/>
                {layerGroupsList.length > 0 ? (<div style={{ maxHeight: `400px`, overflowY: `scroll`}}>{layerGroupsList}</div>) : (<p>{__(`Nothing found`)}</p>)}
            </div>) : false}
        </div>);
    }
}

ChemicalSelector.defaultProps = {
    useLocalSelectedChemical: false,
    localSelectedChemical: false
};

const mapStateToProps = state => ({
    categories: state.global.categories,
    selectedLayers: state.global.selectedLayers,
    selectedChemical: state.global.selectedChemical
});

const mapDispatchToProps = dispatch => ({
    selectChemical: (key) => dispatch(selectChemical(key)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChemicalSelector);
import React from 'react';
import PropTypes from 'prop-types';

import SearchFieldComponent from './../../../../browser/modules/shared/SearchFieldComponent';

/**
 * Chemical selector
 */
class ChemicalSelector extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            searchTerm: ``
        };

        this.handleSearch = this.handleSearch.bind(this);
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
                                            name="chem_modal"
                                            type="radio"
                                            checked={this.state.selectedChemical === key2}
                                            onChange={() => { this.setState({ selectedChemical: key2 })}}/> <span className="js-chemical-name">{this.props.categories[layerName][key][key2]}</span>
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

        console.log(`###`, this.state);

        return (<div>
            {this.state.selectedLayers.length > 0 ? (<div>
                <SearchFieldComponent onSearch={this.handleSearch}/>
                {layerGroupsList.length > 0 ? (<div style={{ maxHeight: `400px`, overflowY: `scroll`}}>{layerGroupsList}</div>) : (<p>{__(`Nothing found`)}</p>)}
            </div>) : false}
        </div>);
    }
}

ChemicalSelector.propTypes = {
    selectedLayers: PropTypes.array.isRequired,
    categories: PropTypes.object.isRequired,
};

export default ChemicalSelector;
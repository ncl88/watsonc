import React from 'react';
import PropTypes from 'prop-types';

/**
 * Data source selector
 */
class DataSourceSelector extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {

        const generateLayerRecord = (key, item) => {
            return (<div key={key}>
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            checked={this.props.selectedLayers.indexOf(item.originalLayerKey + (item.additionalKey ? `#${item.additionalKey}` : ``)) !== -1}
                            onChange={() => { this.props.onToggleLayer(item.originalLayerKey, item.additionalKey); }}/> {item.title}
                    </label>
                </div>
            </div>);
        };

        console.log(`###`, this.state);

        return (<div>
            <p>{__(`Please select at least one layer`)}</p>
            <div>
                <h4>{__(`Groundwater`)}</h4>
                {generateLayerRecord(`key0`, this.props.layers[0])}
                {generateLayerRecord(`key1`, this.props.layers[1])}
                <h4>{__(`Streams`)}</h4>
                {generateLayerRecord(`key2`, this.props.layers[2])}
                <h4>{__(`Rain`)}</h4>
                {generateLayerRecord(`key3`, this.props.layers[3])}
            </div>
        </div>);
    }
}

DataSourceSelector.propTypes = {
    layers: PropTypes.array.isRequired,
    selectedLayers: PropTypes.array.isRequired,
    onToggleLayer: PropTypes.func.isRequired,
};

export default DataSourceSelector;
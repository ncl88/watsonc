import React from 'react';
import { connect } from 'react-redux';

import ChemicalSelector from './ChemicalSelector';
import { selectChemical } from '../redux/actions';

/**
 * Chemical selector
 */
class ChemicalSelectorModal extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let disabled = false;
        if (this.props.useLocalSelectedChemical === true) {
            disabled = (this.props.localSelectedChemical === false || this.props.localSelectedChemical === `false`);
        } else {
            disabled = (this.props.selectedChemical === false || this.props.selectedChemical === `false`);
        }

        return (<div className="modal-content">
            <div className="modal-header">
                <h4 className="modal-title">
                    <span>{__(`Select datatype`)}</span>
                </h4>
            </div>
            <div className="modal-body">
                <div className="container">
                    <ChemicalSelector
                        excludeWaterLevel={true}
                        useLocalSelectedChemical={this.props.useLocalSelectedChemical}
                        localSelectedChemical={this.props.localSelectedChemical}
                        localSelectChemical={this.props.onClickControl}/>
                </div>
                <div style={{textAlign: `right`}}>
                    <button
                        type="button"
                        disabled={disabled}
                        className="btn btn-raised btn-primary"
                        data-dismiss="modal"
                        onClick={this.props.onClickControl}>{__(`Continue`)}</button>
                    {this.props.onCancelControl ? (<button
                        type="button"
                        className="btn btn-raised"
                        data-dismiss="modal"
                        onClick={this.props.onCancelControl}>{__(`Cancel`)}</button>) : false}
                </div>
            </div>
        </div>);
    }
}

ChemicalSelectorModal.defaultProps = {
    useLocalSelectedChemical: false,
    localSelectedChemical: false
};

const mapStateToProps = state => ({
    selectedChemical: state.global.selectedChemical
});

const mapDispatchToProps = dispatch => ({
    selectChemical: (key) => dispatch(selectChemical(key)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChemicalSelectorModal);
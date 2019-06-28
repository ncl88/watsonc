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
        return (<div className="modal-content">
            <div className="modal-header">
                <h4 className="modal-title">
                    <span>{__(`Select datatype`)}</span>
                </h4>
            </div>
            <div className="modal-body">
                <div className="container">
                    <ChemicalSelector
                        useLocalSelectedChemical={this.props.useLocalSelectedChemical}
                        localSelectedChemical={this.props.localSelectedChemical}/>
                </div>
                <div style={{textAlign: `right`}}>
                    <button
                        type="button"
                        disabled={() => {
                            if (this.props.useLocalSelectedChemical === true) {
                                return this.props.localSelectedChemical === false || this.props.localSelectedChemical === `false`;
                            } else {
                                return this.props.selectedChemical === false || this.props.selectedChemical === `false`;
                            }
                        }}
                        className="btn btn-raised btn-primary"
                        data-dismiss="modal"
                        onClick={this.props.onClickControl}>{__(`Continue`)}</button>
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
import React from 'react';

/**
 * Text field modal
 */
class TextFieldModal extends React.Component {
    constructor(props) {

        console.log(`### creating TextFieldModal`);


        super(props);
        this.state = {text: ``};
    }

    render() {
        return (<div className="modal-content">
            <div className="modal-header">
                <h4 className="modal-title">
                    <span>{this.props.title}</span>
                </h4>
            </div>
            <div className="modal-body">
                <div className="container">
                    <input
                        className="form-control"
                        onChange={event => {
                            this.setState({text: event.target.value});
                        }}/>
                </div>
                <div style={{textAlign: `right`}}>
                    <button
                        type="button"
                        disabled={this.state.text.length === 0}
                        className="btn btn-raised btn-primary"
                        data-dismiss="modal"
                        onClick={() => {
                            this.props.onClickControl(this.state.text);
                        }}>{__(`Continue`)}</button>
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

export default TextFieldModal;
import React from 'react';
import PropTypes from 'prop-types';
import { DragSource } from 'react-dnd';

/**
 * Measurement component
 */
class ModalMeasurementComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return this.props.connectDragSource(<div
            className="btn btn-sm btn-primary js-plotted-property"
            data-gid="{this.props.gid}"
            data-key="{this.props.itemKey}"
            data-intake-index="{this.props.intakeIndex}"
            style={{
                padding: `4px`,
                margin: `1px`,
                zIndex: `1000`
            }}>
            <i className="fa fa-arrows-alt"></i> {this.props.title} (#{this.props.intakeIndex + 1})
        </div>);
    }
}

const measurementSource = {
    beginDrag(props) {
        return {
            gid: props.gid,
            itemKey: props.itemKey,
            intakeIndex: props.intakeIndex,
            onAddMeasurement: props.onAddMeasurement
        };
    }
};

const collect = (connect, monitor) => {
    return {
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging()
    }
};

ModalMeasurementComponent.propTypes = {
    gid: PropTypes.number.isRequired,
    itemKey: PropTypes.string.isRequired,
    intakeIndex: PropTypes.number.isRequired,
    onAddMeasurement: PropTypes.func.isRequired,
};

export default DragSource(`MEASUREMENT`, measurementSource, collect)(ModalMeasurementComponent);
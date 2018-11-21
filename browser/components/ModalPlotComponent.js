import React from 'react';
import { DropTarget } from 'react-dnd';

/**
 * Plot component
 */
class ModalPlotComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let removeButtons = [];
        this.props.plot.measurements.map(measurement => {
            let measurementDisplayTitle = measurement;
            let splitMeasurementId = measurement.split(':');
            let gid = parseInt(splitMeasurementId[0]);

            if (this.props.dataSource && this.props.dataSource.length > 0) {
                this.props.dataSource.map(item => {
                    if (item.properties.gid === gid) {
                        measurementDisplayTitle = (`${item.properties.boreholeno}, ${JSON.parse(item.properties[splitMeasurementId[1]]).title} (#${ (parseInt(splitMeasurementId[2]) + 1) })`);
                        return false;
                    }
                });
            }

            removeButtons.push(<div key={`remove_measurement_` + splitMeasurementId[1] + `_` + splitMeasurementId[2]}>
                <button
                    type="button"
                    className="btn btn-xs btn-primary js-delete-measurement"
                    data-plot-id="{plot.id}"
                    data-gid="{gid}"
                    data-key="{splitMeasurementId[1]}"
                    data-intake-index="{splitMeasurementId[2]}"
                    style={{ padding: `4px`, margin: `1px` }}>
                    <i className="fa fa-remove"></i> {measurementDisplayTitle}
                </button>
            </div>);
        });

        return this.props.connectDropTarget(<div
            className="well well-sm js-plot"
            data-id="{this.props.plot.id}"
            style={{
                marginBottom: `4px`,
                boxShadow: `0 4px 12px 0 rgba(0, 0, 0, 0.2), 0 3px 10px 0 rgba(0, 0, 0, 0.19)`
            }}>
            <div>{this.props.plot.title}</div>
            <div>{removeButtons}</div>
        </div>);
    }
}

const plotTarget = {
    drop(props, monitor) {
        let item = monitor.getItem();
        item.onAddMeasurement(props.plot.id, item.gid, item.itemKey, item.intakeIndex);
    }
};
  

function collect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver()
    };
}
  

export default DropTarget(`MEASUREMENT`, plotTarget, collect)(ModalPlotComponent);
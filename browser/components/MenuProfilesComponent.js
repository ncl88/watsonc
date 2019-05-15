import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import Slider from 'rc-slider';

import LoadingOverlay from './../../../../browser/modules/shared/LoadingOverlay';
const wkt = require('terraformer-wkt-parser');

const STEP_NOT_READY = 0;
const STEP_BEING_DRAWN = 1;
const STEP_READY_TO_LOAD = 2;

let drawnItems = new L.FeatureGroup(), embedDrawControl = false;

/**
 * Component for creating profiles
 */
class MenuProfilesComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            showDrawingForm: false,
            step: STEP_NOT_READY,
            bufferedProfile: false,
            profileBottom: -100,
            buffer: 40,
        };

        this.search = this.search.bind(this);
        this.startDrawing = this.startDrawing.bind(this);
        this.stopDrawing = this.stopDrawing.bind(this);

        props.cloud.get().map.addLayer(drawnItems);

        this.bufferSliderRef = React.createRef();
        this.bufferValueRef = React.createRef();
    }

    search() {
        this.setState({step: STEP_NOT_READY}, () => {
            this.stopDrawing();
            this.setState({loading: true});
            axios.post(`/api/extension/watsonc`, {
                data: wkt.convert(this.state.bufferedProfile),
                bufferRadius: this.state.buffer,
                profileDepth: this.state.profileBottom
            }).then(response => {
                this.setState({loading: false});
                console.log(response);
            }).catch(error => {
                this.setState({loading: false});
                console.log(`### error`, error);
            });
        });
    }

    startDrawing() {
        drawnItems.eachLayer(layer => {
            if (layer && layer.feature && layer.feature.properties && layer.feature.properties.type ===`polyline`) {
                drawnItems.removeLayer(layer);
            }
        });

        if (embedDrawControl) embedDrawControl.disable();
        embedDrawControl = new L.Draw.Polyline(this.props.cloud.get().map);
        embedDrawControl.enable();

        embedDrawControl._map.off('draw:created');
        embedDrawControl._map.on('draw:created', e => {
            if (embedDrawControl) embedDrawControl.disable();

            let coord, layer = e.layer;

            let primitive = layer.toGeoJSON();
            if (primitive) {
                if (typeof layer.getBounds !== "undefined") {
                    coord = layer.getBounds().getSouthWest();
                } else {
                    coord = layer.getLatLng();
                }

                // Get utm zone
                var zone = utmZone.getZone(coord.lat, coord.lng);
                var crss = {
                    "proj": "+proj=utm +zone=" + zone + " +ellps=WGS84 +datum=WGS84 +units=m +no_defs",
                    "unproj": "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"
                };

                var reader = new jsts.io.GeoJSONReader();
                var writer = new jsts.io.GeoJSONWriter();
                var geom = reader.read(reproject.reproject(primitive, "unproj", "proj", crss));
                var buffer4326 = reproject.reproject(writer.write(geom.geometry.buffer(this.state.buffer)), "proj", "unproj", crss);

                L.geoJson(buffer4326, {
                    "color": "#ff7800",
                    "weight": 1,
                    "opacity": 1,
                    "fillOpacity": 0.1,
                    "dashArray": '5,3'
                }).addTo(drawnItems);

                this.setState({
                    step: STEP_READY_TO_LOAD,
                    bufferedProfile: buffer4326
                });
            }
        });
    }

    stopDrawing() {
        if (drawnItems) drawnItems.clearLayers();
        if (embedDrawControl) embedDrawControl.disable();
    }

    render() {
        let overlay = false;
        if (this.state.loading) {
            overlay = (<LoadingOverlay/>);
        }

        return (<div id="profile-drawing-buffer" style={{
            borderBottom: `1px solid lightgray`,
            position: `relative`
        }}>
            {overlay}
            <div style={{fontSize: `20px`, padding: `14px`}}>
                <a href="javascript:void(0)" onClick={() => { this.setState({showDrawingForm: !this.state.showDrawingForm})}}>{__(`Create new profile`)} 
                    {this.state.showDrawingForm ? (<i className="material-icons">keyboard_arrow_down</i>) : (<i className="material-icons">keyboard_arrow_right</i>)}
                </a>
           </div>
           {this.state.showDrawingForm ? (<div className="container">
                <div className="row">
                    <div className="col-md-4" style={{paddingTop: `12px`}}>
                        <p>{__(`Adjust buffer`)}</p>
                    </div>
                    <div className="col-md-5" style={{paddingTop: `14px`}}>
                        <Slider value={this.state.buffer ? parseInt(this.state.buffer) : 0} min={0} max={500} onChange={(value) => { this.setState({buffer: value}); }}/>
                    </div>
                    <div className="col-md-3">
                        <input
                            type="number"
                            className="form-control"
                            onChange={(event) => { this.setState({buffer: event.target.value}); }}
                            value={this.state.buffer}/>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-4" style={{paddingTop: `12px`}}>
                        <p>{__(`Adjust profile bottom`)}</p>
                    </div>
                    <div className="col-md-8">
                        <input
                            type="number"
                            className="form-control"
                            onChange={(event) => { this.setState({profileBottom: event.target.value}); }}
                            value={this.state.profileBottom}/>
                    </div>
                </div>

               <div className="row">
                    <div className="col-md-6" style={{textAlign: `center`}}>
                        {this.state.step === STEP_READY_TO_LOAD || this.state.step === STEP_BEING_DRAWN ? (<a
                            href="javascript:void(0)"
                            className="btn btn-primary"
                            onClick={() => {
                                this.setState({
                                    step: STEP_NOT_READY,
                                    bufferedProfile: false
                                }, () => {
                                    this.stopDrawing();
                                });
                        }}><i className="material-icons">block</i> {__(`Cancel`)}</a>) : (<a
                            href="javascript:void(0)"
                            className="btn btn-primary"
                            onClick={() => {
                                this.setState({step: STEP_BEING_DRAWN}, () => {
                                    this.startDrawing();
                                });
                        }}><i className="material-icons">linear_scale</i> {__(`Draw profile`)}</a>)}
                    </div>
                    <div className="col-md-6" style={{textAlign: `center`}}>
                        <a
                            href="javascript:void(0)"
                            className="btn"
                            disabled={this.state.step !== STEP_READY_TO_LOAD}
                            onClick={() => {
                                this.search();
                            }}>{__(`Continue`)}</a>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <div className="js-results"></div>
                    </div>
               </div>
           </div>) : false}
       </div>);
    }
}

MenuProfilesComponent.propTypes = {
    cloud: PropTypes.any.isRequired,
};

export default MenuProfilesComponent;
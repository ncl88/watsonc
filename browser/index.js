/**
 * @fileoverview Description of file, its uses and information
 * about its dependencies.
 */

'use strict';

/**
 *
 * @type {*|exports|module.exports}
 */
var cloud;

/**
 *
 * @type {*|exports|module.exports}
 */
var switchLayer;

/**
 *
 * @type {*|exports|module.exports}
 */
var backboneEvents;

/**
 *
 * @type {*|exports|module.exports}
 */
var utils;

var layerTree;

var React = require('react');

var ReactDOM = require('react-dom');

var exId = "watsonc";

/**
 *
 * @type {{set: module.exports.set, init: module.exports.init}}
 */
module.exports = module.exports = {
    set: function (o) {
        cloud = o.cloud;
        switchLayer = o.switchLayer;
        backboneEvents = o.backboneEvents;
        layerTree = o.layerTree;
        utils = o.utils;
        return this;
    },
    init: function () {

        utils.createMainTab(exId, __("Boreholes"), __("Info"), require('./../../../browser/modules/height')().max);


        var parent = this,
            layerNames = ["v:public.boreholes_time_series"];

        // Disable automatic creation of layer tree. We need to set "On" functions first
        //layerTree.setAutomatic(true);

        layerNames.map(function (layerName) {

            layerTree.setOnEachFeature(layerName, function (feature, layer) {
                layer.on("click", function () {
                    console.log(feature.properties.boreholeno);

                    let html = "Bore hole no: " + feature.properties.boreholeno + "<br>"+
                        "Water level: " + feature.properties.watlevmsl;

                    layer.bindPopup(html, {
                        className: "custom-popup",
                        autoPan: true,
                        closeButton: true
                    }).openPopup();

                    setTimeout(function(){
                        $(".leaflet-popup-content").css("width", "200px");

                    }, 200);



                });
            });

            layerTree.setOnSelect(layerName, function (id, layer) {

                console.log(layer.feature.properties.boreholeno);
            });

            layerTree.setStyle(layerName,
                {
                    weight: 5,
                    color: '#ff0000',
                    dashArray: '',
                    fillOpacity: 0.2
                }
            );

            layerTree.setPointToLayer(layerName, function (feature, latlng) {
                    return L.circleMarker(latlng);

                }
            );
        });

        //layerTree.createLayerTree();


    }

};

class Borehole extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
    }


    render() {
        return (
            <div>
                <div>boreholeno: {this.props.boreholeno}</div>
                <div>timeofmeas: {this.props.timeofmeas}</div>
                <div>watlevmsl: {this.props.watlevmsl}</div>
                <div>maksoftop: {this.props.maksoftop}</div>
                <div>minofbottom: {this.props.minofbottom}</div>
                <div>drilldepth: {this.props.drilldepth}</div>
                <div>zdvr90: {this.props.zdvr90}</div>
            </div>
        );
    }
}


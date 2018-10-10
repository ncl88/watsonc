var layerTree, utils;

var exId = "watsonc_test";


module.exports = {
    set: function (o) {
        layerTree = o.layerTree;
        utils = o.utils;

        return this;
    },

    init: function () {
        utils.createMainTab(exId, __("watsonc_test"), __("Info"), require('./../../../browser/modules/height')().max);
        var dom = "<button id='watsonc_test_btn'>Klorid</button>";
        $("#watsonc_test").append(dom);

        $("#watsonc_test_btn").click(
            function () {
                let store = layerTree.getStores()["v:geus.boreholes_time_series_with_chemicals"];

                store.layer.eachLayer(function (layer) {
                    let feature = layer.feature;

                    let chem = "chlorid";
                    let limits = {};
                    let maxColor;
                    let latestColor;
                    let iconSize;
                    let iconAnchor;
                    limits[chem] = [50, 100];

                    let json;

                    try {
                        json = JSON.parse(feature.properties[chem]);
                    } catch (e) {
                        return L.circleMarker(layer.getLatLng());

                    }


                    if (feature.properties[chem] !== null) {

                        let unit = json.unit;

                        // Find latest value
                        let intakes = json.timeOfMeasurement.length;
                        let currentValue;
                        let latestValue = moment("0001-01-01T00:00:00+00:00", "YYYY-MM-DDTHH:mm:ssZZ");
                        let latestPosition = {};
                        let latestMeasurement;

                        for (let i = 0; i < intakes; i++) {
                            let length = json.timeOfMeasurement[i].length - 1;
                            currentValue = moment(json.timeOfMeasurement[i][length], "YYYY-MM-DDTHH:mm:ssZZ");
                            if (currentValue.isAfter(latestValue)) {
                                latestValue = currentValue;
                                latestMeasurement = json.measurements[i][length];
                                latestPosition = {
                                    intake: i,
                                    measurement: length
                                }
                            }
                        }

                        // Find Highest value
                        intakes = json.measurements.length;
                        let maxMeasurement = 0;

                        for (let i = 0; i < intakes; i++) {
                            let length = json.measurements[i].length;
                            for (let u = 0; u < length; u++) {
                                currentValue = json.measurements[i][u];
                                if (!(latestPosition.intake === i && latestPosition.measurement === u) && currentValue > maxMeasurement) {
                                    maxMeasurement = currentValue;
                                }
                            }

                        }

                        // console.log("-----------------------");
                        // console.log(latestMeasurement);
                        // console.log(latestPosition);
                        // console.log(maxMeasurement);
                        // console.log(json);


                        layer.bindTooltip(`
                            <p>${chem} (${unit})</p>
                            <p>Max: ${maxMeasurement}</p>
                            <p>Seneste: ${latestMeasurement}</p>
                        `).openTooltip();

                        maxColor = maxMeasurement === 0 ? "#ffffff" : maxMeasurement <= limits[chem][0] ? "#00ff00" : maxMeasurement > limits[chem][0] && maxMeasurement <= limits[chem][1] ? "#ffff00" : "#ff0000";
                        latestColor = latestMeasurement <= limits[chem][0] ? "#00ff00" : latestMeasurement > limits[chem][0] && latestMeasurement <= limits[chem][1] ? "#ffff00" : "#ff0000";
                        iconSize = [30, 30];
                        iconAnchor = [15, 15];

                    } else {
                        maxColor = latestColor ="#cccccc";
                        iconSize = [20, 20];
                        iconAnchor = [10, 10];
                    }

                    var svg = `<svg
                           xmlns:dc="http://purl.org/dc/elements/1.1/"
                           xmlns:cc="http://creativecommons.org/ns#"
                           xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                           xmlns:svg="http://www.w3.org/2000/svg"
                           xmlns="http://www.w3.org/2000/svg"
                           id="svg8"
                           version="1.1"
                           viewBox="0 0 84.688354 84.688354"
                           height="84.688354"
                           width="84.688354">
                          <defs
                             id="defs2" />
                          <g
                             transform="translate(-61.786713,-90.408127)"
                             id="layer1">
                            <path
                               style=";stroke-width:0.26458332;stroke:#000000;stroke-opacity:1;fill:${maxColor};stroke-width:0.26458332"
                               d="m 104.13089,175.09648 a 42.344177,42.344177 0 0 1 -36.671133,-21.17209 42.344177,42.344177 0 0 1 0,-42.34417 42.344177,42.344177 0 0 1 36.671133,-21.172093 l 0,42.344173 z"
                               id="path3729" />
                            <path
                               transform="scale(-1,1)"
                               style=";stroke-width:0.26458332;stroke:#000000;stroke-opacity:1;fill:${latestColor};stroke-width:0.26458332"
                               d="m -104.13089,175.09648 a 42.344177,42.344177 0 0 1 -36.67113,-21.17209 42.344177,42.344177 0 0 1 0,-42.34417 42.344177,42.344177 0 0 1 36.67113,-21.172093 l 0,42.344173 z"
                               id="path3729-3" />
                          </g>
                    </svg>`;

                    var iconUrl = 'data:image/svg+xml;base64,' + btoa(svg);
                    var icon = L.icon({
                        iconUrl: iconUrl,
                        iconSize: iconSize,
                        iconAnchor: iconAnchor,
                        popupAnchor: iconAnchor,
                    });

                    layer.setIcon(icon);


                })
            }
        )




    }
};
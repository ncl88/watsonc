import moment from 'moment';

const evaluate = (json, limits, chem) => {
    let maxMeasurement = 0;
    let maxMeasurementIntakes = [];
    let latestMeasurement = 0;
    let latestMeasurementIntakes = [];

    // Find latest value
    let intakes = json.timeOfMeasurement.length;
    let currentValue;
    let latestValue = moment("0001-01-01T00:00:00+00:00", "YYYY-MM-DDTHH:mm:ssZZ");
    let latestPosition = {};

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

        latestMeasurementIntakes[i] = json.measurements[i][length];
    }

    // Find Highest value
    let numberOfIntakes = json.measurements.length;
    maxMeasurement = 0;
    maxMeasurementIntakes = [];
    
    for (let i = 0; i < numberOfIntakes; i++) {
        maxMeasurementIntakes[i] = 0;
        let length = json.measurements[i].length;
        for (let u = 0; u < length; u++) {
            currentValue = json.measurements[i][u];
            if (!(latestPosition.intake === i && latestPosition.measurement === u) && currentValue > maxMeasurement) {
                maxMeasurement = currentValue;
            }
            if (currentValue > maxMeasurementIntakes[i]) {
                maxMeasurementIntakes[i] = currentValue;
            }
        }
    }

    const green = "rgb(16, 174, 140)";
    const yellow = "rgb(247, 168, 77)";
    const red = "rgb(252, 60, 60)";
    const white = "rgb(255, 255, 255)";

    let chemicalLimits = (limits[chem] ? limits[chem]: [0, 0]);

    let maxColor, latestColor;
    if (chem === "_watlevmsl") {
        maxColor = maxMeasurement === 0 ? white : "#00aaff";
        latestColor = "#00aaff";
    } else {
        maxColor = maxMeasurement === 0 ? "#ffffff" : maxMeasurement <= chemicalLimits[0] ? green : maxMeasurement > chemicalLimits[0] && maxMeasurement <= chemicalLimits[1] ? yellow : red;
        latestColor = latestMeasurement <= chemicalLimits[0] ? green : latestMeasurement > chemicalLimits[0] && latestMeasurement <= chemicalLimits[1] ? yellow : red;
    }

    return {
        numberOfIntakes,
        latestMeasurementIntakes,
        maxMeasurementIntakes,
        maxColor,
        latestColor,
    };
};

module.exports = evaluate;

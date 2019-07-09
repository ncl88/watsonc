import moment from 'moment';

const evaluate = (json, limits, chem, specificIntake = false) => {
    let maxMeasurement = 0;
    let maxMeasurementIntakes = [];
    let latestMeasurement = 0;
    let latestMeasurementIntakes = [];

    // Find latest value
    let intakes = json.timeOfMeasurement.length;
    let currentValue;
    let latestValue = moment("0001-01-01T00:00:00+00:00", "YYYY-MM-DDTHH:mm:ssZZ");
    let latestPosition = {};

    const generateLatestMeasurement = (intake) => {
        let length = json.timeOfMeasurement[intake].length - 1;
        currentValue = moment(json.timeOfMeasurement[intake][length], "YYYY-MM-DDTHH:mm:ssZZ");

        // @todo Check the special symbol
        if (currentValue.isAfter(latestValue)) {
            latestValue = currentValue;
            latestMeasurement = json.measurements[intake][length];
            latestPosition = {
                intake,
                measurement: length
            }
        }

        latestMeasurementIntakes[intake] = json.measurements[intake][length];
    }

    if (specificIntake !== false) {
        generateLatestMeasurement(specificIntake);
    } else {
        for (let i = 0; i < intakes; i++) {
            generateLatestMeasurement(i);
        }
    }

    // Find Highest value
    let numberOfIntakes = json.measurements.length;
    maxMeasurement = 0;
    maxMeasurementIntakes = [];

    const generateMaxMeasurement = (intake) => {
        maxMeasurementIntakes[intake] = 0;
        let length = json.measurements[intake].length;
        for (let u = 0; u < length; u++) {
            currentValue = json.measurements[intake][u];
            if (!(latestPosition.intake === intake && latestPosition.measurement === u) && currentValue > maxMeasurement) {
                maxMeasurement = currentValue;
            }

            // @todo Check the special symbol
            if (currentValue > maxMeasurementIntakes[intake]) {
                maxMeasurementIntakes[intake] = currentValue;
            }
        }
    }

    if (specificIntake !== false) {
        generateMaxMeasurement(specificIntake);
    } else {
        for (let i = 0; i < numberOfIntakes; i++) {
            generateMaxMeasurement(i);
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

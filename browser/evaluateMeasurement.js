import moment from 'moment';

const LIMIT_CHAR = `<`;

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

    let latestValuesForIntakes = [];

    const generateLatestMeasurement = (intake) => {
        let length = json.timeOfMeasurement[intake].length - 1;

        latestMeasurementIntakes[intake] = false;
        for (let i = length; i--; i >= 0) {
            let detectionLimitReached = true;
            if (json.attributes && json.attributes[intake] && Array.isArray(json.attributes[intake]) && json.attributes[intake][i] === LIMIT_CHAR) {
                detectionLimitReached = false;
            }

            if (detectionLimitReached) {
                currentValue = moment(json.timeOfMeasurement[intake][i], "YYYY-MM-DDTHH:mm:ssZZ");

                latestMeasurement = json.measurements[intake][i];
                latestValuesForIntakes.push(latestMeasurement);

                if (currentValue.isAfter(latestValue)) {
                    latestValue = currentValue;
                    latestPosition = {
                        intake,
                        measurement: i
                    }
                }

                latestMeasurementIntakes[intake] = json.measurements[intake][i];
                break;
            }
        }
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
        maxMeasurementIntakes[intake] = false;
        let length = json.measurements[intake].length;
        for (let u = 0; u < length; u++) {
            let detectionLimitReached = true;
            if (json.attributes && json.attributes[intake] && Array.isArray(json.attributes[intake]) && json.attributes[intake][u] === LIMIT_CHAR) {
                detectionLimitReached = false;
            }

            if (detectionLimitReached) {
                currentValue = json.measurements[intake][u];
                if (!(latestPosition.intake === intake && latestPosition.measurement === u) && currentValue > maxMeasurement) {
                    maxMeasurement = currentValue;
                }

                if (currentValue > maxMeasurementIntakes[intake]) {
                    maxMeasurementIntakes[intake] = currentValue;
                }
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

    if (latestValuesForIntakes.length > 0) {
        latestMeasurement = Math.max(...latestValuesForIntakes);
    }

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

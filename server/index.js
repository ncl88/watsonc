/*
 * @author     Martin Høgh <mh@mapcentia.com>
 * @copyright  2013-2019 MapCentia ApS
 * @license    http://www.gnu.org/licenses/#AGPL  GNU AFFERO GENERAL PUBLIC LICENSE 3
 */

const Excel = require('exceljs/modern.nodejs');
var express = require('express');
var request = require('request');
var router = express.Router();
var moment = require('moment');
var reproject = require('reproject');
var utmZone = require('./../../../browser/modules/utmZone.js');
var config = require('./../../../config/config');
var moduleConfig = require('./../config/config');
const spawn = require("child_process").spawn;

moment.locale("da_DK");

router.post('/api/extension/watsonc/download-plot', function (req, res) {
    if (req.body && req.body.title && req.body.data && Array.isArray(req.body.data)) {
        var workbook = new Excel.Workbook();
        req.body.data.map((item) => {
            var sheet = workbook.addWorksheet(item.name);
            item.x.map((xItem, index) => {
                let yItem = item.y[index];
                if (index === 0) {
                    var row = sheet.getRow(1);
                    row.getCell(1).value = ('x');
                    row.getCell(2).value = ('y');
                }

                var row = sheet.getRow(index + 2);
                row.getCell(1).value = (xItem + '');
                row.getCell(2).value = (yItem + '');
            });
        });

        workbook.xlsx.write(res).then(function() {
            res.end()
        });
    } else {
        res.status(400);
        res.send({
            status: `error`,
            message: `Title and at least one data set has to be provided`
        });
    }
});

router.post('/api/extension/watsonc/intersection', function (req, res) {
    if (!config.gc2.host) throw new Error(`GC2 host has to be specified`);

    if (req.body.profile && req.body.profile.type) {
        let table = `chemicals.boreholes_time_series_with_chemicals`;
        let sql = `SELECT * FROM ${table} WHERE ST_Intersects(ST_Transform(ST_geomfromtext('${req.body.data}', 4326), 25832), the_geom)`;
    
        let url = config.gc2.host + `/api/v1/sql/jupiter`;
        let data = {
            q: Buffer.from(sql).toString('base64'),
            base64: true,
            srs: 4326,
            lifetime: 0,
            client_encoding: `UTF8`,
        };
    
        request.post({url, form: data}, function (err, localRes) {
            let boreholeNames = [];
            let parsedResponse = JSON.parse(localRes.body);
            parsedResponse.features.map(item => {
                if (item.properties && item.properties.boreholeno) {
                    boreholeNames.push(item.properties.boreholeno);
                }
            });

            let zone = utmZone.getZone(req.body.profile.geometry.coordinates[0][1], req.body.profile.geometry.coordinates[0][0]);
            let crss = {"EPSG:25832": "+proj=utm +zone=" + zone + " +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs "};
            let reprojectedProfile = reproject.reproject(req.body.profile, 'EPSG:4326', 'EPSG:25832', crss);

            let inputJSON = {
                configFolder: require('path').dirname(moduleConfig.intersectionsScriptPath) + '/../profil',
                coordinates: reprojectedProfile.geometry.coordinates,
                DGU_nr: boreholeNames,
                Profile_depth: parseInt(req.body.profileDepth)
            };

            let errorOccured = false;
            const pythonProcess = spawn(moduleConfig.pythonCommand, [moduleConfig.intersectionsScriptPath, JSON.stringify(inputJSON)]);
            pythonProcess.stdout.on('data', (data) => {
                let parsedData = data.toString();
                let error = false;
                try {
                    let localParsedData = JSON.parse(data.toString());
                    parsedData = localParsedData;
                } catch(e) {
                    error = e.toString();
                }

                if (errorOccured === false) {
                    if (error === false) {
                        res.send({
                            result: parsedData,
                            boreholeNames
                        });
                    } else {
                        console.error('Error occured:', parsedData);

                        res.status(400);
                        res.send({
                            status: `error`,
                            message: error,
                            result: parsedData
                        });
                    }
                }
            });
    
            pythonProcess.stderr.on('data', (data) => {
                errorOccured = true;
                res.status(400);
                res.send({
                    status: `error`,
                    message: data.toString()
                });
            });
        }); 
    } else {
        res.status(400);
        res.send({
            status: `error`,
            message: `Profile GeoJSON is not provided`
        });
    }
});

router.post('/api/extension/watsonc/profile', function (req, res) {
    if (!config.gc2.host) throw new Error(`GC2 host has to be specified`);

    let zone = utmZone.getZone(req.body.profile.geometry.coordinates[0][1], req.body.profile.geometry.coordinates[0][0]);
    let crss = {"EPSG:25832": "+proj=utm +zone=" + zone + " +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs "};
    let reprojectedProfile = reproject.reproject(req.body.profile, 'EPSG:4326', 'EPSG:25832', crss);

    let inputJSON = {
        coordinates: reprojectedProfile.geometry.coordinates,
        DGU_nr: req.body.boreholeNames,
        Profile_depth: parseInt(req.body.depth),
    };

    if (req.body.compound) inputJSON.Compound = req.body.compound;

    if (req.body.layers && req.body.layers.length > 0) {
        inputJSON.layers = [];
        inputJSON.overlap = [];
        req.body.layers.map(item => {
            inputJSON.layers.push(item.layerconfig);
            inputJSON.overlap.push(item.intersectionSegments);
        });
    }

    let result = '';
    let errorOccured = false;
    const pythonProcess = spawn(moduleConfig.pythonCommand, [moduleConfig.profileScriptPath, '"' + JSON.stringify(inputJSON).replace(/"/g, '\'') + '"'], {
        cwd: require('path').dirname(moduleConfig.profileScriptPath),
        shell: true
    });

    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
    });

    pythonProcess.stdout.on('close', function(code) {
        let parsedData = false;

        let error = false;
        try {
            let localParsedData = JSON.parse(result);
            parsedData = localParsedData;
        } catch(e) {
            error = e.toString();
        }

        if (errorOccured === false) {
            if (error === false) {
                res.send(parsedData);
            } else {
                res.status(400);
                res.send({
                    status: `error`,
                    message: error,
                    result: parsedData
                });
            }
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        errorOccured = true;
        res.status(400);
        res.send({
            status: `error`,
            message: data.toString()
        });
    });
});

module.exports = router;

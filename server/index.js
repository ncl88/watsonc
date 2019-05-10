/*
 * @author     Martin Høgh <mh@mapcentia.com>
 * @copyright  2013-2019 MapCentia ApS
 * @license    http://www.gnu.org/licenses/#AGPL  GNU AFFERO GENERAL PUBLIC LICENSE 3
 */

var express = require('express');
var request = require('request');
var router = express.Router();
var moment = require('moment');
var config = require('./../../../config/config');
var moduleConfig = require('./../config/config');
const spawn = require("child_process").spawn;

moment.locale("da_DK");

router.post('/api/extension/watsonc', function (req, res) {
    if (!config.gc2.host) throw new Error(`GC2 host has to be specified`);

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

    request.post({url, form: data}, function (err, localRes, body) {


        console.log(body);


        const pythonProcess = spawn('python3.6', [moduleConfig.scriptPath]);
        
        pythonProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });




        res.send(body);
    }); 
});

module.exports = router;

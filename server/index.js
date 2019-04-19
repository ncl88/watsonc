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

moment.locale("da_DK");

router.post('/api/extension/watsonc', function (req, res) {
    if (!config.gc2.host) throw new Error(`GC2 host has to be specified`);

    let table = `chemicals.boreholes_time_series_with_chemicals`;
    let url = config.gc2.host + `/api/sql/jupiter?base64=true&srs=4326&lifetime=0&client_encoding=UTF8&key=null`;
    url += `&q=` + Buffer.from(`SELECT * FROM ${table} WHERE ST_Intersects(ST_Transform(ST_geomfromtext('${JSON.stringify(req.body)}', 4326), 25832), the_geom)`).toString('base64');

    request.get(url, function (err, localRes, body) {

        console.log(err, body);

        res.send({status: `success`});
    }); 
});

module.exports = router;

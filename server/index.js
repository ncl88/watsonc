/*
 * @author     Martin Høgh <mh@mapcentia.com>
 * @copyright  2013-2019 MapCentia ApS
 * @license    http://www.gnu.org/licenses/#AGPL  GNU AFFERO GENERAL PUBLIC LICENSE 3
 */

var express = require('express');
var router = express.Router();
var moment = require('moment');

moment.locale("da_DK");

router.post('/api/extension/watsonc', function (request, response) {

    console.log(request.body);

    /*
        Re-use code from SQL query API
        Request intersecting boreholes from a specific table
    */

    response.send({status: `success`});
});

module.exports = router;

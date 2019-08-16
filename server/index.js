/*
 * @author     Martin Høgh <mh@mapcentia.com>
 * @copyright  2013-2019 MapCentia ApS
 * @license    http://www.gnu.org/licenses/#AGPL  GNU AFFERO GENERAL PUBLIC LICENSE 3
 */

var express = require('express');
var router = express.Router();

var plotToExcelHandler = require('./plotToExcel');
var scripts = require('./scripts');
var profilesController = require('./profilesController');

router.post('/api/extension/watsonc/download-plot', plotToExcelHandler);

router.post('/api/extension/watsonc/intersection', scripts.instersectionScriptHandler);
router.post('/api/extension/watsonc/profile', scripts.profileScriptHandler);

router.get('/api/extension/watsonc/:dataBase/profiles', profilesController.getAllProfiles);
router.post('/api/extension/watsonc/:dataBase/profiles', profilesController.createProfile);
router.delete('/api/extension/watsonc/:dataBase/profiles/:id', profilesController.deleteProfile);

module.exports = router;

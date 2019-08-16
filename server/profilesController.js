
var request = require('request');
const shared = require('./../../../controllers/gc2/shared');
var config = require('./../../../config/config');
const uuid = require('uuid/v1');

if (!config.gc2.host) throw new Error(`Unable to get the GC2 host from config`);
const API_LOCATION = config.gc2.host + `/api/v2/keyvalue`;

const createProfile = (req, res) => {
    if (`profile` in req.body && `title` in req.body && `buffer` in req.body && `data` in req.body) {
        let { userId } = shared.getCurrentUserIdentifiers(req);
        if (userId) {
            const key = `watsonc_profile_` + uuid();
            let currentDate = new Date();

            let storedData = {
                key,
                userId,
                created_at: currentDate.toISOString(),
                profile: JSON.parse(JSON.stringify(req.body))
            };
        
            request({
                method: 'POST',
                encoding: 'utf8',
                uri: API_LOCATION + `/` + req.params.dataBase + `/` + key,
                form: JSON.stringify(storedData)
            }, (error, response) => {
                let parsedBody = false;
                try {
                    let localParsedBody = JSON.parse(response.body);
                    parsedBody = localParsedBody;
                } catch (e) {}

                if (parsedBody) {
                    if (parsedBody.success) {
                        res.send(parsedBody);
                    } else {
                        shared.throwError(res, parsedBody.message);
                    }
                } else {
                    shared.throwError(res, 'INVALID_OR_EMPTY_EXTERNAL_API_REPLY', { body: response.body });
                } 
            });
        } else {
            shared.throwError(res, 'UNAUTHORIZED');
        }
    } else {
        shared.throwError(res, 'MISSING_DATA');
    }
};

const getAllProfiles = (req, res) => {
    let { userId } = shared.getCurrentUserIdentifiers(req);

    request({
        method: 'GET',
        encoding: 'utf8',
        uri: API_LOCATION + `/` + req.params.dataBase + `?like=watsonc_profile_%`
    }, (error, response) => {
        if (error) {
            shared.throwError(res, 'INVALID_OR_EMPTY_EXTERNAL_API_REPLY', { error });
            return;
        }

        let parsedBody = false;
        try {
            let localParsedBody = JSON.parse(response.body);
            parsedBody = localParsedBody;
        } catch (e) {}

        if (parsedBody && parsedBody.data) {
            // Filter by user ownership
            let results = [];
            parsedBody.data.map(item => {
                let parsedSnapshot = JSON.parse(item.value);
                if (userId && parsedSnapshot.userId === userId) {
                    results.push(item);
                }
            });

            res.send(results);
        } else {
            shared.throwError(res, 'INVALID_OR_EMPTY_EXTERNAL_API_REPLY', {
                body: response.body,
                url: API_LOCATION + `/` + req.params.dataBase
            });
        }
    });
};

const deleteProfile = (req, res) => {
    let { userId } = shared.getCurrentUserIdentifiers(req);

    // Get the specified profile
    request({
        method: 'GET',
        encoding: 'utf8',
        uri: API_LOCATION + `/` + req.params.dataBase + `/` + req.params.id,
    }, (error, response) => {
        if (response.body.data === false) {
            shared.throwError(res, 'INVALID_PROFILE_ID');
        } else {
            let parsedBody = false;
            try {
                let localParsedBody = JSON.parse(response.body);
                parsedBody = localParsedBody;
            } catch (e) {}

            if (parsedBody && parsedBody.data.value) {
                let parsedSnapshotData = JSON.parse(parsedBody.data.value);
                if (`userId` in parsedSnapshotData && parsedSnapshotData.userId === userId) {
                    request({
                        method: 'DELETE',
                        encoding: 'utf8',
                        uri: API_LOCATION + `/` + req.params.dataBase + `/` + req.params.id,
                    }, (error, response) => {
                        res.send({ status: 'success' });
                    });
                } else {
                    shared.throwError(res, 'ACCESS_DENIED');
                }
            } else {
                shared.throwError(res, 'INVALID_OR_EMPTY_EXTERNAL_API_REPLY', { body: response.body });
            }
        }
    });
};

module.exports = {createProfile, getAllProfiles, deleteProfile};
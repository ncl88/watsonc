/**
 * Abstraction class for storing profiles in the key-value storage
 */

import axios from 'axios';

class ProfileManager {
    constructor() {
        let hostname = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
        this.apiUrl = hostname + `/api/key-value/` + window.vidiConfig.appDatabase;
    }

    getAll() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${this.apiUrl}?like=watsonc_profile_%`,
                method: 'GET',
                dataType: 'json'
            }).then(response => {
                let parsedData = [];
                response.data.map(item => {
                    parsedData.push({
                        key: item.key,
                        value: JSON.parse(item.value)
                    });
                });

                resolve(parsedData);
            }, (jqXHR) => {
                console.error(`Error occured while refreshing profiles list`);
                reject(`Error occured while refreshing profiles list`);
            });
        });
    }

    create(savedProfile) {
        return new Promise((resolve, reject) => {
            axios.post(`/api/extension/watsonc/profile`, savedProfile).then(response => {
                if (response.data) {            
                    savedProfile.data = response.data;
    
                    const key = `watsonc_profile_` + uuidv1();
                    axios.post(`${this.apiUrl}/${key}`, savedProfile).then(response => {
                        let data = response.data.data;
                        data.value = JSON.parse(data.value);

                        resolve(data);
                    }).catch(error => {
                        console.error(error);
                        reject(error);
                    });
                } else {
                    console.log(`Unable to generate plot data`);
                    reject(`Unable to generate plot data`);
                }
            }).catch(error => {
                console.log(`Error occured during plot generation`, error);
                reject(`Error occured during plot generation`);
            });
        });
    }

    delete(profileKey) {
        return new Promise((resolve, reject) => {
            if (profileKey) {
                axios.delete(`${this.apiUrl}/${profileKey}`).then(resolve).catch(reject);
            } else {
                reject(`Empty profile identifier was provided`);
            }
        });
    }
}

export default ProfileManager;
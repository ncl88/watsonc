/**
 * Abstraction class for storing profiles in the key-value storage
 */

import axios from 'axios';

class ProfileManager {
    constructor() {
        let hostname = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
        //this.apiUrl = hostname + `/api/key-value/` + window.vidiConfig.appDatabase;
        this.apiUrl = hostname + `/api/extension/watsonc/${window.vidiConfig.appDatabase}/profiles`;
    }

    getAll() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: this.apiUrl,
                method: 'GET',
                dataType: 'json'
            }).then(response => {
                let parsedData = [];
                response.map(item => {
                    parsedData.push(JSON.parse(item.value));
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
                    axios.post(`${this.apiUrl}`, savedProfile).then(response => {
                        let data = JSON.parse(response.data.data.value);
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
                reject(error);
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
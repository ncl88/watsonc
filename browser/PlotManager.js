/**
 * Abstraction class for storing plots in the key-value storage
 */

const uuidv4 = require('uuid/v4');

class PlotManager {
    constructor() {
        if (window.vidiConfig && window.vidiConfig.gc2 && window.vidiConfig.gc2.host && window.vidiConfig.appDatabase) {
            this.apiUrl = window.vidiConfig.gc2.host + `/api/v2/keyvalue/` + window.vidiConfig.appDatabase;
        } else {
            throw new Error(`Unable to detect the GC2 host`);
        }
    }

    getAll() {
        throw new Error(`Not implemented yet`);
    }

    get() {
        throw new Error(`Not implemented yet`);
    }

    create(title) {
        return new Promise((resolve, reject) => {
            if (title) {
                let plotId = `watsonc_plot_${uuidv4()}`;
                let newPlot = {
                    id: plotId,
                    title,
                    measurements: [],
                    measurementsCachedData: {}
                };

                $.ajax({
                    url: `${this.apiUrl}/${plotId}`,
                    method: 'POST',
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify(newPlot),
                    success: (body) => {
                        console.log(`### body`, body);
                        if (body.success) {
                            resolve(newPlot);
                        } else {
                            throw new Error(`Failed to perform operation`, body);
                        }
                    },
                    error: error => {
                        console.error(error);
                        reject(`Failed to query keyvalue API`);
                    }
                });
            } else {
                reject(`Empty plot title was provided`);
            }
        });
    }

    update(id, data) {
        throw new Error(`Not implemented yet`, id, data);
    }

    delete(plotId) {
        return new Promise((resolve, reject) => {
            if (plotId) {
                if (plotId.indexOf(`watsonc_plot_`) === 0) {
                    // Serverside (keyvalue) stored plots
                    $.ajax({
                        url: `${this.apiUrl}/${plotId}`,
                        method: 'DELETE',
                        dataType: 'json',
                        contentType: 'application/json; charset=utf-8',
                        success: body => {
                            if (body.success) {
                                resolve();
                            } else {
                                throw new Error(`Failed to perform operation`, body);
                            }
                        },
                        error: error => {
                            console.error(error);
                            reject(`Failed to query keyvalue API`);
                        }
                    });
                } else {
                    // Clientside-only stored plots
                    resolve();
                }
            } else {
                reject(`Empty plot identifier was provided`);
            }
        });
    }
}

export default PlotManager;
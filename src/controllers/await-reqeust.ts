const request = require("request");

module.exports = async (value) =>
    new Promise((resolve, reject) => {
        request(value, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                resolve(body);
            }
        });
    });

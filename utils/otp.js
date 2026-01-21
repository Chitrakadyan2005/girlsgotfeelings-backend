const crypto = require('crypto');

exports.generateOtp = () => {
    return crypto.randomInt(10000,99999).toString();
};
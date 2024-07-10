
require('dotenv').config();
const { evershopData } = require('./google-sheet');

const config = {
    googleSheet: {
        evershopData
    }
}

module.exports = {
    config
}
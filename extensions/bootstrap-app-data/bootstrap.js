const { addProcessor } = require('@evershop/evershop/src/lib/util/registry');
const { googleSheetService } = require('../google-sheet/google-sheet.service');
module.exports = () => {
    addProcessor('bootstrapData', async () => {
        console.log('bootstrapData nene');
        await googleSheetService.bootstrapClient();
    });
};
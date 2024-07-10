const { googleSheetService } = require('../google-sheet/google-sheet.service');
module.exports = async () => {
    await googleSheetService.bootstrapClient();
};
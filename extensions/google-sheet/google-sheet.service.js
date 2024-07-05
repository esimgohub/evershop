const { google } = require('googleapis');
const { config } = require('./config');

class GoogleSheetService {
  client;

  async bootstrapClient() {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      credentials: {
        client_email: config.client_email,

        private_key: config.private_key,
      },
      projectId: config.project_id,
    });
    const authClient = await auth.getClient();

    //ts-ignore
    this.client = google.sheets({
      version: 'v4',
      auth: authClient,
    });
  }

  async getRowsData(spreadsheetId, range) {
    try {
      const response = await this.client.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      const loadedData = response.data.values ?? [];

      return{
        header: loadedData.shift(),
        rows: loadedData,
      };
    } catch (error) {
      throw new Error(error)
    }
  }
}

const googleSheetService = new GoogleSheetService();

module.exports = {
  googleSheetService
}
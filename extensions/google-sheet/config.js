const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

require('dotenv').config();

const config = {
  project_id: getConfig("googleSheet.config.project_id"),
  private_key: getConfig("googleSheet.config.private_key"),
  client_email: getConfig("googleSheet.config.client_email"),
  client_id: getConfig("googleSheet.config.client_id"),
};

module.exports = {
  config
}

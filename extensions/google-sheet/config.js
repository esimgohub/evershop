require('dotenv').config();

const config = {
  project_id: process.env.GOOGLE_API_PROJECT_ID,
  private_key: process.env.GOOGLE_API_PRIVATE_KEY,
  client_email: process.env.GOOGLE_API_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_API_CLIENT_ID,
};

module.exports = {
  config
}

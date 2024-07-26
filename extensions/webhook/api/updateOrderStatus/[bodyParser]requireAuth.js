const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const {
  OK,
  UNAUTHORIZED
} = require('@evershop/evershop/src/lib/util/httpStatus');

module.exports = async (request, response, delegate, next) => {
  const gohubWebhookApiKey = getConfig('webhook.gohub_cloud_webhook_api_key');
  const apiKey = request.headers['x-api-key'];

  const isNotAuthorized = apiKey !== gohubWebhookApiKey;

  if (isNotAuthorized) {
    response.status(UNAUTHORIZED);
    return response.json({
      error: {
        status: UNAUTHORIZED,
        message: 'Unauthorized'
      }
    });
  }

  next();
};

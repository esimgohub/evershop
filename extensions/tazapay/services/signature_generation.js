const { error } = require('@evershop/evershop/src/lib/log/logger');
const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');

/**
 * Makes a signed HTTP request to the specified URL path using the given HTTP method.
 *
 * @param {string} idempotencyKey - The unique key for Tazapay payment.
 * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
 * @param {string} urlPath - The URL path of the request.
 * @param {Object} [body=null] - The request payload (optional).
 * @returns {Promise<Object>} - The response data from the server.
 * @throws {Error} - Throws an error if the request fails.
 */
async function makeRequest(idempotencyKey, method, urlPath, body = null) {
  try {
    const httpMethod = method;
    const httpBaseURL = await getSetting('tazapayBaseUrl', null);
    if (!httpBaseURL) {
      error(`httpBaseURL: ${httpBaseURL}`);
      throw new Error('Tazapay base URL is not configured');
    }

    const options = {
      hostname: httpBaseURL,
      path: urlPath,
      method: httpMethod,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        authorization: await authBasic()
      }
    };

    const response = await nodeFetchRequest(options, body);
    if (!response) {
      return null;
    }
    return generateResponse(response);
  } catch (e) {
    error(JSON.stringify(e));
    return null;
  }
}

const nodeFetchRequest = async (options, body) => {
  let bodyString = body ? JSON.stringify(body) : undefined;
  const baseUrl = `https://${options.hostname}`;
  try {
    console.log(`httpRequest options: ${JSON.stringify(options)}`);
    console.log(`httpRequest body: ${JSON.stringify(body)}`);
    const response = await fetch(baseUrl + options.path, {
      method: options.method,
      headers: options.headers,
      body: bodyString
    });
    console.log(`httpRequest response: ${JSON.stringify(response)}`);
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(JSON.stringify(response));
    }
  } catch (e) {
    error(`Failed to call Tazapay api: ${e}`);
    return null;
  }
};

async function authBasic() {
  try {
    const accessKey = await getSetting('tazapayAccessKey', '');
    const secretKey = await getSetting('tazapaySecretKey', '');
    let basicAuth = `${accessKey}:${secretKey}`;

    return `Basic ${Buffer.from(basicAuth).toString('base64')}`;
  } catch (e) {
    error("Error generating signature");
    throw e;
  }
}

function generateResponse (response) {
  if (response?.status === 'success') {
    return {
      success: true,
      redirect_url: response?.data?.url
    };
  } else {
    // Invalid status
    return {
      error: 'Failed to process payment'
    };
  }
}




module.exports = { makeRequest };
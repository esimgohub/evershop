const axios = require('axios');
const https = require("https");
const { error } = require('@evershop/evershop/src/lib/log/logger');
const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');

/**
 * Makes a signed HTTP request to the specified URL path using the given HTTP method.
 *
 * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
 * @param {string} urlPath - The URL path of the request.
 * @param {Object} [body=null] - The request payload (optional).
 * @returns {Promise<Object>} - The response data from the server.
 * @throws {Error} - Throws an error if the request fails.
 */
async function makeRequest(method, urlPath, body = null) {
  try {
    httpMethod = method;
    httpBaseURL = "service-sandbox.tazapay.com";

    const options = {
      hostname: httpBaseURL,
      path: urlPath,
      method: httpMethod,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: await authBasic()
      }
    };

    const response = await httpRequest(options, body);
    return generateResponse(response);
  } catch (e) {
    error("Error generating request options");
    throw e;
  }
}

const axiosRequest = async (options, body) => {
  let bodyString = body ? JSON.stringify(body) : undefined;

  try {
    const response = await axios.request({
      method: options.method,
      baseURL: options.hostname,
      url: options.path,
      headers: options.headers,
      data: bodyString,
      validateStatus: function (status) {
        return [200, 201].includes(status);
      },
    });
    return response.data;
  } catch (e) {
    error("Error making request");
    throw e;
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

async function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    try {
      let bodyString = "";
      if (body) {
        bodyString = JSON.stringify(body);
        bodyString = bodyString == "{}" ? "" : bodyString;
      }

      console.log(`httpRequest options: ${JSON.stringify(options)}`);
      const req = https.request(options, (res) => {
        let response = {
          statusCode: res.statusCode,
          headers: res.headers,
          body: "",
        };

        res.on("data", (data) => {
          response.body += data;
        });

        res.on("end", () => {
          response.body = response.body ? JSON.parse(response.body) : {};
          console.log(`httpRequest response: ${JSON.stringify(response)}`);

          if (response.statusCode !== 200) {
            return reject(response);
          }

          return resolve(response);
        });
      });

      req.on("error", (error) => {
        return reject(error);
      });

      req.write(bodyString);
      req.end();
    } catch (err) {
      return reject(err);
    }
  });
}

function generateResponse (response) {
  if (response.statusCode === 200) {
    return {
      success: true,
      redirect_url: response?.body?.data?.url
    };
  } else {
    // Invalid status
    return {
      error: 'Failed to process payment'
    };
  }
}




module.exports = { makeRequest };
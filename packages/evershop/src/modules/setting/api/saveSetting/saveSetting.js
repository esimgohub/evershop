const {
  insertOnUpdate,
  commit,
  rollback
} = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const {
  OK,
  INTERNAL_SERVER_ERROR
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { refreshSetting } = require('../../services/setting');

// eslint-disable-next-line no-unused-vars

// TODO: Must check this function
// const validateRequestBody = (body)  => {
//   // Validate slider settings
//   const sliderKeys = Object.keys(body).filter(setting => setting.startsWith("slider"));

//   console.log("sliderKeys: ", sliderKeys);
  
//   const hasSettingOptionIsEmpty = sliderKeys.some(key => !body[key] || (body[key] && body[key] === ''));
//   if (hasSettingOptionIsEmpty) {
//     throw new Error("Some slider option is empty");
//   }
// }

module.exports = async (request, response, delegate, next) => {
  const { body } = request;
  const connection = await getConnection();
  try {

    console.log("body ne: ", body);
    // Loop through the body and insert the data
    const promises = [];
    Object.keys(body).forEach((key) => {
      const value = body[key];
      // Check if the value is a object or array
      if (typeof value === 'object') {
        promises.push(
          insertOnUpdate('setting', ['name'])
            .given({
              name: key,
              value: JSON.stringify(value),
              is_json: 1
            })
            .execute(connection, false)
        );
      } else {
        promises.push(
          insertOnUpdate('setting', ['name'])
            .given({
              name: key,
              value,
              is_json: 0
            })
            .execute(connection, false)
        );
      }
    });
    await Promise.all(promises);
    await commit(connection);
    // Refresh the setting
    await refreshSetting();
    response.status(OK);
    response.json({
      data: {}
    });
  } catch (error) {
    await rollback(connection);
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message: error.message
      }
    });
  }
};

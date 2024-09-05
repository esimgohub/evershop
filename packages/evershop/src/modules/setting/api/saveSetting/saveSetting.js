const {
  insertOnUpdate,
  commit,
  rollback,
  select,
  del
} = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const {
  OK,
  INTERNAL_SERVER_ERROR
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { refreshSetting } = require('../../services/setting');

const deleteIfNotExists = async (keys, currentSettings, connection) => {
  const hasSocialKeys = keys.some((key) => key.startsWith('social'));
  if (hasSocialKeys) {
    const socialSettings = currentSettings.filter((setting) => setting.name.startsWith('social'));

    if (socialSettings.length > 0) {
      for (const setting of socialSettings) {
        const isNotExistedSocialWithKey = keys.every((key) => key.startsWith('social') && !key.includes(setting.name));
        if (isNotExistedSocialWithKey) {  
          await del('setting').where('name', '=', setting.name).execute(connection, false);
        }
      }
    }
    
    return;
  }

  const hasSliderKeys = keys.some((key) => key.startsWith('1sslideritem'));
  if (hasSliderKeys) {
    const sliderSettings = currentSettings.filter((setting) => setting.name.startsWith('1sslideritem'));

    if (sliderSettings.length > 0) {
      for (const setting of sliderSettings) {      
        const isNotExistedSliderWithKey = keys.every((key) => key.startsWith('1sslideritem') && !key.includes(setting.name));
        if (isNotExistedSliderWithKey) {  
          await del('setting').where('name', '=', setting.name).execute(connection, false);
        }
      }
    }

    return;
  }
}
module.exports = async (request, response, delegate, next) => {
  const { body } = request;
  
  const connection = await getConnection();
  try {

    const currentSettings = await select()
      .from('setting')
      .execute(connection, false);

    // Loop through the body and insert the data
    const promises = [];

    promises.push(deleteIfNotExists(Object.keys(body), currentSettings, connection));

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

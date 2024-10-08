const path = require('path');
const fs = require('fs').promises;
const { CONSTANTS } = require('@evershop/evershop/src/lib/helpers');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { getValueSync } = require('@evershop/evershop/src/lib/util/registry');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');

/**
 * @param {Array} files an array of files in the format of {name: String, data: Buffer}
 * @param {String} destinationPath the destination path
 */
module.exports.uploadFile = async (files, destinationPath) => {
  /**
   * @type {Object} uploader
   * @property {Function} upload
   */

  const fileUploader = getValueSync(
    'fileUploader',
    localUploader,
    {
      config: getConfig('system.file_storage')
    },
    (value) =>
      // The value must be an object with an upload method
      value && typeof value.upload === 'function'
  );

  const results = await fileUploader.upload(files, destinationPath);
  return results;
};

const localUploader = {
  upload: async (files, destinationPath) => {

    // Assumming the we are using MemoryStorage for multer. Now we need to write the files to disk.
    // The files argument is an array of files from multer.
    const mediaPath = CONSTANTS.MEDIAPATH;

    
    // Save the files to disk asynchrously

    console.log("destinationPath ne: ", destinationPath);

    const results = await Promise.all(
      files.map(async (file) => {
        const urlPath = `${destinationPath}/${
            Math.floor(Math.random() * (9999 - 1000)) + 1000
          }/${Math.floor(Math.random() * (9999 - 1000)) + 1000}`;

        const destination = path.join(mediaPath, urlPath);

        // Create the destination folder if it does not exist
        await fs.mkdir(destination, { recursive: true });

        return fs
          .writeFile(path.join(destination, file.filename), file.buffer)
          .then(() => ({
            name: file.filename,
            type: file.minetype,
            size: file.size,
            url: buildUrl('staticAsset', [
              path
                .join(urlPath, file.filename)
                .split('\\')
                .join('/')
                .replace(/^\//, '')
            ])
          }))
        }
      )
    );

    return results;
  }
};

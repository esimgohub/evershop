const webpack = require('webpack');
const {
  createConfigClient
} = require('@evershop/evershop/src/lib/webpack/prod/createConfigClient');
const { error } = require('@evershop/evershop/src/lib/log/logger');

module.exports.buildClient = async function buildClient(routes) {
  const config = createConfigClient(routes);
  const compiler = webpack(config);

  console.log("routesss: ", routes);

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        error(
          stats.toString({
            errorDetails: true,
            warnings: true
          })
        );
        reject(err);
      }
      resolve(stats);
    });
  });
};

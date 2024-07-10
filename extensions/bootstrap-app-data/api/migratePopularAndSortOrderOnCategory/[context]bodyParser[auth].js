const bodyParser = require('body-parser');

module.exports = (request, response, delegate, next) => {
  console.log("to hereE:");

  bodyParser.json({ inflate: false })(request, response, next);
};

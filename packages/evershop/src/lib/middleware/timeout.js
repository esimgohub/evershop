'use strict'

var ms = require('ms')

module.exports = timeout

function timeout (time) {
  var delay = typeof time === 'string'
    ? ms(time)
    : Number(time || 5000)

  return function (req, res, next) {
    var id = setTimeout(function () {
      onTimeout(delay, next, res);

      clearTimeout(id);
    }, delay);

    next();
  }
}

function onTimeout (delay, cb, res) {
  res.status(408).json({status: 408, message: 'Request timeout'});

}
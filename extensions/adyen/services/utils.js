const geoip = require('geoip-lite');
const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const {
  getOrdersBaseQuery
} = require('@evershop/evershop/src/modules/oms/services/getOrdersBaseQuery');

module.exports = {
  getCountryByIp: async function (ip) {
    const geo = geoip.lookup(ip);
    return geo?.country ?? null;
  },
  convertFromUSD: async function (amount, rate, currentIsoCode) {
    if (currentIsoCode === 'USD') {
      return amount;
    }
    return amount * rate;
  },
  parseIp: function (request) {
    let ip =
      request.headers['x-forwarded-for']?.split(',').shift() ||
      request.socket?.remoteAddress;
    if (!ip || ip !== '::1') {
      return null;
    }
    if (ip.substring(0, 7) === '::ffff:') {
      ip = ip.substring(7);
    }
    return ip;
  }
};

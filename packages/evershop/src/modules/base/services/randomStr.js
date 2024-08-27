const ShortUniqueId = require('short-unique-id');

module.exports = (length = 7) => new ShortUniqueId({ length }).randomUUID();

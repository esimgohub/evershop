const { error } = require('../../lib/log/logger');
const { addProcessor, addFinalProcessor } = require('../../lib/util/registry');
const { sortFields } = require('./services/cart/sortFields');
const {
  registerCartBaseFields
} = require('./services/cart/registerCartBaseFields');

const {
  registerCartItemBaseFields
} = require('./services/cart/registerCartItemBaseFields');

module.exports = () => {
  addProcessor('cartFields', registerCartBaseFields, 0);

  addProcessor('cartItemFields', registerCartItemBaseFields, 0);

  addFinalProcessor('cartInitialItems', (fields) => {
    try {
      fields.sort((a, b) => {
        const ttA = new Date(a.getData('updated_at')).getTime()
        const ttB = new Date(b.getData('updated_at')).getTime()
        return ttB - ttA
      });
      return fields;
    } catch (e) {
      error(e);
      throw e;
    }
  });

  addFinalProcessor('cartFields', (fields) => {
    try {
      const sortedFields = sortFields(fields);
      return sortedFields;
    } catch (e) {
      error(e);
      throw e;
    }
  });

  addFinalProcessor('cartItemFields', (fields) => {
    try {
      const sortedFields = sortFields(fields);
      return sortedFields;
    } catch (e) {
      error(e);
      throw e;
    }
  });
};

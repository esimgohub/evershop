/* eslint-disable no-underscore-dangle */
/* eslint-disable max-classes-per-file */
const {
  getValueSync,
  getValue
} = require('@evershop/evershop/src/lib/util/registry');
const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { v4: uuidv4, validate } = require('uuid');
const {
  translate
} = require('@evershop/evershop/src/lib/locale/translate/translate');
const { DataObject } = require('./DataObject');
const {
  getProductsBaseQuery
} = require('../../../catalog/services/getProductsBaseQuery');
// eslint-disable-next-line no-multi-assign
module.exports = exports = {};

class Item extends DataObject {
  #cart;

  #product;

  constructor(theCart, initialData = {}) {
    super(getValueSync('cartItemFields', []), initialData);
    this.#cart = theCart;
  }

  async getProduct() {
    if (this.#product) {
      return this.#product;
    }
    const productQuery = getProductsBaseQuery();
    const product = await productQuery
      .where('product_id', '=', this.getData('product_id'))
      .load(pool);
    this.#product = product;
    return product;
  }

  getId() {
    return this.getData('uuid');
  }

  getIsActive() {
    return this.getData('is_active');
  }

  getCart() {
    return this.#cart;
  }

  /**
   * Update the categoryId of an item.
   * @param {number} categoryId
   * @returns {void}
   * @throws {Error}
   */
  async updateCategoryId(categoryId) {
    await this.setData('category_id', categoryId, true);
  }

  /**
   * Update the tripDate of an item.
   * @param {string} fromDate
   * @param {string} toDate
   * @returns {void}
   * @throws {Error}
   */
  async updateTripDate(fromDate, toDate) {
    const trip = [fromDate, toDate].join()
    await this.setData('trip', trip, true);
  }
}

class Cart extends DataObject {
  constructor(initialData = {}) {
    const fields = getValueSync('cartFields', []);
    super(fields, initialData);
  }

  getId() {
    return this.getData('uuid');
  }

  /**
   * @returns {Array<Item>}
   */
  getItems() {
    return this.getData('items') ?? [];
  }

  /**
   * @returns {Array<Item>}
   */
  getActiveItems() {
    const items = this.getData('items') ?? [];
    let res;
    if (items && items.length > 0) {
      res = items.filter(item => item.getIsActive() === true);
    } else {
      res = [...items];
    }
    return res;
  }

  /**
   * @returns {Array<Item>}
   */
  getUnActiveItems() {
    const items = this.getData('items') ?? [];
    let res;
    if (items && items.length > 0) {
      res = items.filter(item => item.getIsActive() === false);
    } else {
      res = [...items];
    }
    return res;
  }

  /**
   * Set all items in the cart to active.
   * @returns {Array} Updated items
   * @throws {Error}
   */
  async updateSelectAllItems() {
    const items = this.getItems();

    // Iterate over all items and set is_active to true
    for (let i = 0; i < items.length; i += 1) {
      await items[i].setData('is_active', true, true);
      if (items[i].hasError()) {
        throw new Error(Object.values(items[i].getErrors())[0]);
      }
    }

    // Save the updated items list
    await this.setData('items', items, true);

    return items;
  }


  /**
   * Set all items in the cart to un-active.
   * @returns {Array} Updated items
   * @throws {Error}
   */
  async updateDeselectAllItems() {
    const items = this.getItems();

    // Iterate over all items and set is_active to true
    for (let i = 0; i < items.length; i += 1) {
      await items[i].setData('is_active', false, true);
      if (items[i].hasError()) {
        throw new Error(Object.values(items[i].getErrors())[0]);
      }
    }

    // Save the updated items list
    await this.setData('items', items, true);

    return items;
  }

  /**
   * Update the active status of an item.
   * @param {string||int} uuid
   * @param {boolean} isActive
   * @returns {Item}
   * @throws {Error}
   */
  async updateItemSelection(uuid, isActive) {
    const items = this.getItems();
    const item = this.getItem(uuid);

    if (!item) {
      throw new Error('Item not found');
    }

    // Check for errors after updating quantity
    if (item.hasError()) {
      throw new Error(Object.values(item.getErrors())[0]);
    }

    // Update the is_active status
    await item.setData('is_active', isActive, true);

    // Check for errors after updating is_active
    if (item.hasError()) {
      throw new Error(Object.values(item.getErrors())[0]);
    }

    // Update the items list with the modified item
    const updatedItems = items.map(i => (i.getData('uuid') === uuid ? item : i));
    await this.setData('items', updatedItems, true);

    return item;
  }

  /**
   * Update the quantity of an item.
   * @param {string||int} uuid
   * @param {number} newQty
   * @returns {Item}
   * @throws {Error}
   */
  async updateItemQuantity(uuid, newQty) {
    const items = this.getItems();
    const item = this.getItem(uuid);

    if (!item) {
      throw new Error('Item not found');
    }

    await item.setData('qty', newQty, true);

    if (item.hasError()) {
      throw new Error(Object.values(item.getErrors())[0]);
    }

    const updatedItems = items.map(i => (i.getData('uuid') === uuid ? item : i));
    await this.setData('items', updatedItems, true);

    return item;
  }

  /**
   *
   * @param {string} productID | product_id, sku, or uuid
   * @param {number} qty
   * @returns
   */
  async addItem(productID, qty) {
    const item = await this.createItem(productID, parseInt(qty, 10));
    if (item.hasError()) {
      // Get the first error from the item.getErrors() object
      throw new Error(Object.values(item.getErrors())[0]);
    } else {
      let items = this.getItems();
      let duplicateItem;
      for (let i = 0; i < items.length; i += 1) {
        if (items[i].getData('product_sku') === item.getData('product_sku')) {
          // eslint-disable-next-line no-await-in-loop
          await items[i].setData(
            'qty',
            item.getData('qty') + items[i].getData('qty')
          );
          if (items[i].hasError()) {
            throw new Error(Object.values(items[i].getErrors())[0]);
          }
          duplicateItem = items[i];
        }
      }

      if (!duplicateItem) {
        items = items.concat(item);
      }
      await this.setData('items', items, true);
      return duplicateItem || item;
    }
  }

  /**
   * @param {string||int} uuid
   * @returns {Item}
   * @throws {Error}
   */
  async removeItem(uuid) {
    const items = this.getItems();
    const item = this.getItem(uuid);
    const newItems = items.filter((i) => i.getData('uuid') !== uuid);
    if (item) {
      await this.setData('items', newItems);
      return item;
    } else {
      throw new Error('Item not found');
    }
  }

  async createItem(productID, qty) {
    // Make sure the qty is a number and greater than 0
    if (typeof qty !== 'number' || qty <= 0) {
      throw new Error('Invalid quantity');
    }
    const productQuery = getProductsBaseQuery();
    if (validate(productID)) {
      productQuery.where('product.uuid', '=', productID);
    } else if (/^\d+$/.test(productID)) {
      productQuery
        .where('product.product_id', '=', productID)
        .or('product.sku', '=', productID);
    } else {
      productQuery.where('product.sku', '=', productID);
    }
    const product = await productQuery.load(pool);
    if (!product) {
      throw new Error(translate('Product not found'));
    }
    const item = new Item(this, {
      product_id: product.product_id,
      qty
    });
    await item.build();
    if (item.hasError()) {
      // Get the first error from the item.getErrors() object
      throw new Error(Object.values(item.getErrors())[0]);
    } else {
      return item;
    }
  }

  getItem(uuid) {
    const items = this.getItems();
    return items.find((item) => item.getData('uuid') === uuid);
  }

  hasItemError() {
    const items = this.getItems();
    let flag = false;
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].hasError()) {
        flag = true;
        break;
      }
    }

    return flag;
  }

  hasError() {
    return super.hasError() || this.hasItemError();
  }

  exportData() {
    const data = this.export();
    data.errors = Object.values(this.getErrors());
    const items = this.getItems();
    data.items = items.map((item) => {
      const itemData = item.export();
      itemData.errors = Object.values(item.getErrors());
      return itemData;
    });
    return data;
  }
}

module.exports = {
  Cart,
  createNewCart: async (initialData) => {
    const cart = new Cart(initialData);
    await cart.build();
    return cart;
  },
  getCart: async (uuid) => {
    const cart = await select()
      .from('cart')
      .where('uuid', '=', uuid)
      .load(pool);
    if (!cart || cart.status !== true) {
      throw new Error('Cart not found');
    }
    const cartObject = new Cart(cart);
    // Get the cart items
    const items = await select()
      .from('cart_item')
      .orderBy('created_at', 'DESC')
      .where('cart_id', '=', cart.cart_id)
      .execute(pool);
    // Build the cart items
    const cartItems = [];
    await Promise.all(
      items.map(async (item) => {
        const cartItem = new Item(cartObject, {
          ...item
        });
        await cartItem.build();
        cartItems.push(cartItem);
      })
    );

    const finalItems = await getValue('cartInitialItems', cartItems, {
      cart: cartObject,
      unique: uuidv4() // To make sure the value will not be cached
    });
    await cartObject.setData('items', finalItems);
    return cartObject;
  }
};

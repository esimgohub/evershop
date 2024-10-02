const ShortUniqueId = require('short-unique-id');
const { select } = require('@evershop/postgres-query-builder');

/**
 * CouponBuilder class to build and configure coupon objects.
 */
class CouponBuilder {
  constructor() {
    /**
     * Default coupon data with pre-set values.
     * @type {Object}
     */
    this.couponData = {
      coupon: null, // Required: The coupon code
      status: 1, // Active by default
      discount_amount: 0, // Default discount amount
      discount_type: 'fixed_discount_to_entire_order', // Default discount type (fixed amount)
      max_uses_time_per_coupon: 1, // Default 1 use per coupon
      max_uses_time_per_customer: 1, // Default 1 use per customer
      is_private: 1, // Private coupon by default
      user_condition: { emails: '', groups: [''], purchased: '' },
      condition: { order_qty: '', order_total: '', first_purchase: false },
      description: '' // Required: A description for the coupon
    };
  }

  /**
   * Set the coupon code.
   * @param {string} couponCode - The unique coupon code. Required.
   * @returns {CouponBuilder} - The current instance of CouponBuilder for chaining.
   */
  setCoupon(couponCode) {
    this.couponData.coupon = couponCode;
    return this;
  }

  /**
   * Set the discount amount and type.
   * @param {number} amount - The discount amount. Required.
   * @param {string} [type='percentage'] - The discount type (e.g., 'fixed' or 'percentage').
   * @returns {CouponBuilder} - The current instance of CouponBuilder for chaining.
   */
  setDiscount(amount, type = 'percentage') {
    this.couponData.discount_amount = amount;
    this.couponData.discount_type = type === 'percentage' ? 'percentage_discount_to_entire_order' : 'fixed_discount_to_entire_order';
    return this;
  }

  /**
   * Set the maximum uses per coupon.
   * @param {number} maxUses - The maximum number of times the coupon can be used.
   * If set to 0, the coupon has unlimited uses. Optional. Default is 1.
   * @returns {CouponBuilder} - The current instance of CouponBuilder for chaining.
   */
  setMaxUsesPerCoupon(maxUses) {
    this.couponData.max_uses_time_per_coupon = maxUses;
    return this;
  }

  /**
   * Set the maximum uses per customer.
   * @param {number} maxUses - The maximum number of times a customer can use the coupon.
   * If set to 0, the customer has unlimited uses of the coupon. Optional. Default is 1.
   * @returns {CouponBuilder} - The current instance of CouponBuilder for chaining.
   */
  setMaxUsesPerCustomer(maxUses) {
    this.couponData.max_uses_time_per_customer = maxUses;
    return this;
  }

  /**
   * Set the privacy status of the coupon.
   * @param {number} isPrivate - Whether the coupon is private. Must be 0 (public) or 1 (private). Required.
   * @returns {CouponBuilder} - The current instance of CouponBuilder for chaining.
   */
  setPrivate(isPrivate) {
    this.couponData.is_private = isPrivate;
    return this;
  }

  /**
   * Set user conditions such as emails, groups, and purchase history.
   * @param {string} [emails=''] - User-specific email conditions. Optional.
   * @param {Array<string>} [groups=['']] - User-specific group conditions. Optional.
   * @param {string} [purchased=''] - User purchase condition. Optional.
   * @returns {CouponBuilder} - The current instance of CouponBuilder for chaining.
   */
  setUserCondition(emails = '', groups = [''], purchased = '') {
    this.couponData.user_condition = { emails, groups, purchased };
    return this;
  }

  /**
   * Set order conditions such as quantity, total value, and whether it's a first purchase.
   * @param {string} [orderQty=''] - The required order quantity. Optional.
   * @param {string} [orderTotal=''] - The required order total value. Optional.
   * @param {boolean} [firstPurchase=false] - Whether the coupon applies to the user's first purchase. Optional.
   * @returns {CouponBuilder} - The current instance of CouponBuilder for chaining.
   */
  setCondition(orderQty = '', orderTotal = '', firstPurchase = false) {
    this.couponData.condition = {
      order_qty: orderQty,
      order_total: orderTotal,
      first_purchase: firstPurchase
    };
    return this;
  }

  /**
   * Set the coupon description.
   * @param {string} description - A description of the coupon. Required.
   * @returns {CouponBuilder} - The current instance of CouponBuilder for chaining.
   */
  setDescription(description) {
    this.couponData.description = description;
    return this;
  }

  /**
   * Build and return the configured coupon object.
   * @throws {Error} If required fields (coupon code or description) are missing.
   * @returns {Object} - The final coupon data object.
   */
  build() {
    if (!this.couponData.coupon) {
      throw new Error('Coupon code is required!');
    }
    if (!this.couponData.description) {
      throw new Error('Coupon description is required!');
    }
    return this.couponData;
  }
}

const generateCoupon = (firstName) => {
  // Sanitize the firstName: remove non-alphanumeric characters
  const sanitizedName = firstName.replace(/[^a-zA-Z0-9]/g, '');

  // Take the first 3 characters of the sanitized name, or pad with 'A' if shorter
  // const prefix = `${sanitizedName}AAA`.slice(0, 3);

  // Generate 6 random alphanumeric characters
  const uid = new ShortUniqueId({ length: 3 });
  const randomPart = uid.randomUUID();

  // Add a timestamp-based component (last 3 digits of current timestamp)
  const timestampPart = Date.now().toString().slice(-4);

  // Combine the prefix, random part, and timestamp part
  return `${sanitizedName}${randomPart}${timestampPart}`.toUpperCase();
};

const generateReferralCode = async (firstName, pool) => {
  let nextReferralCode;
  let flag = false;
  do {
    const temp = generateCoupon(firstName ?? 'Bear')
    const foundCoupon = await select()
      .from('coupon', 'c')
      .where('c.coupon', '=', temp)
      .load(pool);
    if (!foundCoupon) {
      nextReferralCode = temp;
      flag = true;
    }
  } while (!flag)

  return nextReferralCode;
};

module.exports = {
  CouponBuilder,
  generateReferralCode
};

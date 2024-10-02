const ShortUniqueId = require('short-unique-id');
const { select } = require('@evershop/postgres-query-builder');

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

module.exports = async (firstName, pool) => {
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

const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { getValue } = require('@evershop/evershop/src/lib/util/registry');

class CouponCollection {
  constructor(baseQuery) {
    this.baseQuery = baseQuery;
  }

  async init(filters, context) {
    const currentFilters = [];

    // Apply the filters
    const couponCollectionFilters = await getValue(
      'couponCollectionFilters',
      []
    );

    couponCollectionFilters.forEach((filter) => {
      const check = filters.find(
        (f) => f.key === filter.key && filter.operation.includes(f.operation)
      );
      if (filter.key === '*' || check) {
        filter.callback(
          this.baseQuery,
          check?.operation,
          check?.value,
          currentFilters
        );
      }
    });

    this.page = context.page;
    this.perPage = context.perPage;
    this.customerId = context.customerId;
    this.specificCoupon = context.coupon;

    if (this.customerId) {
      const where = this.baseQuery.getWhere();
      where.addRaw(
        'AND',
        `
          ((coupon."coupon" = '${this.specificCoupon}') OR (coupon."is_private" = FALSE) OR (coupon."is_referral_code" = TRUE) OR (coupon."coupon" IN (
            SELECT coupon
            FROM customer_coupon_use
            WHERE (customer_coupon_use."customer_id" = '${this.customerId}')
            AND customer_coupon_use."used_time" < coupon."max_uses_time_per_customer"
          ))) AND ((COALESCE(coupon."max_uses_time_per_coupon", 0) = 0) OR (coupon."used_time" < coupon."max_uses_time_per_coupon"))
        `
      );
    }

    const totalQuery = this.baseQuery.clone();

    totalQuery.select('COUNT(coupon.coupon_id)', 'total');
    totalQuery.removeOrderBy();
    totalQuery.removeLimit();

    this.currentFilters = currentFilters;
    this.totalQuery = totalQuery;
  }

  async isCanLoadMore() {
    const res = await this.totalQuery.execute(pool);
    const total = res[0]?.total;
    const endIndex = this.page * this.perPage;
    return endIndex < Number(total);
  }

  async items() {
    const items = await this.baseQuery.execute(pool);
    return items.map((row) => camelCase(row));
  }

  async total() {
    // Call items to get the total
    const total = await this.totalQuery.execute(pool);
    return total[0].total;
  }

  currentFilters() {
    return this.currentFilters;
  }
}

module.exports.CouponCollection = CouponCollection;

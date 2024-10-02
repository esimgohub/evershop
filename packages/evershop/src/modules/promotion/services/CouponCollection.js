const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { getValue } = require('@evershop/evershop/src/lib/util/registry');
const { select } = require('@evershop/postgres-query-builder');

class CouponCollection {
  constructor(baseQuery) {
    this.baseQuery = baseQuery;
    this.baseQuery.orderBy('coupon.is_private', 'DESC');
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
    // Clone the main query for getting total right before doing the paging
    const totalQuery = this.baseQuery.clone();
    totalQuery.select('COUNT(coupon.coupon_id)', 'total');
    totalQuery.removeOrderBy();
    totalQuery.removeLimit();

    this.currentFilters = currentFilters;
    this.totalQuery = totalQuery;
  }

  async isCanLoadMore() {
    const res = await this.totalQuery.execute(pool);
    const total = res[0]?.total
    const  endIndex = this.page * this.perPage;
    return endIndex < Number(total)
  }

  async items() {
    // todo: or de cuoi cung
    // todo: if customer have referred_code
    // OK: check if customer have DONT HAVE order payment_status===paid -> find specific
    const customerQuery = select('customer.referral_code', 'referred_code')
      .from('customer');
    const currentCustomer = await customerQuery.load(pool);
    if (currentCustomer.referred_code) {
      this.baseQuery.orWhere('coupon.coupon', '=', currentCustomer.referred_code);
    }

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

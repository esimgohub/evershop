const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { getValue } = require('@evershop/evershop/src/lib/util/registry');

class CurrencyCollection {
  constructor(baseQuery) {
    this.baseQuery = baseQuery;
  }

  async init(filters = []) {
    const currentFilters = [];

    // Apply the filters
    const currencyCollectionFilters = await getValue(
      'currencyCollectionFilters',
      []
    );

    currencyCollectionFilters.forEach((filter) => {
      const check = filters.find((f) => f.key === filter.key);
      if (check) {
        if (filter.operation.includes(check.operation)) {
          filter.callback(
            this.baseQuery,
            check.operation,
            check.value,
            currentFilters
          );
        }
      }
    });

    // Clone the main query for getting total right before doing the paging
    const totalQuery = this.baseQuery.clone();
    totalQuery.select('COUNT(currency.id)', 'total');
    totalQuery.removeOrderBy();
    totalQuery.removeLimit();

    this.currentFilters = currentFilters;
    this.totalQuery = totalQuery;
  }

  async items() {
    const items = await this.baseQuery.execute(pool);
    return items.map((row) => camelCase(row));
  }

  async total() {
    // Call items to get the total
    const total = await this.totalQuery.execute(pool);

    // Note: - 1 mean exclude USD currency
    return total[0].total - 1;
  }

  currentFilters() {
    return this.currentFilters;
  }
}

module.exports.CurrencyCollection = CurrencyCollection;

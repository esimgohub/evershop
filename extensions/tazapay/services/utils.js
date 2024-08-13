const dayjs = require('dayjs');
const duration = require('dayjs/plugin/duration');
dayjs.extend(duration);

module.exports = {
  /**
   * Calculates a new timestamp 10 minutes ahead of the given expires_at time.
   * @returns {string} - The new timestamp 10 minutes ahead in ISO 8601 format.
   */
  calculateExpiryPlus10Minutes: function() {
    // Parse the input timestamp
    const expiresAtDate = dayjs(new Date());

    // Add 10 minutes to the parsed time
    const newDate = expiresAtDate.add(10, 'minute');

    // Return the new timestamp in ISO 8601 format
    return newDate.toISOString();
  }
};
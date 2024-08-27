const dayjs = require('dayjs');
const duration = require('dayjs/plugin/duration');
dayjs.extend(duration);

module.exports = {
  /**
   * Calculates a new timestamp 10 minutes ahead of the given expires_at time.
   * @param {number} minutes - The number of minutes to add to the current time.
   * @returns {string} - The new timestamp 10 minutes ahead in ISO 8601 format.
   */
  calculateExpiry: function(minutes) {
    // Parse the input timestamp
    const expiresAtDate = dayjs(new Date());

    // Add 10 minutes to the parsed time
    const newDate = expiresAtDate.add(minutes, 'minute');

    // Return the new timestamp in ISO 8601 format
    return newDate.toISOString();
  }
};
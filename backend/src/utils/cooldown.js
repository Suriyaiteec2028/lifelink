/**
 * LifeLink - Configurable Donation Cooldown Utility
 * Handles calculation and checking of donation waiting periods (default 6 calendar months).
 */

const DEFAULT_COOLDOWN_MONTHS = parseInt(process.env.COOLDOWN_MONTHS || '6', 10);

/**
 * Calculates the next eligible donation date by adding configured months to the donation/acceptance date.
 * @param {Date|string} fromDate - The acceptance/donation date
 * @param {number} [months=DEFAULT_COOLDOWN_MONTHS] - Cooldown duration in months
 * @returns {Date} The next eligible date
 */
const calculateNextEligibleDate = (fromDate, months = DEFAULT_COOLDOWN_MONTHS) => {
  const date = new Date(fromDate || Date.now());
  const targetMonth = date.getMonth() + months;
  date.setMonth(targetMonth);
  return date;
};

/**
 * Checks whether a given nextEligibleDate is still in the cooldown period.
 * @param {Date|string} nextEligibleDate
 * @param {Date} [currentDate=new Date()]
 * @returns {boolean} True if still in cooldown (not yet eligible)
 */
const isInCooldown = (nextEligibleDate, currentDate = new Date()) => {
  if (!nextEligibleDate) return false;
  const eligible = new Date(nextEligibleDate);
  const now = new Date(currentDate);
  return eligible > now;
};

module.exports = {
  DEFAULT_COOLDOWN_MONTHS,
  calculateNextEligibleDate,
  isInCooldown
};

/**
 * LifeLink - Age Calculation and Validation Utility
 * Validates that users are at least 18 years old based on full date of birth (year, month, day).
 */

const MIN_DONOR_AGE = 18;

/**
 * Calculates accurate age from date of birth.
 * Takes into account day, month, and year.
 * @param {Date|string} dob - Date of birth
 * @param {Date} [currentDate=new Date()] - Reference date (default today)
 * @returns {number} Age in full completed years
 */
const calculateAge = (dob, currentDate = new Date()) => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) {
    throw new Error('Invalid date of birth provided.');
  }

  const ref = new Date(currentDate);
  let age = ref.getFullYear() - birthDate.getFullYear();
  const m = ref.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && ref.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Validates if the given date of birth is at least 18 years old.
 * @param {Date|string} dob
 * @returns {boolean}
 */
const isAgeEligible = (dob) => {
  return calculateAge(dob) >= MIN_DONOR_AGE;
};

module.exports = {
  MIN_DONOR_AGE,
  calculateAge,
  isAgeEligible
};

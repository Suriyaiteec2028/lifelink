/**
 * LifeLink - Red-Blood-Cell Donor Compatibility Mapping
 *
 * Configurable compatibility table based on medical standards:
 * - A+  can receive: A+, A-, O+, O-
 * - A-  can receive: A-, O-
 * - B+  can receive: B+, B-, O+, O-
 * - B-  can receive: B-, O-
 * - O+  can receive: O+, O-
 * - O-  can receive: O-
 * - AB+ can receive: All listed groups (A+, A-, B+, B-, O+, O-, AB+, AB-)
 * - AB- can receive: AB-, A-, B-, O-
 */

const RBC_COMPATIBILITY_MAP = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-']
};

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

/**
 * Returns an array of compatible donor blood groups for a given required blood group.
 * @param {string} requestedBloodGroup
 * @returns {string[]}
 */
const getCompatibleDonorGroups = (requestedBloodGroup) => {
  return RBC_COMPATIBILITY_MAP[requestedBloodGroup] || [];
};

/**
 * Checks whether a donor blood group is compatible with the requested blood group.
 * @param {string} requestedGroup
 * @param {string} donorGroup
 * @returns {boolean}
 */
const isBloodCompatible = (requestedGroup, donorGroup) => {
  const compatibleList = getCompatibleDonorGroups(requestedGroup);
  return compatibleList.includes(donorGroup);
};

module.exports = {
  RBC_COMPATIBILITY_MAP,
  VALID_BLOOD_GROUPS,
  getCompatibleDonorGroups,
  isBloodCompatible
};

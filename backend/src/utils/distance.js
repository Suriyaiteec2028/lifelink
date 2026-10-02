/**
 * LifeLink - Geographical Distance Calculation (Haversine Formula)
 * Calculates the great-circle distance between two points on the Earth given their latitudes and longitudes.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates distance in kilometers between two geographical coordinate pairs.
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers rounded to two decimal places
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    throw new Error('All coordinates (lat1, lon1, lat2, lon2) must be provided.');
  }

  const p1 = Number(lat1);
  const l1 = Number(lon1);
  const p2 = Number(lat2);
  const l2 = Number(lon2);

  if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) {
    throw new Error('Coordinates must be valid numbers.');
  }

  // Same point optimization
  if (p1 === p2 && l1 === l2) {
    return 0;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(p2 - p1);
  const dLon = toRad(l2 - l1);

  const lat1Rad = toRad(p1);
  const lat2Rad = toRad(p2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Number(distance.toFixed(2));
};

module.exports = {
  calculateDistanceKm,
  EARTH_RADIUS_KM
};

// Utility function for calculating percentage variation between two prices
// Used for computing 24-hour price changes
function calculateVariation(currentPrice, previousPrice) {
  // Convert inputs to numbers to handle string inputs
  const current = Number(currentPrice);
  const previous = Number(previousPrice);

  // Guard against division by zero or invalid previous price
  if (!previous || previous === 0) {
    return null;
  }

  // Calculate percentage change: ((current - previous) / previous) * 100
  // Round to 4 decimal places for consistent precision
  return Number((((current - previous) / previous) * 100).toFixed(4));
}

module.exports = calculateVariation;

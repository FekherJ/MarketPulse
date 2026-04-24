function calculateVariation(currentPrice, previousPrice) {
  const current = Number(currentPrice);
  const previous = Number(previousPrice);

  if (!previous || previous === 0) {
    return null;
  }

  return Number((((current - previous) / previous) * 100).toFixed(4));
}

module.exports = calculateVariation;

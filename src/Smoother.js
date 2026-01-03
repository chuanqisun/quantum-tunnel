/**
 * A simple smoothing class using Exponential Moving Average (EMA).
 * It provides a smooth transition towards a target value while remaining
 * responsive to changes.
 */
export class Smoother {
  /**
   * @param {number} factor - The smoothing factor between 0 and 1.
   * Higher values are more responsive but less smooth.
   * Lower values are smoother but have more latency.
   */
  constructor(factor = 0.15) {
    this.factor = factor;
    this.currentValue = null;
  }

  /**
   * Updates the smoother with a new target value and returns the smoothed result.
   * @param {number} target - The new raw value to smooth towards.
   * @returns {number} The smoothed value.
   */
  next(target) {
    if (this.currentValue === null) {
      this.currentValue = target;
    } else {
      // EMA formula: current = current + (target - current) * factor
      this.currentValue += (target - this.currentValue) * this.factor;
    }
    return this.currentValue;
  }

  /**
   * Resets the smoother to a specific value.
   * @param {number|null} value - The value to reset to.
   */
  reset(value = null) {
    this.currentValue = value;
  }
}

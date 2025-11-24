export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Return a float between 0 and 1
   */
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Helper : return a float between min and max
   */
  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Helper : return an int between min and max (inclusive)
   */
  int(min: number, max: number): number {
    return Math.floor(this.float(min, max + 1));
  }
}

// @flow

type SecondsAndNanoSeconds = [number, number];

export class Timer {
  startTime: SecondsAndNanoSeconds;

  constructor() {
    this.startTime = process.hrtime();
  }

  elapsedTimeInNanoseconds(): number {
    const NS_PER_SEC = 1e9;
    const [seconds, nanoseconds] = process.hrtime(this.startTime);
    return seconds * NS_PER_SEC + nanoseconds;
  }
}

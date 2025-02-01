class TimerManagementService {
  constructor() {
    this.timers = new Map();
  }

  setGameTimer(gameId, phase, timer) {
    const key = `${gameId}-${phase}`;
    this.clearGameTimer(gameId, phase);
    this.timers.set(key, timer);
  }

  clearGameTimer(gameId, phase) {
    const key = `${gameId}-${phase}`;
    const timer = this.timers.get(key);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(key);
    }
  }

  clearAllTimers() {
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers.clear();
  }
}

module.exports = TimerManagementService;
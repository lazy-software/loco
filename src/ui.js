export class UI {
  constructor(train, audioManager) {
    this.train = train;
    this.audioManager = audioManager;
    
    this.throttleElement = document.getElementById('throttle');
    this.speedOdometer = document.getElementById('speedometer');

    this.throttleElement.addEventListener('input', (e) => {
      if (this.audioManager) this.audioManager.init(); 
      this.train.setThrottle(parseFloat(e.target.value));
    });

    // Reset throttle to zero if we double click the slider
    this.throttleElement.addEventListener('dblclick', () => {
      this.throttleElement.value = 0;
      this.train.setThrottle(0);
    });
  }

  update() {
    // Update speedometer text
    // Convert units/sec to roughly mph for display (1 unit = 1 meter)
    // 1 m/s = 2.23 mph
    const speedMilesPerHour = Math.abs(this.train.velocity * 2.23);
    this.speedOdometer.innerText = `${Math.round(speedMilesPerHour)} mph`;
  }
}

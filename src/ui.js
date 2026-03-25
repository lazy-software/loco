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

    // Double-click thumb to snap to Zero (Middle) immediately
    this.throttleElement.addEventListener('dblclick', () => {
      this.throttleElement.value = 0;
      this.train.setThrottle(0);
    });
  }

  update() {
    const speedMilesPerHour = Math.abs(this.train.velocity * 2.23);
    this.speedOdometer.innerText = `${Math.round(speedMilesPerHour)} mph`;
    
    // Add visual styling to speedometer based on speed
    if (Math.round(speedMilesPerHour) > 100) {
       this.speedOdometer.style.color = '#f43f5e';
    } else if (Math.round(speedMilesPerHour) > 0) {
       this.speedOdometer.style.color = '#4ade80';
    } else {
       this.speedOdometer.style.color = 'white';
    }
  }
}

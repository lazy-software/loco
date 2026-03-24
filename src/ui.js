export class UI {
  constructor(train, audioManager) {
    this.train = train;
    this.audioManager = audioManager;
    
    this.gear = 0; // -5 (Max Brake) to 5 (Full Power)
    this.speedOdometer = document.getElementById('speedometer');
    this.gearIndicator = document.getElementById('gear-indicator');

    document.getElementById('btn-down').addEventListener('click', () => this.shiftGear(-1));
    document.getElementById('btn-up').addEventListener('click', () => this.shiftGear(1));
  }

  shiftGear(delta) {
    if (this.audioManager) this.audioManager.init();
    
    this.gear += delta;
    if (this.gear > 5) this.gear = 5;
    if (this.gear < -5) this.gear = -5;

    // Visual formatting mapping F1-F5 and B1-B5
    if (this.gear > 0) {
      this.gearIndicator.innerText = `F${this.gear}`;
      this.gearIndicator.style.color = '#4ade80'; // Green
    } else if (this.gear < 0) {
      this.gearIndicator.innerText = `B${Math.abs(this.gear)}`;
      this.gearIndicator.style.color = '#f43f5e'; // Red
    } else {
      this.gearIndicator.innerText = '0';
      this.gearIndicator.style.color = 'white';
    }

    // Convert -5..5 back to the -1.0..1.0 physics engine constraint natively
    this.train.setThrottle(this.gear / 5.0);
  }

  update() {
    // Update speedometer text
    // Convert units/sec to roughly mph for display (1 unit = 1 meter)
    // 1 m/s = 2.23 mph
    const speedMilesPerHour = Math.abs(this.train.velocity * 2.23);
    this.speedOdometer.innerText = `${Math.round(speedMilesPerHour)} mph`;
  }
}

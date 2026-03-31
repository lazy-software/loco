export class UI {
  constructor(train, audioManager) {
    this.train = train;
    this.audioManager = audioManager;
    
    this.throttleElement = document.getElementById('throttle');

    this.cameraMode = 0; // Default: Left Chase
    this.camButtons = document.querySelectorAll('.cam-btn');
    this.camButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.target.hasAttribute('data-cam')) {
          this.cameraMode = parseInt(e.target.getAttribute('data-cam'));
          this.updateCameraUI();
        }
      });
    });
    this.updateCameraUI();

    this.throttleElement.addEventListener('input', (e) => {
      if (this.audioManager) this.audioManager.init(); 
      this.train.setThrottle(parseFloat(e.target.value));
    });

    // Double-click thumb to snap to Zero (Middle) immediately
    this.throttleElement.addEventListener('dblclick', () => {
      this.throttleElement.value = 0;
      this.train.setThrottle(0);
    });

    this.doorBtn = document.getElementById('door-btn');
    if (this.doorBtn) {
      this.doorBtn.addEventListener('click', () => {
        // Toggle 0 / 1
        this.train.doorsState = this.train.doorsState === 1 ? 0 : 1;
        const isOpen = this.train.doorsState === 1;
        this.doorBtn.innerText = isOpen ? '🚪 Close Doors' : '🚪 Open Doors';
        this.doorBtn.classList.toggle('active', isOpen);
        
        if (this.audioManager) {
          this.audioManager.playDoorChime(isOpen);
        }
      });
    }
  }

  updateCameraUI() {
    this.camButtons.forEach(btn => {
      if (parseInt(btn.getAttribute('data-cam')) === this.cameraMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}

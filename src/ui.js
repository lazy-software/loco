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
        
        const svgClosed = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/><path d="M14 12v.01"/></svg>`;
        const svgOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M14 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M14 20v-4l9 3v-18l-9 3z"/><path d="M10 12v.01"/></svg>`;
        
        this.doorBtn.innerHTML = isOpen ? svgOpen : svgClosed;
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

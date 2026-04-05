export class UI {
  constructor(train, audioManager) {
    this.train = train;
    this.audioManager = audioManager;
    
    this.throttleElement = document.getElementById('throttle');

    this.cameraMode = 0; // Default: Left Chase
    const totalCams = 5;
    
    const prevBtn = document.getElementById('cam-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.cameraMode = (this.cameraMode - 1 + totalCams) % totalCams;
        this.updateCameraUI();
      });
    }

    const nextBtn = document.getElementById('cam-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.cameraMode = (this.cameraMode + 1) % totalCams;
        this.updateCameraUI();
      });
    }

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
        
        const svgClosed = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" /><path d="M12 3v18" /><path d="M2 21h20" /></svg>`;
        const svgOpen = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" /><path d="M7 3v18" /><path d="M17 3v18" /><path d="M2 21h20" /></svg>`;
        
        this.doorBtn.innerHTML = isOpen ? svgOpen : svgClosed;
        this.doorBtn.classList.toggle('active', isOpen);
        
        if (this.audioManager) {
          this.audioManager.init(); // browser requires user gesture
          this.audioManager.playDoorChime(isOpen);
        }
      });
    }

    this.hornBtn = document.getElementById('horn-btn');
    if (this.hornBtn) {
      const startHorn = () => {
        if (this.audioManager) {
          this.audioManager.init();
          this.audioManager.playHorn(true);
        }
        this.hornBtn.classList.add('active');
      };
      
      const stopHorn = () => {
        if (this.audioManager) {
          this.audioManager.playHorn(false);
        }
        this.hornBtn.classList.remove('active');
      };

      this.hornBtn.addEventListener('mousedown', startHorn);
      this.hornBtn.addEventListener('mouseup', stopHorn);
      this.hornBtn.addEventListener('mouseleave', stopHorn);
      this.hornBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHorn(); }, { passive: false });
      this.hornBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopHorn(); }, { passive: false });
      this.hornBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); stopHorn(); }, { passive: false });
    }
  }

  updateCameraUI() {
    const indicator = document.getElementById('cam-indicator');
    if (indicator) {
      indicator.title = `Camera ${this.cameraMode + 1}/5`;
    }
  }
}

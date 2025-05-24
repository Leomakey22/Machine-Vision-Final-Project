import WebcamHandler from './webcam.js';
import BackgroundReplacer from './backgroundReplacer.js';

class App {
    constructor() {
        this.webcam = new WebcamHandler();
        this.backgroundReplacer = new BackgroundReplacer();
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.isProcessing = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', async () => {
            try {
                console.log('Starting camera...');
                const started = await this.webcam.startCamera();
                
                if (started) {
                    console.log('Camera started successfully');
                    this.startBtn.disabled = true;
                    this.stopBtn.disabled = false;
                    
                    console.log('Initializing background replacer...');
                    await this.backgroundReplacer.initialize();
                    
                    this.isProcessing = true;
                    this.startBackgroundReplacement();
                } else {
                    console.error('Failed to start camera');
                    alert('Could not start camera. Please check your camera permissions and try again.');
                }
            } catch (error) {
                console.error('Error in start button handler:', error);
                alert('An error occurred while starting the camera. Please try again.');
            }
        });

        this.stopBtn.addEventListener('click', () => {
            this.backgroundReplacer.stopProcessing();
            this.webcam.stopCamera();
            this.startBtn.disabled = false;
            this.stopBtn.disabled = true;
        });

        // Add listener for background color changes
        const bgColor = document.getElementById('bgColor');
        bgColor.addEventListener('input', () => {
            // Color changes will be picked up automatically in the next frame
        });
    }

    startBackgroundReplacement() {
        const bgType = document.getElementById('bgType');
        const bgColor = document.getElementById('bgColor');
        
        const processFrame = async () => {
            if (this.isProcessing && this.webcam.stream) {
                try {
                    await this.backgroundReplacer.replaceBackground(
                        this.webcam.video,
                        bgColor.value
                    );
                } catch (error) {
                    console.error('Frame processing error:', error);
                }
                
                // Continue the animation loop
                requestAnimationFrame(processFrame);
            }
        };

        // Start the animation loop
        requestAnimationFrame(processFrame);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});

import WebcamHandler from './webcam.js';
import FaceDetector from './faceDetector.js';
import BackgroundReplacer from './backgroundReplacer.js';

document.addEventListener('DOMContentLoaded', async () => {
    const webcam = new WebcamHandler();
    const faceDetector = new FaceDetector();
    const backgroundReplacer = new BackgroundReplacer();
    
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const bgType = document.getElementById('bgType');
    const bgColor = document.getElementById('bgColor');
    const bgImage = document.getElementById('bgImage');

    // Initialize components
    await Promise.all([
        faceDetector.initialize(),
        backgroundReplacer.initialize()
    ]);

    // Handle background image upload
    bgImage.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const img = new Image();
            img.onload = () => {
                backgroundReplacer.setCustomBackground(img);
            };
            img.src = URL.createObjectURL(file);
        }
    });

    startBtn.addEventListener('click', async () => {
        try {
            startBtn.disabled = true;
            startBtn.textContent = 'Starting...';
            
            await webcam.start();
            faceDetector.start();
            
            // Start processing loop
            processFrame();
            
            startBtn.textContent = 'Camera Active';
            stopBtn.disabled = false;
        } catch (error) {
            console.error('Failed to start:', error);
            startBtn.disabled = false;
            startBtn.textContent = 'Start Camera';
            alert('Failed to start camera. Please check permissions.');
        }
    });

    stopBtn.addEventListener('click', () => {
        webcam.stop();
        faceDetector.stop();
        startBtn.disabled = false;
        startBtn.textContent = 'Start Camera';
        stopBtn.disabled = true;
    });

    async function processFrame() {
        if (!webcam.isActive()) return;

        // Update face detection
        await faceDetector.detectFace(webcam.video);

        // Update background
        const useImage = bgType.value === 'image';
        const background = useImage ? null : bgColor.value;
        await backgroundReplacer.replaceBackground(webcam.video, background, useImage);

        requestAnimationFrame(processFrame);
    }
});
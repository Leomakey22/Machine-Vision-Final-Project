// This file implements the background replacement logic for the webcam feed.

class BackgroundReplacer {
    constructor() {
        this.canvas = document.getElementById('output');
        this.ctx = this.canvas.getContext('2d');
        this.segmenter = null;
        this.customBackground = null;
        this.previousMask = null;
        this.stabilityThreshold = 0.7;
        this.smoothingFactor = 0.8;
        this.animationFrameId = null;

        // Add background type handling
        this.bgType = document.getElementById('bgType');
        this.bgColor = document.getElementById('bgColor');
        this.bgImage = document.getElementById('bgImage');
        
        // Setup background change listeners
        this.setupBackgroundListeners();

        this.lastFrameTime = 0;
        this.frameInterval = 1000 / 30; // Cap at 30fps
        this.processingFrame = false;
    }

    setupBackgroundListeners() {
        this.bgType.addEventListener('change', () => {
            const isImage = this.bgType.value === 'image';
            this.bgColor.style.display = isImage ? 'none' : 'block';
            this.bgImage.style.display = isImage ? 'block' : 'none';
        });

        this.bgImage.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.customBackground = new Image();
                    this.customBackground.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    async initialize() {
        try {
            // Initialize BodyPix with more stable settings
            this.segmenter = await bodyPix.load({
                architecture: 'MobileNetV1',
                outputStride: 16,
                multiplier: 1.0,
                quantBytes: 4
            });
            console.log('Background segmentation model loaded');
        } catch (error) {
            console.error('Failed to load background segmentation model:', error);
            throw error;
        }
    }

    async replaceBackground(video, background, isImage = false) {
        // Skip if still processing previous frame
        if (this.processingFrame) return;
        
        // Limit frame rate
        const now = performance.now();
        if (now - this.lastFrameTime < this.frameInterval) {
            requestAnimationFrame(() => this.replaceBackground(video, background, isImage));
            return;
        }

        this.processingFrame = true;
        this.lastFrameTime = now;

        try {
            // Use lower resolution for segmentation
            const segmentation = await this.segmenter.segmentPerson(video, {
                flipHorizontal: false,
                internalResolution: 'medium',
                segmentationThreshold: 0.7,
                maxDetections: 1,
                scoreThreshold: 0.7
            });

            // Match canvas size to video
            if (this.canvas.width !== video.videoWidth || 
                this.canvas.height !== video.videoHeight) {
                this.canvas.width = video.videoWidth;
                this.canvas.height = video.videoHeight;
            }

            // Draw video frame
            this.ctx.drawImage(video, 0, 0);
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const pixels = imageData.data;

            // Handle background based on type
            if (this.bgType.value === 'image' && this.customBackground) {
                // Draw custom image background
                this.ctx.drawImage(this.customBackground, 0, 0, this.canvas.width, this.canvas.height);
                const bgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                const bgPixels = bgData.data;

                // Blend person with custom background
                for (let i = 0; i < segmentation.data.length; i++) {
                    if (segmentation.data[i] === 0) {
                        const pixelIndex = i * 4;
                        pixels[pixelIndex] = bgPixels[pixelIndex];
                        pixels[pixelIndex + 1] = bgPixels[pixelIndex + 1];
                        pixels[pixelIndex + 2] = bgPixels[pixelIndex + 2];
                        pixels[pixelIndex + 3] = 255;
                    }
                }
            } else {
                // Apply solid color background
                const bgColor = this.hexToRgb(this.bgColor.value);
                for (let i = 0; i < segmentation.data.length; i++) {
                    if (segmentation.data[i] === 0) {
                        const pixelIndex = i * 4;
                        pixels[pixelIndex] = bgColor.r;
                        pixels[pixelIndex + 1] = bgColor.g;
                        pixels[pixelIndex + 2] = bgColor.b;
                        pixels[pixelIndex + 3] = 255;
                    }
                }
            }

            // Update canvas
            this.ctx.putImageData(imageData, 0, 0);

        } catch (error) {
            console.error('Background replacement error:', error);
        } finally {
            this.processingFrame = false;
        }
    }

    // Stop the animation loop when needed
    stopProcessing() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    // Helper method to convert hex color to RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 255, b: 0 }; // Default to green if invalid hex
    }
}

// Export the function
export default BackgroundReplacer;
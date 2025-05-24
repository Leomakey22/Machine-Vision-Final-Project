class WebcamHandler {
    constructor() {
        this.video = document.getElementById('webcam');
        if (!this.video) {
            console.error('Video element not found!');
        }
        this.stream = null;
        this.debug = true; // Enable detailed logging
        this.frameRate = 30; // Optimal frame rate
    }

    async checkCameraAvailability() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia is not supported in this browser');
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            if (this.debug) {
                console.log('All devices:', devices);
                console.log('Video devices:', videoDevices);
            }
            
            if (videoDevices.length === 0) {
                throw new Error('No camera devices found');
            }
            
            console.log('Found cameras:', videoDevices.map(d => d.label || 'Unnamed Camera'));
            return true;
        } catch (error) {
            console.error('Camera check failed:', error);
            return false;
        }
    }

    async startCamera() {
        try {
            console.log('Starting camera initialization...');
            const hasCamera = await this.checkCameraAvailability();
            if (!hasCamera) {
                throw new Error('No camera available');
            }

            // Stop any existing streams
            this.stopCamera();
            
            console.log('Requesting camera access...');
            // Request camera with optimized constraints
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: this.frameRate },
                    facingMode: 'user'
                },
                audio: false
            });

            console.log('Stream obtained:', this.stream.active);
            this.video.srcObject = this.stream;
            
            return new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    console.log('Video metadata loaded');
                    this.video.play()
                        .then(() => {
                            console.log('Video playback started');
                            this.video.style.display = 'block'; // Ensure video is visible
                            resolve(true);
                        })
                        .catch(error => {
                            console.error('Video playback failed:', error);
                            resolve(false);
                        });
                };

                this.video.onerror = (error) => {
                    console.error('Video element error:', error);
                    resolve(false);
                };
            });

        } catch (error) {
            console.error('Camera access error:', error);
            return false;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
                console.log('Camera track stopped:', track.label);
            });
            this.video.srcObject = null;
            this.stream = null;
        }
    }
}

export default WebcamHandler;
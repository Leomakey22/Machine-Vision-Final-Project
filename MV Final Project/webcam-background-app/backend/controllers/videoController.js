const processVideo = (req, res) => {
    // Logic for processing video data
    res.send("Video processing initiated.");
};

const getWebcamStream = (req, res) => {
    // Logic for accessing the webcam stream
    res.send("Webcam stream accessed.");
};

module.exports = {
    processVideo,
    getWebcamStream
};
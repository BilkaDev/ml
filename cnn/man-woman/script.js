class Vision {
    #ESTIMATION_CONFIG = {flipHorizontal: false};

    constructor(detector) {
        this.detector = detector
    }

    static async build() {
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig = {
            runtime: 'mediapipe',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
        };
        const detector = await faceDetection.createDetector(model, detectorConfig);
        return new Vision(detector)
    }

    async getFaces(video) {
        return await this.detector.estimateFaces(video, this.#ESTIMATION_CONFIG);
    }
}

class VideoModel {
    constructor() {
    }

    setupCamera(videoElement) {
        return navigator.mediaDevices.getUserMedia({
            video: {width: 600, height: 400},
            audio: false
        }).then(stream => videoElement.srcObject = stream)
    }
}

class VideoView {
    #app
    #video
    #canvas
    #ctx

    constructor() {
        this.#app = this.#getElementById('app')
        const vision = Vision.build()

        this.#video = this.#videoInit()
        this.#canvas = this.#canvasInit()
        this.#ctx = this.#canvas.getContext('2d')

        this.onLoadedCamera(async video => (await vision).getFaces(video))
        this.#app.append(this.#video)
        this.#app.append(this.#canvas)
    }

    #createElement(tag, className) {
        const element = document.createElement(tag)
        className ? element.className = className : null;

        return element
    }

    #getElementById(id) {
        return document.getElementById(id)

    }

    #videoInit() {

        const video = this.#createElement('video')
        video.style.display = 'none'
        video.autoplay = true
        return video
    }

    #canvasInit() {
        const canvas = this.#createElement('canvas')
        canvas.width = 600
        canvas.height = 400
        canvas.style.cssText = 'width:100%;height:100%'
        return canvas
    }

    onLoadedCamera(cbGetFaces) {
        this.#video.addEventListener('loadeddata', () => {
            setInterval(async () => {
                const faces = await cbGetFaces(this.#video)
                this.#drawRectFaces(faces)
                faces.forEach(face => {
                    this.cutFace(face.box)
                    this.#drawGender(face.box)
                })

            }, 100)
        })
    }

    #drawRectFaces(faces) {
        this.#ctx.drawImage(this.#video, 0, 0, 600, 400)
        faces.forEach(face => {
            const {box} = face

            this.#ctx.beginPath()
            this.#ctx.lineWidth = 4
            this.#ctx.strokeStyle = 'blue'
            this.#ctx.rect(
                box.xMin,
                box.yMin - box.height * 0.35,
                box.width,
                box.height * 1.4
            )
            this.#ctx.stroke()
        })
    }

    #drawGender(box) {
        this.#ctx.font = '30px Arial'
        this.#ctx.fillStyle = 'red'
        this.#ctx.fillText('Male!', box.xMin, box.yMax); // Tekst i jego pozycja (x, y)
    }

    cutFace(box) {
        const captureCanvas = this.#createElement('canvas')
        const captureCtx = captureCanvas.getContext('2d')

        const extraHeight = box.height * 0.35;
        captureCanvas.width = box.width;
        captureCanvas.height = box.height * 1.4;
        captureCtx.drawImage(this.#video, box.xMin, box.yMin - extraHeight, box.width, box.height * 1.4, 0, 0, box.width, box.height * 1.4);
        const imageDataURL = captureCanvas.toDataURL('image/png');

        console.log(imageDataURL)
    }

    bindSetupCamera(handler) {
        handler(this.#video)
    }
}

class Controller {
    constructor(model, view) {
        this.model = model
        this.view = view

        this.view.bindSetupCamera(this.model.setupCamera)
    }
}


const app = new Controller(new VideoModel(), new VideoView())
const path = require('path');
const os = require('os');
const fs = require('fs');
const Busboy = require('busboy');
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

exports.faceDetection = (req, res) => {
    console.log("At ocr");
    try{
    if (req.method !== 'POST') {
        console.log("At not post");
        res.status(405).end();
    }

    console.log(req.headers);
    console.log("haha");

    
    const busboy = new Busboy({ headers: req.headers });
    const tmpdir = os.tmpdir();

    let tmpFilePath;
    let fileWritePromise;

    busboy.on('file', (fieldname, file, filename) => {
        console.log("At busboy on file");
        const filepath = path.join(tmpdir, "image.jpg");
        tmpFilePath = filepath;
        console.log(filename);

        const writeStream = fs.createWriteStream(filepath);
        file.pipe(writeStream);

        const promise = new Promise((resolve, reject) => {
            console.log("At promise creation");
            file.on('end', () => {
                writeStream.end();
            });
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
        fileWritePromise = promise;
    });

    let imageConfig = {};

    busboy.on('finish', () => {
        fileWritePromise.then(async () => {
            console.log("At filewritepromise");
            await processImage(tmpdir, tmpFilePath, imageConfig).then((response) => {
                console.log(typeof response);
                console.log(response.toString());
                res.status(200).send({message: response});
            });
            fs.unlinkSync(tmpFilePath);
        });
    });
    busboy.end(req.rawBody);
    } catch (error) {  
        console.log(error);
    }

};

async function processImage (dir, path, config) {
try{
    console.log("At processImage");
    console.log(path);
    const request = {
        image: {content: fs.readFileSync(path)},
    };
    const [result] = await client.faceDetection(request);
    const detections = result.faceAnnotations;
    let arr = ["Senang", "Marah", "Sedih", "Kaget"];
    let arrResult = ["UNKNOWN", "VERY_UNLIKELY", "UNLIKELY", "POSSIBLE", "LIKELY", "VERY_LIKELY"];
    let arrdetections = [];
    detections.forEach((face, i) => {
        let temp = [];
        temp.push(arrResult.indexOf(`${face.joyLikelihood}`));
        temp.push(arrResult.indexOf(`${face.angerLikelihood}`));
        temp.push(arrResult.indexOf(`${face.sorrowLikelihood}`));
        temp.push(arrResult.indexOf(`${face.surpriseLikelihood}`));
        let theMost = -Infinity;
        let final = -Infinity;
        for (let i = 0; i < temp.length; i++){
            if (theMost < temp[i]){
                theMost = temp[i];
                final = i;
            }
        }
        console.log(final.toString());
        console.log(arr[final]);
        arrdetections.push(arr[final]);
    });
    
    return arrdetections;
    } catch (err) {
        console.log("Error")
        console.log(err)
    }
}

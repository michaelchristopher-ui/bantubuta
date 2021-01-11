const path = require('path');
const os = require('os');
const fs = require('fs');
// Node.js doesn't have a built-in multipart/form-data parsing library.
// Instead, we can use the 'busboy' library from NPM to parse these requests.
const Busboy = require('busboy');
const Speech = require('@google-cloud/speech');

//START
const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('@ffmpeg-installer/ffmpeg').path;
const mime = require('mime');


async function linear16(filePathIn, filePathOut) {

    if (('object' === typeof filePathIn) && !filePathOut) {
        const {inPath, outPath} = filePathIn;
        filePathIn = inPath;
        filePathOut = outPath;
    }

    if (!filePathIn || !filePathOut) {
        throw new Error('You must specify a path for both input and output files.');
    }
    if (!fs.existsSync(filePathIn)) {
        throw new Error('Input file must exist.');
    }
    console.log("Input File Exists")
    if (mime.getType(filePathIn).indexOf('audio') <= -1) {
        throw new Error('File must have audio mime.');
    }
    console.log("Input File Has Mime")
    console.log(ffmpeg_static)

    // Refer to https://ffmpeg.org/ffmpeg.html#Audio-Options for options
    return new Promise((resolve, reject) => {
        try {
            ffmpeg(filePathIn)
                .setFfmpegPath(ffmpeg_static)
                .outputOptions([
                    '-f s16le',
                    '-acodec pcm_s16le',
                    '-vn',
                    '-ac 1',
                    '-ar 44100',
                    '-map_metadata -1'
                ])
                .save(filePathOut)
                .on('end', () => resolve(filePathOut));

        } catch (e) {
            reject(e);
        }
    });

}

//END

const ENCODING = 'LINEAR16';
const SAMPLE_RATE_HERTZ = 44100;
const LANGUAGE = 'id-ID';

const audioConfig = {
    encoding: ENCODING,
    sampleRateHertz: SAMPLE_RATE_HERTZ,
    languageCode: LANGUAGE,
};

const convertToText = async (dir, file, config) => {
    console.log('FILE:', JSON.stringify(file));

    const outPath = await linear16({
        inPath:  file,
        outPath: path.join(dir, 'output.wav')
    });

    console.log(outPath)

    const audio = {
        content: fs.readFileSync(outPath).toString('base64'),
    };

    const request = {
        config,
        audio,
    };

    const speech = new Speech.SpeechClient();

    return speech.recognize(request).then((response) => {
        return response;
    }).catch((error) => {
        console.log('SPEECH error:', error);
    });
};

/**
 * Audio-to-Text is a Cloud Function that is triggered by an HTTP
 * request. The function processes one audio file.
 *
 * @param {object} req Cloud Function request context.
 * @param {object} res Cloud Function response context.
 */
exports.audioToText = (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).end();
    }

    const busboy = new Busboy({ headers: req.headers });
    const tmpdir = os.tmpdir();

    let tmpFilePath;
    let fileWritePromise;

    // Process the file
    busboy.on('file', (fieldname, file, filename) => {
        // Note: os.tmpdir() points to an in-memory file system on GCF
        // Thus, any files in it must fit in the instance's memory.
        const filepath = path.join(tmpdir, filename);
        console.log("haha");
        tmpFilePath = filepath;
        console.log(filename);
        console.log(filepath);

        const writeStream = fs.createWriteStream(filepath);
        file.pipe(writeStream);

        // File was processed by Busboy; wait for it to be written to disk.
        const promise = new Promise((resolve, reject) => {
            file.on('end', () => {
                writeStream.end();
            });
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
        fileWritePromise = promise;
    });

    // Triggered once the file is processed by Busboy.
    // Need to wait for the disk writes to complete.
    busboy.on('finish', () => {
        fileWritePromise.then(async () => {
            await convertToText(tmpdir, tmpFilePath, audioConfig).then((response) => {
                const transcript = response[0].results
                    .map(result => result.alternatives[0].transcript)
                    .join('\n');
                res.send({ transcript });
            });
            fs.unlinkSync(tmpFilePath);
        });
    });
    busboy.end(req.rawBody);
};
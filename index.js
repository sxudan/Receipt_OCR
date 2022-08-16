const tesseract = require("node-tesseract-ocr")
// const { createWorker, PSM, OEM } = require('tesseract.js');
const express = require('express')
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const options = {}; /* see below */
const PDFTextParser = require('./PDFTextParser')
const ImageTextParser = require('./ImageTextParser')
var multer  =   require('multer'); 
const path = require('path');
var Jimp = require('jimp'); 

// const worker = createWorker({
//   logger: m => console.log(m)
// });

const Actions = {
  INCOME: 0,
  EXPENSE: 1
}

const config = {
  lang: "eng",
  oem: 1,
  psm: 6,
  env: {
    maxBuffer: 10240 * 10240
  }
}

const app = express()

const fs = require('fs');
const port = 3000

const destFolder = './uploads'

var storage =   multer.diskStorage({  
  destination: function (req, file, callback) {  
    callback(null, destFolder);  
  },  
  filename: function (req, file, callback) { 
    const filename = "temp_" + Math.floor(Math.random() * 1000) + Date.now() + path.extname(file.originalname)
    req.body.mimetype = file.mimetype
    req.body.filepath = destFolder + "/" + filename 
    req.body.filename = filename
    callback(null, filename);  
  }  
});  
var upload = multer({ storage : storage}).single('datafile');
const rectangle = { left: 0, top: 0, width: 500, height: 500 };

async function runTesseract(path) {
  return new Promise((resolve, reject) => {


    // (async () => {
    //   await worker.load();
    //   await worker.loadLanguage('eng');
    //   await worker.initialize('eng');
    //   await worker.setParameters({
    //     tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    //     tessedit_ocr_engine_mode: OEM.TESSERACT_LSTM_COMBINED
    //   });
    //   // const { data: { text } } = await worker.recognize('https://tesseract.projectnaptha.com/img/eng_bw.png');
    //   const obj = await worker.recognize(path);
    //   const text = obj.data.text
    //   console.log(obj)
    //   console.log(text)
    //   const imageText = new ImageTextParser(text)
    //   resolve(imageText)
    //   await worker.terminate();
    // })();

    tesseract
    .recognize(path, config)
    .then((text) => {
      const imageText = new ImageTextParser(text)
      console.log(text)
      resolve(imageText)
    })
    .catch((error) => {
      reject(error)
    })
    .finally(() => {
      fs.unlinkSync(path);
    })
  })
}

function send(res, data) {
  res.json({
    "message": "",
    "data": data
  })
}

app.post('/getAmount', upload ,function(req,res){  
  
  if (req.body.mimetype == 'image/jpeg' || req.body.mimetype == 'image/png') {
    console.log(req.body.filepath)
    const outputFile = destFolder + "/jimp_" + req.body.filename
    Jimp.read(req.body.filepath, (err, lenna) => {
      if (err) throw err;
      lenna
        .greyscale() // set greyscale
        .contrast(+0.5)
        .write(outputFile); // save
        fs.unlinkSync(req.body.filepath)
        runTesseract(outputFile).then((parser) => {
          const paymentInfo = parser.getPaymentInfo()
          send(res, paymentInfo)
          // res.send(parser)
        })
        .catch((error) => {
          console.log(error.message)
          send(res, {"message": error.message})
        })
    });
  } else if (req.body.mimetype == 'application/pdf') {
    pdfExtract.extract(req.body.filepath, options, (err, data) => {
      fs.unlinkSync(req.body.filepath);
      if (err) return console.log(err);
      const pdfText = new PDFTextParser(JSON.stringify(data))
      const imageText = new ImageTextParser(pdfText.extractLinesFormat())
      send(res, imageText.getPaymentInfo())
    });
  } else {
    fs.unlinkSync(req.body.filepath);
    send(res,{"error": "Invalid filetype"})
  } 
});  

app.get('/', (req, res) => {
  res.sendFile('./index.html', {root: __dirname })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


const tesseract = require("node-tesseract-ocr")
const https = require("https");
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
const app = express()
const fs = require('fs');
const ApiToken = require("./middlewares/apitoken");

//pdf
const PDFJS = require("pdfjs")


const httpPort = 80
const httpsPort = 443

const config = {
  lang: "eng",
  oem: 1,
  psm: 6
}

const httpsconfig = {
  key: fs.readFileSync("server.key"),
  cert: fs.readFileSync("server.cert"),
};

const destFolder = './uploads'


// Add headers before the routes are defined
app.use(function (req, res, next) {
  
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  next();
});

// app.use('/getInfo', ApiToken)

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

app.post('/test', upload ,function(req,res){  
  
  if (req.body.mimetype == 'image/jpeg' || req.body.mimetype == 'image/png') {
    console.log(req.body.filepath)
    const outputFile = destFolder + "/jimp_" + req.body.filename
    Jimp.read(req.body.filepath, (err, lenna) => {
      if (err) throw err;
      lenna
      .resize(1000,1000, Jimp.RESIZE_BEZIER)
      // .greyscale() // set greyscale
      // .convolute([[-2, -1, 0], [-1, 1, 1], [0, 1, 2]])
      .convolute([[0,-1,0], [-1,5-1], [0, -1, 0]])
      .quality(100)
      .grayscale()
      .write(outputFile); // save

      // fs.unlinkSync(req.body.filepath)
      runTesseract(outputFile).then((parser) => {
        const paymentInfo = parser.getPaymentInfo()
        // send(res, paymentInfo)
        res.send(paymentInfo)
      })
      .catch((error) => {
        console.log(error.message)
        send(res, {"message": error.message})
      })
    });
  } else if (req.body.mimetype == 'application/pdf') {
    
    pdfExtract.extract(req.body.filepath, options, (err, data) => {
      console.log(data)
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
})

app.post('/getInfo', upload ,function(req,res){  
  
  if (req.body.mimetype == 'image/jpeg' || req.body.mimetype == 'image/png') {
    console.log(req.body.filepath)
    const outputFile = destFolder + "/jimp_" + req.body.filename
    Jimp.read(req.body.filepath, (err, lenna) => {
      if (err) throw err;
      lenna
      .resize(1000,1000, Jimp.RESIZE_BEZIER)
      .convolute([[0,-1,0], [-1,5-1], [0, -1, 0]])
      .grayscale()
      .quality(100)
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

app.use(express.static(path.join(__dirname, '../receiptocr_web/build')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../receiptocr_web/build', 'index.html'))
})

// https.createServer(httpsconfig, app)
// .listen(httpsPort, function (req, res) {
//   console.log("Server started at port " + httpsPort);
// });

app
.listen(httpPort, function (req, res) {
  console.log("Server started at port "+ httpPort);
});

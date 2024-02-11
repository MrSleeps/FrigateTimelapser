const express = require('express');
const http = require('http');
const ws = require('ws');
const config = require('./config');
const nodeCron = require('node-cron');
const findRemoveSync = require('find-remove')
var fs = require('fs');
const path = require("path");
const shell = require("electron").shell;
const ipcRenderer = require("electron").ipcRenderer;
const os = require("os");
const ffbinaries = require("ffbinaries");
const ffmpeg = require("fluent-ffmpeg");
const videoshow = require("videoshow");
const _ = require('underscore');
const dtFormat = require('intl-dateformatter');
const needle = require("needle");

const PORT = config.listenPort;
const HOST = '0.0.0.0';
const API_SNAP = '';
const API_EVENT = '';
const imageDirPath = __dirname + "/files/" + config.imageSaveDir;
const videoDirPath = __dirname + "/files/" + config.videoSaveDir;
const htmlPath = __dirname + '/public'
// App
const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
  const websocket = socket;
  socket.on('error', console.error);
  socket.on('message', function message(data) {
    const message = JSON.parse(data);
    if (message && message.action) {
      if(message.action == "finishedTimelapse") {
        console.log("yee haww");
        console.log(message.filename)
        console.log(message.camera)
        const sockmessage = {action:"finishedTimelapse", filename:message.filename,camera:message.camera}
        socket.send(JSON.stringify(sockmessage));
        wsServer.clients.forEach(function each(client) {
          client.send(JSON.stringify(sockmessage));;
        });        
      }
    }
      console.log('received: %s', data);
    });
  });
const app = express();
app.set('view engine', 'ejs');
app.use(express.static(htmlPath))

app.get('/test', (req, res) => {
  res.render('pages/test', {
    wsurl: config.timeLapseURL+'/ws',
    cameras: config.cameras
  });
});

app.get('/', (req, res) => {
  res.render('pages/index', {
    frigateurl: config.frigateBaseURL,
    cameras: config.cameras,
    pagesubtitle: "Home"
  });
});

app.get('/c/:camera', (req, res) => {
var camera = req.params.camera;
var imagePath = imageDirPath+camera;
var videoPath = videoDirPath+camera;
const dirents = fs.readdirSync(imagePath, { withFileTypes: true });
const unSortedImages = dirents
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name);
 var images = unSortedImages.slice(Math.max(unSortedImages.length - 10, 0)).reverse();

 const direntsv = fs.readdirSync(videoPath, { withFileTypes: true });
 const unSortedVideos = direntsv
    .filter(direntsv => direntsv.isFile())
    .map(dirent => dirent.name);
  var filteredVideos = unSortedVideos.filter(function(value) {
      var ext = path.extname(value);
      return ['.png'].indexOf(ext) == -1;
  });    
 var videos = filteredVideos.slice(Math.max(filteredVideos.length - 10, 0)).reverse();
  res.render('pages/cameras', {
    frigateurl: config.frigateBaseURL,
    cameras: config.cameras,
    images: images,
    videos: videos,
    camera: camera,
    pagesubtitle: "View camera snapshots"
  });
  console.log(images)
  console.log("Videos at:"+videoPath)
  console.log(filteredVideos)
});

app.get('/timelapse/generate', (req, res) => {
    res.render('pages/manualTimelapse', {
      frigateurl: config.frigateBaseURL,
      cameras: config.cameras,
      pagesubtitle: "Generate a Timelapse"
    });
  });

app.get('/v/watch/:camera/:filename', (req, res) => {
  var file = req.params.filename;
  var camera = req.params.camera;
  res.render('pages/viewVideo', {
    cameras: config.cameras,
    videoFile: file,
    camera: camera,
    pagesubtitle: "Watch a timelapse"
  });  
});

app.get('/v/thumb/:camera/:filename/:pointless', (req, res) => {
  var file = req.params.filename;
  var camera = req.params.camera;
  var fileWithPath = videoDirPath+camera+'/'+file
  console.log(fileWithPath)
  if (!fs.existsSync(fileWithPath)) {
    res.sendFile(__dirname + '/public/images/not-found.jpg')
  } else {
    res.sendFile(videoDirPath+camera+'/tn_'+file+'.png');
  }

});

app.get('/v/t/:camera/:filename', (req, res) => {
  var camera = req.params.camera;
  var file = req.params.filename;
 
  const videoPath =  videoDirPath+camera+'/'+file
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  } 
  });

app.get('/images/:camera/:image', function (req, res) {
  var camera = req.params.camera;
  var image = req.params.image;
  var imagePath = imageDirPath+camera;
  var theImage = imagePath+'/'+image
  if (!fs.existsSync(theImage)) {
    res.sendFile(__dirname + '/public/images/not-found.jpg')
  } else {
    res.sendFile(theImage);
  }
  
});

app.get('/:camera/timelapse/:hass/:json', (req, res) => {
  var dirPathCamera = imageDirPath + "" + req.params['camera'] + "/";
  var dirPathVideoCamera = videoDirPath + "" + req.params['camera'] + "/";
  var fromHomeAssistant = req.params['hass'];
  var jsonReply = req.params['json'];
  const files = getFiles(imageDirPath, req.params['camera']);
  const sortedFiles = orderByCTime(dirPathCamera, files);
  const filteredFiles = filterFiles(sortedFiles);
  if (filteredFiles.length > 0) {
    var videoOptions = {
      fps: 25,
      loop: 1, // seconds
      transition: false,
      transitionDuration: 1, // seconds
      videoBitrate: 1024,
      videoCodec: 'libx264',
      size: '1920x?',
      format: 'mp4',
      pixelFormat: 'yuv420p'
    }
    if(fromHomeAssistant == 0 && jsonReply == 0) {
      res.render('pages/generateTimelapse', {
        frigateurl: config.frigateBaseURL,
        cameras: config.cameras,
        pagesubtitle: "Generating Timelapse"
      });       
    } 
    var videoDate = dtFormat(new Date, `yyyy-mm{-}dd-hh-mmi-ss`)
    var videoFilename = dirPathVideoCamera + videoDate + ".mp4";
    videoshow(filteredFiles, videoOptions)
      .save(videoFilename)
      .on('start', function (command) {
      })
      .on('error', function (err, stdout, stderr) {
        console.error('Error:', err)
        console.error('ffmpeg stderr:', stderr)
      })
      .on('end', function (output) {
        var requestOptions = {
          json: true,
          timeout: 10 * 60 * 1000 //10 minutes
        }
        // create thumbnail
        // videoFilename
        var proc = ffmpeg(videoFilename)
        .on('filenames', function(filenames) {
          console.log('screenshots are ' + filenames.join(', '));   
        })
        .on('end', function() {
          console.log('screenshots were saved');
        })
        .on('error', function(err) {
          console.log('an error happened: ' + err.message);
        })
        // take 1 screenshots at predefined timemarks and size
        .takeScreenshots({ count: 1, timemarks: [ '00:00:07.000' ], size: '300x169', filename: 'tn_'+videoDate+'.mp4.png' }, dirPathVideoCamera);        
        if(fromHomeAssistant == 1 && config.postToHomeAssistant == 1) {
          jsonString = '{"video": ' + config.timeLapseURL + '/' + req.params['camera'] + '/' + videoDate + '.mp4"}'
          needle.post(config.homeAssistantURL+'/api/webhook/'+config.homeAssistantToken, jsonString, requestOptions)
        } else {
          const socketMessage = {action:"finishedTimelapse", filename:req.params['camera'] + '/' + videoDate + '.mp4',camera:req.params['camera']};
          if(jsonReply == 1) {
            res.json(socketMessage)
          }
          const client = new ws('ws://127.0.0.1:8500');
          client.on('open', () => {
            client.send(JSON.stringify(socketMessage));
          });
        }
        console.log('Video created in:', output)
      })
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
    console.log("Something ws happen")
  });
});

if (!fs.existsSync('./files/' + config.imageSaveDir)) {
  console.log("Image save directory doesn't exist, creating");
  fs.mkdirSync('./files/' + config.imageSaveDir);
} else {
  console.log("Image save directory already exists");
}

if (!fs.existsSync('./files/' + config.videoSaveDir)) {
  console.log("Video save directory doesn't exist, creating");
  fs.mkdirSync('./files/' + config.videoSaveDir);
} else {
  console.log("Video save directory already exists");
}


var arrayLength = config.cameras.length;
for (var i = 0; i < arrayLength; i++) {
  if (!fs.existsSync('./files/' + config.imageSaveDir + '/' + config.cameras[i])) {
    console.log(config.cameras[i] + " image save directory doesn't exist, creating");
    fs.mkdirSync('./files/' + config.imageSaveDir + '/' + config.cameras[i]);
  }
  if (!fs.existsSync('./files/' + config.videoSaveDir + '/' + config.cameras[i])) {
    console.log(config.cameras[i] + " video save directory doesn't exist, creating");
    fs.mkdirSync('./files/' + config.videoSaveDir + '/' + config.cameras[i]);
  }
}

const job = nodeCron.schedule("*/2 * * * * *", function someDudFunction() {
  console.log("Grabbing latest images.");
  grabCameraSnapshots();
});

function grabCameraSnapshots() {
  var arrayLength = config.cameras.length;
  for (var i = 0; i < arrayLength; i++) {
    if (!fs.existsSync('./files/' + config.imageSaveDir + '/' + config.cameras[i])) {
      console.log(config.cameras[1] + " save directory doesn't exist, creating");
      fs.mkdirSync('./files/' + config.imageSaveDir + '/' + config.cameras[i]);
    }
    var savedFilename = "./files/" + config.imageSaveDir + config.cameras[i] + "/" + Date.now() + ".jpg";
    var saveDirectory = "./files/" + config.imageSaveDir + config.cameras[i] + "/";
    var snapshotURL = config.frigateBaseURL + "/api/" + config.cameras[i] + "/latest.jpg";
    downloadSnapshot(snapshotURL, savedFilename);
    var result = findRemoveSync(saveDirectory, {
      age: { seconds: 5400 },
      extensions: '.jpg',
      limit: 100
    })
  }
}

async function listFiles(directory) {
  const dirents = await fs.readdir(directory, { withFileTypes: true });
  return dirents
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name);
}

function subtractSeconds(date, seconds) {
  date.setSeconds(date.getSeconds() - seconds);
  return date;
}

function getFiles(dirPath, camera) {
  var filesDir = dirPath + "" + camera + "/";
  return fs.readdirSync(filesDir)
}

function orderByCTime(dirPath, files) {
  var filesWithStats = [];
  _.each(files, function getFileStats(file) {
    var fileStats = fs.statSync(dirPath + file);

    filesWithStats.push({
      filename: file,
      directory: dirPath,
      ctime: fileStats.ctime
    });
    file = null;
  });
  return _.sortBy(filesWithStats, 'ctime');
}

function filterFiles(theSortedFiles) {
  sd = subtractSeconds(new Date(), config.setLapseSeconds),
    ed = new Date(),
    fileNames = []
  myfruit = {};
  theSortedFiles.forEach(function (file, index) {
    var tempArray = [];
    var time = new Date(file.ctime);
    if (time >= sd && time <= ed) {
      fileNames.push(file.directory + file.filename)
    }
  });
  return fileNames;
}


var downloadSnapshot = function (snapshotURL, savedFilename) {
  try {
    needle.get(snapshotURL)
    .pipe(fs.createWriteStream(savedFilename))
    .on('done', function(err) {
    });
  } catch (error) {
    console.log("There was an error:");
    console.error(error);
  }
};

let groupPhotos = function (callback) {
  const aMinuteAgo = new Date(Date.now() - 1000 * 60);
  videoFiles = [];

  fs.readdir(config.timeLapseDir, (err, files) => {
    files.forEach(file => {
      if (path.extname(file) === "." + "png") {
        videoFiles.push(config.timeLapseDir + "/" + file);
      }
    });
    if (callback) {
      callback();
    }
  });
};

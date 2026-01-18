const express = require('express');
const http = require('http');
const ws = require('ws');
const config = require('./config');
const jsonConfig = require('./data/config.json');
const nodeCron = require('node-cron');
const findRemoveSync = require('find-remove');
var fs = require('fs');
const path = require("path");
const shell = require("electron").shell;
const ipcRenderer = require("electron").ipcRenderer;
const os = require("os");
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
ffmpeg.setFfprobePath('/usr/bin/ffprobe');
const videoshow = require("videoshow");
const _ = require('underscore');
const dateFormat = require('date-format');
const needle = require("needle");
const reachableUrl = require('reachable-url')
const { version } = require('./package.json');
const bodyParser = require('body-parser')
const PORT = config.listenPort;
const HOST = '0.0.0.0';
const imageDirPath = __dirname + "/files/" + config.imageSaveDir;
const videoDirPath = __dirname + "/files/" + config.videoSaveDir;
const selfHost = config.timeLapseURL;
const selfPort = config.listenPort;
const htmlPath = __dirname + '/public'
const dateTimeFormatString = "yyyy-MM-dd-hh-mm-ss" 
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })
// App
const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
  const websocket = socket;
  socket.on('error', console.error);
  socket.on('message', function message(data) {
    const message = JSON.parse(data);
    if (message && message.action) {
      if(message.action == "finishedTimelapse") {
        const sockmessage = {action:"finishedTimelapse", filename:message.filename,camera:message.camera}
        socket.send(JSON.stringify(sockmessage));
        wsServer.clients.forEach(function each(client) {
          client.send(JSON.stringify(sockmessage));;
        });        
      }
    }
      //console.log('received: %s', data);
    });
  });
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.json())
app.use(express.static(htmlPath))
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/healthcheck', (req, res) => {
  res.json('{"video": "Yes Thanks"}')
});

app.get('/', (req, res) => {
  const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
  const cameras = jsonConfig.frigateCameras.split(",");
  if(jsonConfig.needsSetup == 1) {
    res.redirect('/setup');
    return false;
  }
  if(isFrigateOnline() == "online") {
    frigateOnline = 1;
  } else {
    frigateOnline = 0;
  }
  res.render('pages/index', {
    frigateurl: jsonConfig.frigateURL,
    cameras: cameras,
    pagesubtitle: "Home",
    version: version,
    frigateOnline: frigateOnline
  });
});

app.get('/c/:camera', (req, res) => {
  const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
  const cameras = jsonConfig.frigateCameras.split(",");
  if(jsonConfig.needsSetup == 1) {
    res.redirect('/setup');
    return false;
  }
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
      .map(direntsv => direntsv.name);
    var filteredVideos = unSortedVideos.filter(function(value) {
        var ext = path.extname(value);
        return ['.png'].indexOf(ext) == -1;
    });    
  var videos = filteredVideos.slice(Math.max(filteredVideos.length - 10, 0)).reverse();
  if(isFrigateOnline() == "online") {
    frigateOnline = 1;
  } else {
    frigateOnline = 0;
  }
    res.render('pages/cameras', {
      frigateurl: jsonConfig.frigateURL,
      cameras: cameras,
      images: images,
      videos: videos,
      camera: camera,
      pagesubtitle: "View camera snapshots",
      version: version,
      frigateOnline: frigateOnline
    });
});

app.get('/timelapse/generate', (req, res) => {
  const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
  const cameras = jsonConfig.frigateCameras.split(",");
  if(jsonConfig.needsSetup == 1) {
    res.redirect('/setup');
    return false;
  }
  if(isFrigateOnline() == "online") {
    frigateOnline = 1;
  } else {
    frigateOnline = 0;
  }  
  req.headers['x-forwarded-proto']
  res.render('pages/manualTimelapse', {
    frigateurl: jsonConfig.frigateURL,
    cameras: cameras,
    pagesubtitle: "Generate a Timelapse",
    version: version,
    frigateOnline: frigateOnline
  });
});

app.get('/v/watch/:camera/:filename', (req, res) => {
  const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
  const cameras = jsonConfig.frigateCameras.split(",");
  if(jsonConfig.needsSetup == 1) {
    res.redirect('/setup');
    return false;
  }  
  var file = req.params.filename;
  var camera = req.params.camera;
  if(isFrigateOnline() == "online") {
    frigateOnline = 1;
  } else {
    frigateOnline = 0;
  }  
  res.render('pages/viewVideo', {
    cameras: cameras,
    videoFile: file,
    camera: camera,
    pagesubtitle: "Watch a timelapse",
    version: version,
    frigateOnline: frigateOnline
  });  
});

app.get('/v/thumb/:camera/:filename/:pointless', (req, res) => {
  var file = req.params.filename;
  var camera = req.params.camera;
  var fileWithPath = videoDirPath+camera+'/'+file
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

app.get('/latest/:camera/', function (req, res) {
  var camera = req.params.camera;
  var imagePath = imageDirPath+camera;
  var latest = getMostRecentFile(imagePath);
  var latestImage = imagePath + '/'+ latest.file;
  if (!fs.existsSync(latestImage)) {
    res.set("Content-Type", "image/jpeg");
    res.sendFile(__dirname + '/public/images/not-found.jpg')
  } else {
    res.set("Content-Type", "image/jpeg");
    res.sendFile(latestImage);
  }
});

app.get('/:camera/timelapse/:hass/:json', (req, res) => {
  const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
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
    
    // If it's from Home Assistant, fork it off and return "ok" immediately
    if (fromHomeAssistant == 1 && jsonConfig.usingHomeAssistant == 1) {
      console.log("Home Assistant request - processing async");
      
      // Return "ok" immediately to stop Home Assistant from timing out
      res.send("ok");
      
      // Process in background
      setTimeout(() => {
        processHomeAssistantTimelapseAsync(
          req.params['camera'],
          dirPathCamera,
          dirPathVideoCamera,
          filteredFiles,
          videoOptions
        );
      }, 100);
      
      return; // Exit early
    }
    
    if(fromHomeAssistant == 0 && jsonReply == 0) {
      const cameras = jsonConfig.frigateCameras.split(",");
      if(jsonConfig.needsSetup == 1) {
        res.redirect('/setup');
        return false;
      }
      if(isFrigateOnline() == "online") {
        var frigateOnline = 1;
      } else {
        frigateOnline = 0;
      }
      res.render('pages/generateTimelapse', {
        frigateurl: jsonConfig.frigateURL,
        cameras: cameras,
        pagesubtitle: "Generating Timelapse",
        version: version,
        frigateOnline: frigateOnline
      });       
    } 
    
    var videoDate = getFormattedDate();
    var videoFilename = dirPathVideoCamera + req.params['camera']+'_'+videoDate + ".mp4";
    
    videoshow(filteredFiles, videoOptions)
      .save(videoFilename)
      .on('start', function (command) {
        console.log("Starting Timelapse generation")
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
        .takeScreenshots({ count: 1, timemarks: [ '00:00:07.000' ], size: '300x169', filename: 'tn_'+req.params['camera']+'_'+videoDate+'.mp4.png' }, dirPathVideoCamera);
        
        // Send WebSocket notification for browser requests
        const socketMessage = {action:"finishedTimelapse", filename:req.params['camera'] + '/' + req.params['camera']+'_'+videoDate + '.mp4',camera:req.params['camera']};
        
        if(jsonReply == 1) {
          res.json(socketMessage)
        }
        
        const client = new ws('ws://127.0.0.1:'+config.listenPort);
        client.on('open', () => {
          client.send(JSON.stringify(socketMessage));
        });
        
        console.log('Video created in:', output)
      })
  } else {
    const errorMessage = {error:"1", message:"No recent snapshots were found, are your cameras or Frigate online?"};
    res.status(400);
    res.json(errorMessage)
  }
});

function processHomeAssistantTimelapseAsync(camera, dirPathCamera, dirPathVideoCamera, filteredFiles, videoOptions) {
  console.log("Processing Home Assistant timelapse async for", camera);
  
  var videoDate = getFormattedDate();
  var videoFilename = dirPathVideoCamera + camera + '_' + videoDate + ".mp4";
  
  videoshow(filteredFiles, videoOptions)
    .save(videoFilename)
    .on('start', function (command) {
      console.log("Starting async Timelapse generation for HA")
    })
    .on('error', function (err, stdout, stderr) {
      console.error('HA Async Error:', err)
      console.error('HA Async ffmpeg stderr:', stderr)
    }) 
    .on('end', function (output) {
      var requestOptions = {
        json: true,
        timeout: 10 * 60 * 1000 //10 minutes
      }
      
      // Generate thumbnail
      var proc = ffmpeg(videoFilename)
      .on('filenames', function(filenames) {
        console.log('HA screenshots are ' + filenames.join(', '));   
      })
      .on('end', function() {
        console.log('HA screenshots were saved');
      })
      .on('error', function(err) {
        console.log('HA an error happened: ' + err.message);
      })
      .takeScreenshots({ count: 1, timemarks: [ '00:00:07.000' ], size: '300x169', filename: 'tn_'+camera+'_'+videoDate+'.mp4.png' }, dirPathVideoCamera);
      
      // Send webhook to Home Assistant
      const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
      const jsonString = '{"video": "' + selfHost + ':'+selfPort+'/v/t/' + camera + '/' + camera+'_'+videoDate + '.mp4"}';
      
      needle.post(
        jsonConfig.hassURL+'/api/webhook/'+jsonConfig.hassWebhook, 
        jsonString, 
        requestOptions,
        function(err, resp) {
          if (err) {
            console.error('HA Webhook error:', err);
          } else {
            console.log('HA Webhook sent successfully');
          }
        }
      );
      
      // Also send WebSocket notification (optional)
      const socketMessage = {
        action: "finishedTimelapse", 
        filename: camera + '/' + camera+'_'+videoDate + '.mp4',
        camera: camera,
        source: "homeassistant"
      };
      
      wsServer.clients.forEach(function each(client) {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify(socketMessage));
        }
      });
      
      console.log('HA Video created in:', output)
    });
}

app.get('/setup', (req, res) => {
  const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
  if(jsonConfig.needsSetup == 0) {
    res.redirect('/settings');
  } else {
    res.render('pages/setup', {
      pagesubtitle: "Setup",
      version: version,
    });
  }
});

app.post('/api/setup/frigate', urlencodedParser, (req, res) => {
  const data = req.body;
  var frigateURL = data.frigateURL;
  needle('get', frigateURL+'/api/config')
  .then(function(resp) {
    if(resp.statusCode == 200 || response.statusCode == 201 || response.statusCode == 202 || response.statusCode == 301 || response.statusCode == 302)
    var cameras = []
    _.each(resp.body.cameras, function (value, key) {
      cameras.push({
        camera: value.name
      });
      
    });
  res.send(JSON.stringify(cameras))
  })
  .catch(function(err) {
    res.status(400).send({
      message: 'Unable to connect to Frigate host.'
   });
  });  
});

app.post('/setup', urlencodedParser, (req, res) => {
  const data = req.body;
  var frigateURL = data.frigateURL;
  var frigateCameras = data.frigateCameras;
  var hassURL = data.hassURL;
  var hassWebhook = data.hassWebhookInput;
  var usingHomeAssistant = data.usingHomeAssistant;
  var timeLapseSeconds = data.timeLapseSeconds;
  var keepImagesDays = data.keepImagesDays;
  const settings = {
    frigateURL: frigateURL,
    frigateCameras: frigateCameras,
    hassURL: hassURL,
    hassWebhook: hassWebhook,
    usingHomeAssistant: usingHomeAssistant,
    timeLapseSeconds: timeLapseSeconds,
    keepImagesDays: keepImagesDays,
	  needsSetup: 0
  }
  fs.writeFileSync('./data/config.json', JSON.stringify(req.body))
  var jsonString = '{"message": "Your settings have been saved."}'
  runSetupChecks()
  res.send(JSON.stringify(jsonString))
});

app.get('/settings', (req, res) => {
  const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
  const cameras = jsonConfig.frigateCameras.split(",");
  if(jsonConfig.needsSetup == 1) {
    res.redirect('/setup');
    return false;
  }
  if(isFrigateOnline() == "online") {
    frigateOnline = 1;
  }
  res.render('pages/settings', {
    frigateurl: jsonConfig.frigateURL,
    cameras: cameras,
    pagesubtitle: "Settings",
    version: version,
    frigateOnline: frigateOnline,
	  frigateURL: jsonConfig.frigateURL,
	  frigateCameras: cameras,
	  hassURL: jsonConfig.hassURL,
	  hassWebhook: jsonConfig.hassWebhook,
	  usingHomeAssistant: jsonConfig.usingHomeAssistant,
    timeLapseSeconds: jsonConfig.timeLapseSeconds,
    keepImagesDays: jsonConfig.keepImagesDays,
    keepVideosDays: jsonConfig.keepVideosDays,    
  });
});

app.get('/api/check/frigate', (req, res) => {
  if(isFrigateOnline() == "online") {
    frigateOnline = 1; 
  } else {
    frigateOnline =0;
  }
  res.send(JSON.stringify({'online':frigateOnline}))
});

const server = app.listen(PORT, HOST, () => {
  const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
  if (fs.existsSync(__dirname +'/.online')) {
    fs.unlinkSync(__dirname +'/.online');
  }
  runSetupChecks();
  removeOldFiles();
  if(jsonConfig.needsSetup == 0) {
    isOnline(jsonConfig.frigateURL); 
  }
   
  console.log(`Frigate Timelapser running on http://${HOST}:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
  });
});

function runSetupChecks() {
  const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
  const cameras = jsonConfig.frigateCameras.split(",");
  if (!fs.existsSync('./files/' + config.imageSaveDir)) {
    console.log("Image save directory doesn't exist, creating");
    fs.mkdirSync('./files/' + config.imageSaveDir);
  }
  
  if (!fs.existsSync('./files/' + config.videoSaveDir)) {
    console.log("Video save directory doesn't exist, creating");
    fs.mkdirSync('./files/' + config.videoSaveDir);
  }
  
  var arrayLength = cameras.length;
  for (var i = 0; i < arrayLength; i++) {
    if (!fs.existsSync('./files/' + config.imageSaveDir + '/' + cameras[i])) {
      console.log(cameras[i] + " image save directory doesn't exist, creating");
      fs.mkdirSync('./files/' + config.imageSaveDir + '/' + cameras[i]);
    }
    if (!fs.existsSync('./files/' + config.videoSaveDir + '/' + cameras[i])) {
      console.log(cameras[i] + " video save directory doesn't exist, creating");
      fs.mkdirSync('./files/' + config.videoSaveDir + '/' + cameras[i]);
    }
  }  
}

const job = nodeCron.schedule("*/2 * * * * *", function someDudFunction() {
  grabCameraSnapshots();
});

const clearOldFiles = nodeCron.schedule("0 26 */1 * * *", function someDudFunction() {
  removeOldFiles();
});

const checkHostJob = nodeCron.schedule("0 * * * * *", function someDudFunction() {
  const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
  console.log("Checking Frigate URL: "+jsonConfig.frigateURL+"/api/version");
  isOnline(jsonConfig.frigateURL+'/api/version');
});

function grabCameraSnapshots() {
  const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
  const cameras = jsonConfig.frigateCameras.split(",");
  if(jsonConfig.needsSetup == 0) {
    if (fs.existsSync(__dirname +'/.online')) {
      var arrayLength = cameras.length;
      for (var i = 0; i < arrayLength; i++) {
        if (!fs.existsSync('./files/' + config.imageSaveDir + '/' + cameras[i])) {
          console.log(cameras[1] + " save directory doesn't exist, creating");
          fs.mkdirSync('./files/' + config.imageSaveDir + '/' + cameras[i]);
        }
        var imageDateTime = getFormattedDate();
        var savedFilename = "./files/" + config.imageSaveDir + cameras[i] + "/" + cameras[i] + "_" + imageDateTime + ".jpg";
        var saveDirectory = "./files/" + config.imageSaveDir + cameras[i] + "/";
        var snapshotURL = jsonConfig.frigateURL + "/api/" + cameras[i] + "/latest.jpg";
        downloadSnapshot(snapshotURL, savedFilename);
        var result = findRemoveSync(saveDirectory, {
          age: { seconds: 5400 },
          extensions: '.jpg',
          limit: 100
        })
      }
    } else {
      console.log("Frigate appears to be offline, not taking snapshot")
    }
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
  const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
  var sd = subtractSeconds(new Date(), jsonConfig.timeLapseSeconds * 2),
    ed = new Date(),
    fileNames = []
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

var getFormattedDate = function () {
  return dateFormat.asString(dateTimeFormatString, new Date());
}

async function isOnline(host) {
  try {
    const response = await needle('get', host);
    const statusCode = response.statusCode;
    const isSuccess = [200, 201, 202, 301, 302].includes(statusCode);
    
    if (isSuccess) {
      console.log("Frigate is up, status:", statusCode);
      try {
        fs.closeSync(fs.openSync(__dirname + '/.online', 'w'));
      } catch (e) {
        // Ignore file errors
      }
      return "online";
    } else {
      console.log("Frigate returned non-success status:", statusCode);
      console.log("Frigate is down");
      return "offline";
    }
  } catch (error) {
    console.log("Error checking Frigate:", error.message || error);
    console.log("Frigate is down");
    return "offline";
  }
}

var isFrigateOnline = function () {
  const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
  if(jsonConfig.needsSetup == 0) {
    if (fs.existsSync(__dirname +'/.online')) {
      return "online";
    } else {
      return "offline";
    }
  }
}

const getMostRecentFile = (dir) => {
  const files = orderReccentFiles(dir);
  return files.length ? files[0] : undefined;
};

const orderReccentFiles = (dir) => {
  return fs.readdirSync(dir)
    .filter((file) => fs.lstatSync(path.join(dir, file)).isFile())
    .map((file) => ({ file, mtime: fs.lstatSync(path.join(dir, file)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
};

async function removeOldFiles() {
  const jsonConfig = JSON.parse(fs.readFileSync('./data/config.json'));
  const cameras = jsonConfig.frigateCameras.split(",");
  var arrayLength = cameras.length;
  for (var i = 0; i < arrayLength; i++) {
    numberOfSecondsImages = jsonConfig.keepImagesDays * 86400;
    numberOfSecondsVideos = jsonConfig.keepVideosDays * 86400;
    var imageResult = findRemoveSync('./files/'+config.imageSaveDir+cameras[i], {
      age: { seconds: numberOfSecondsImages },
      extensions: '.jpg'
    })        
    var numberOfDeletedImageFiles = imageResult.length;
    var videoResult = findRemoveSync('./files/'+config.videoSaveDir+cameras[i], {
      age: { seconds: numberOfSecondsVideos },
      extensions: ['.png', '.mp4']
    })        
    var numberOfDeletedVideoFiles = videoResult.length;
    console.log("Purging old videos and images from "+cameras[i]+" folder.")    
  }
}

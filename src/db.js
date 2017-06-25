import Loki from 'lokijs'
import LokiCordovaFSAdapter from 'loki-cordova-fs-adapter'
import Utils from './utils.js'
import Q from 'q'
import _ from 'lodash'
import FileHelper from './FileHelper'
import uuidv4 from 'uuid/v4'

var db;

var initDB = function() {
  var adapter = new LokiCordovaFSAdapter({"prefix": "yuudee"});
  var dbConfig = {
    autoload: true,
    autosave: true,
    autosaveInterval: 1000, // 1 second
  }

  if (Utils.isCordova) {
    dbConfig.adapter = adapter;
  }

  db = new Loki('config.db', dbConfig);
}

var getAllConfigs = function() {
  var appConfig = db.getCollection("appConfig");
  if (appConfig === null) {
    appConfig = db.addCollection("appConfig");
  }
  return appConfig;
}

var getAllClasswares = function() {
  var classwares = db.getCollection("classwares");
  if (classwares === null) {
    classwares = db.addCollection("appConfig");
  }
  return classwares;
}

var isFirstStartup = function() {
  return getAllConfigs().find({'name': 'isFirstStartup'});
}

// Add scan card_assets folder to generate classwares
// Card assets shouldn't have recursive folders
var generateOfficialClasswares = function() {
  FileHelper.listDirectoryPromise(cordova.file.dataDirectory + "card-assets/").then(function(list){
    console.log(list);
    console.log(uuidv4())
    for (var i = 0; i < list.length; i++) {
      var node = list[i];
      if (! node.isDirectory) {
        // Not directory. Ignore
        continue;
      }
      if(! node.fullPath.endsWith('xydcard/')) {
        // It's a folder. List its content.
        console.log(node.fullPath);
        FileHelper.listDirectoryPromise(node.nativeURL).then(function(data){
          console.log(data);
        })
      } else {
        // Register this, together with its parent's uuid.
      }
    }
  }).catch(function(error){
    console.log(error);
  });
}

// Init db
document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
  initDB();
  // isFirstStartup();
  generateOfficialClasswares();
}
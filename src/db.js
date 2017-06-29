import Loki from 'lokijs'
import LokiCordovaFSAdapter from 'loki-cordova-fs-adapter'
import Utils from './utils.js'
import Q from 'q'
import _ from 'lodash'
import FileHelper from './FileHelper'
import uuidv4 from 'uuid/v4'

var db_settings;
var db_cards;

const CLASSWARE_COLLECTION = 'classwares'
const RESOURCE_COLLECTION = 'resources'
const CONFIG_COLLECTION = 'appConfig'
const DB_PREFIX = 'yuudee'
const SETTINGS_DB_NAME = 'settings.db'
const CARDS_DB_NAME = 'cards.db'

var initDB = function() {
  var settingsDbAdapter = new LokiCordovaFSAdapter({"prefix": DB_PREFIX});
  var cardsDbAdapter = new LokiCordovaFSAdapter({"prefix": DB_PREFIX});
  var settingsDbConfig = {
    unique: true,
    autoload: true,
    autosave: true,
    autosaveInterval: 1000, // 1 second
  }

  var cardsDbConfig = {
    unique: true,
    autoload: true,
    autosave: true,
    autosaveInterval: 1000, // 1 second
  }

  if (Utils.isCordova) {
    settingsDbConfig.adapter = settingsDbAdapter;
    cardsDbConfig.adapter = cardsDbAdapter;
  }

  db_settings = new Loki(SETTINGS_DB_NAME, settingsDbConfig);
  db_cards = new Loki(CARDS_DB_NAME, cardsDbConfig);
}

var getSettingsCollection = function() {
  var appConfig = db_settings.getCollection(CONFIG_COLLECTION);
  if (appConfig === null) {
    appConfig = db_settings.addCollection(CONFIG_COLLECTION, {unique: ['name']});
  }
  return appConfig;
}

var getClasswareCollection = function() {
  var classwares = db_cards.getCollection(CLASSWARE_COLLECTION);
  if (classwares === null) {
    classwares = db_cards.addCollection(CLASSWARE_COLLECTION, {unique: ['uuid']});
  }
  return classwares;
}

var getResourceCollection = function() {
  var resources = db_cards.getCollection(RESOURCE_COLLECTION);
  if (resources === null) {
    resources = db_cards.addCollection(RESOURCE_COLLECTION, {unique: ['uuid']});
  }
  return resources;
}

var isFirstStartup = function() {
  var result = getSettingsCollection().findOne({'name': 'isFirstStartup'});
  if (result != null) {
    return result.value;
  } else {
    var defaultValue = getSettingsCollection().insert({'name': 'isFirstStartup', 'value': true});
    return defaultValue.value;
  }
}

var setFirstStartupFalse = function() {
  getSettingsCollection().insert({'name': 'isFirstStartup', 'value': false});
}

var getDisplayGridSize = function() {
  var result = getSettingsCollection().find({'name': 'displayGridSize'});
  if (result != null && result.length > 0) {
    return result[0];
  } else {
    getSettingsCollection().insert({'name': 'displayGridSize', 'row': 2, 'column': 2});
    return {'name': 'displayGridSize', 'row': 2, 'column': 2};
  }
}

// Top-level folders are considered as categories. There should not be any xydcards
// appears at the top level. If there is any, put them into other category.
var buildOfficialResourceCollection = function() {
  buildResourceCollection(cordova.file.dataDirectory + "card-assets/", true);
}

var buildResourceCollection = function(resourceRootPath, isOfficial) {
  // Walkthough card-assets folder. Resource should not have layers.
  FileHelper.listDirectoryPromise(resourceRootPath)
  .then(function(list){
    var filtered = _.filter(list, function(item){
      return item.isDirectory && ! _.endsWith(item.nativeURL, 'xydcard/')
    });
    // var categories = [];
    return Q.all(filtered.map(function(node){
      var category = {};
      category.uuid = uuidv4();
      category.cordovaFullPath = node.fullPath;
      category.nativeFullPath = node.nativeURL;
      category.originalOrder = getOrderFromPath(node.fullPath);
      category.isCategory = true;
      category.isOffcial = isOfficial;
      category.coverPath = node.fullPath + 'cover.jpg';

      // Read name.txt
      return FileHelper.readFromFilePromise(node.nativeURL + 'name.txt').then(function(content){
        category.name = content;
        return category
      });
    }));
  }).then(function(categories){
    // Save categories to db
    getResourceCollection().insert(categories);
    // Build cards
    return Q.all(categories.map(function(category){
      return getCardsInPath(category);
    }));
  }).then(function(cards){
    // Save cards to db
    // console.log(_.flatten(cards));
    getResourceCollection().insert(_.flatten(cards));
  }).catch(function(error){
    console.log(error);
    console.log(new Error().stack);
  });
}

var getCardsInPath = function(category) {
  return FileHelper.listDirectoryPromise(category.nativeFullPath).then(function(list){
    var cards = _.filter(list, function(node){
      return node.isDirectory && _.endsWith(node.nativeURL, '.xydcard/');
    });
    // console.log(cards);
    return Q.all(cards.map(function(node){
      // var node = list[i];
      var card = {};
      card.uuid = uuidv4();
      card.category = category.uuid;
      card.originalOrder = getOrderFromPath(node.fullPath);
      card.isCategory = false;
      card.isOffcial = category.isOffcial;
      return getCardImages(node.nativeURL + 'images/').then(function(images){
        return card.images = images;
      }).then(function(){
        return getCardAudios(node.nativeURL + 'audios/').then(function(audios){
          return card.audios = audios;
        });
      }).then(function(){
        // Get card name
        return FileHelper.readFromFilePromise(node.nativeURL + "name.txt").then(function(data){
          card.name = data;
        });
      }).then(function(){
        return card;
      });
    }))
  });
}

var getCardImages = function(imagesPath) {
  return FileHelper.listDirectoryPromise(imagesPath).then(function(list){
    return Q.all(list.map(function(node){
      if(_.endsWith(node.nativeURL, '.jpg')) {
        return node.fullPath;
      }
    }));
  });
}

var getCardAudios = function(audioPath) {
  return FileHelper.listDirectoryPromise(audioPath).then(function(list){
    return Q.all(list.map(function(node){
      if(_.endsWith(node.nativeURL, '.mp3')) {
        return node.fullPath;
      }
    }));
  });
}

var getOrderFromPath = function(path) {
  if (_.endsWith(path, '/')) {
    path = path.slice(0, -1);
  }
  var segments = path.split('/');
  var lastSegment = segments[segments.length - 1];
  if (_.endsWith(lastSegment, '.xydcard')) {
    lastSegment = lastSegment.slice(0, -8);
  }
  var order = parseInt(lastSegment);
  return order;
}

// Classware should have 2 types, one is folder, that can contain cards
// the other one is cards, which can be a card in resource or a resource category.
// For folder
// {
//   uuid: uuid,
//   name: name,
//   type: folder | card,
//   parent: uuid | root,
//   cover: path_to_image
// }
// For card
// {
//   type: card,
//   content: uuid,
//   folder: uuid,
//   animation: no | enlarge | shake
// }
var generateOfficialClasswares = function() {
  // Official categories should be classware
  var results = getResourceCollection().find({'isCategory': true});
  var classwares = [];
  results.map(function(result){
    var classware = {}
    classware.uuid = result.uuid;
    classware.name = result.name;
    classware.type = 'folder';
    classware.parent = 'root'
    classware.cover = result.coverPath;
    classwares.push(classware);
  });

  // Copy cards to corresponding classware folder
  var cards = [];
  classwares.map(function(folder){
    var cardsOfCat = getResourceCollection().find({'category': folder.uuid});
    cardsOfCat.map(function(item){
      var card = {};
      card.type = 'card';
      card.content = item.uuid;
      card.folder = folder.uuid;
      card.animation = 'enlarge';
      cards.push(card);
    })
  });

  getClasswareCollection().insert(classwares);
  getClasswareCollection().insert(cards);
}

var removeResourceCollection = function() {
  db_cards.removeCollection(RESOURCE_COLLECTION);
}

export default {
  initDB,
  isFirstStartup,
  setFirstStartupFalse,
  getDisplayGridSize,
  generateOfficialClasswares,
  buildResourceCollection,
  buildOfficialResourceCollection,
  removeResourceCollection,
  generateOfficialClasswares,

  // These shouldn't be accessed directly ..
  getResourceCollection,
  getSettingsCollection,
  getClasswareCollection
}
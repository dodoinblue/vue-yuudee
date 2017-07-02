import Loki from 'lokijs'
import LokiCordovaFSAdapter from 'loki-cordova-fs-adapter'
import Utils from './utils.js'
import Q from 'q'
import _ from 'lodash'
import FileHelper from './FileHelper'
import uuidv4 from 'uuid/v4'

var database;
var settingsCollection;
var resourceCollection;
var classwareCollection;

const CLASSWARE_COLLECTION = 'classwares'
const RESOURCE_COLLECTION = 'resources'
const SETTINGS_COLLECTION = 'settings'
const DB_PREFIX = 'yuudee'
const DATABASE_NAME = 'database.db'

const SETTINGS_CLASSWARE_BUILT_TIMESTAMP = 'timestampClasswareBuiltDate'
const SETTINGS_DATABASE_VERSION = 'databaseVersion'

var initDB = function() {
  var deferred = Q.defer();

  var autoloadCallback = function(){
    settingsCollection = getSettingsCollection();
    resourceCollection = getResourceCollection();
    classwareCollection = getClasswareCollection();
    deferred.resolve("database loaded");
  }

  var dbConfig = {
    unique: true,
    autoload: true,
    autoloadCallback: autoloadCallback,
    autosave: true,
    autosaveInterval: 1000, // 1 second
  }
  
  var dbFSAdapter = new LokiCordovaFSAdapter({"prefix": DB_PREFIX});

  if (Utils.isCordova) {
    dbConfig.adapter = dbFSAdapter;
  }

  database = new Loki(DATABASE_NAME, dbConfig);
  return deferred.promise;
}

var getCollection = function(collectionName, uniqueField) {
  var collection = database.getCollection(collectionName);
  if (collection === null) {
    collection = database.addCollection(collectionName, {unique: [uniqueField]});
  }
  return collection;
}

var getSettingsCollection = function() {
  return getCollection(SETTINGS_COLLECTION, 'name');
}

var getResourceCollection = function() {
  return getCollection(RESOURCE_COLLECTION, 'uuid');
}

var getClasswareCollection = function() {
  return getCollection(CLASSWARE_COLLECTION, 'uuid');
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

var hasClasswareBuilt = function() {
  var result = getSettingsCollection().find({name: SETTINGS_CLASSWARE_BUILT_TIMESTAMP});
  var classwareTimestampDoc = getSettingsCollection().find();

  return ! _.isEmpty(result);
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
  return buildResourceCollection(cordova.file.dataDirectory + "card-assets/", true);
}

var buildResourceCollection = function(resourceRootPath, isOfficial) {
  // Walkthough card-assets folder. Resource should not have layers.
  return FileHelper.listDirectoryPromise(resourceRootPath)
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
    getResourceCollection().insert(_.flatten(cards));
  })
}

var getCardsInPath = function(category) {
  return FileHelper.listDirectoryPromise(category.nativeFullPath).then(function(list){
    var cards = _.filter(list, function(node){
      return node.isDirectory && _.endsWith(node.nativeURL, '.xydcard/');
    });
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
//   uuid: uuid,
//   type: card,
//   content: uuid,
//   parent: uuid,
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
      card.uuid = item.uuid;
      card.type = 'card';
      card.content = item.uuid;
      card.parent = folder.uuid;
      card.animation = 'enlarge';
      cards.push(card);
    })
  });

  getClasswareCollection().insert(classwares);
  getClasswareCollection().insert(cards);

  updateClasswareTimestamp();
}

var updateClasswareTimestamp = function() {
  var classwareTimestampDoc = getSettingsCollection().find({name: SETTINGS_CLASSWARE_BUILT_TIMESTAMP});
  var timestamp = Date.now();
  if (_.isEmpty(classwareTimestampDoc)) {
    getSettingsCollection().insert({
      name: SETTINGS_CLASSWARE_BUILT_TIMESTAMP,
      value: timestamp
    });
  } else {
    classwareTimestampDoc.value = timestamp;
    getSettingsCollection().update(classwareTimestampDoc);
  }
}

var removeCollection = function(collectionName) {
  var deferred = Q.defer();
  database.removeCollection(collectionName);
  database.saveDatabase(function(error){
    if (error) {
      deferred.reject(error);
    } else {
      deferred.resolve(collectionName + " removed");
    }
  });
  return deferred.promise;
}

var removeSettingsCollection = function() {
  return removeCollection(SETTINGS_COLLECTION);
}

var removeClasswareCollection = function() {
  return removeCollection(CLASSWARE_COLLECTION);
}

var removeResourceCollection = function() {
  return removeCollection(RESOURCE_COLLECTION);
}

export default {
  initDB,
  isFirstStartup,
  setFirstStartupFalse,
  getDisplayGridSize,
  generateOfficialClasswares,
  buildResourceCollection,
  buildOfficialResourceCollection,
  generateOfficialClasswares,
  hasClasswareBuilt,
  removeSettingsCollection,
  removeClasswareCollection,
  removeResourceCollection
}
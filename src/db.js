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

var hasClasswareBuilt = function() {
  var result = getSettingsCollection().find({name: SETTINGS_CLASSWARE_BUILT_TIMESTAMP});
  var classwareTimestampDoc = getSettingsCollection().find();

  return ! _.isEmpty(result);
}

var getDisplayGridSize = function() {
  var result = getSettingsCollection().findOne({'name': 'displayGridSize'});
  if (result == null) {
    result = getSettingsCollection().insert({'name': 'displayGridSize', 'row': 2, 'column': 2});
  }
  return {
    'row': result.row,
    'column': result.column
  };
}

var getRootClasswareUuid = function() {
  var rootUuid = getSettingsCollection().findOne({'name': 'rootClassware'});
  if (rootUuid == null) {
    rootUuid = getSettingsCollection().insert({'name': 'rootClassware', 'value': 'all'});
  }
  return rootUuid.value;
}

var setRootClasswareUuid = function(uuid) {
  var rootUuid = getSettingsCollection().findOne({'name': 'rootClassware'});
  if (rootUuid == null) {
    rootUuid = getSettingsCollection().insert({'name': 'rootClassware', 'value': uuid});
  } else {
    rootUuid.value = uuid;
    getSettingsCollection().update(rootUuid);
  }
}

var getClasswareItemByUuid = function(uuid) {
  if (uuid == 'all') {
    return {'name': 'All'}
  }
  return getClasswareCollection().findOne({'uuid': uuid});
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
      // console.log(node.toInternalURL());
      console.log(node);
      var category = {};
      category.uuid = node.name;
      category.cordovaFullPath = node.fullPath;
      category.nativeFullPath = node.nativeURL;
      category.cdvpath = node.toInternalURL();
      category.isCategory = true;
      category.isOffcial = isOfficial;

      category.coverPath = category.cdvpath + 'cover.jpg';
      return FileHelper.fileExistPromise(category.coverPath).then(function(isExist){
        if (! isExist) {
          console.log(category.coverPath + ' does not exist. Set to ""')
          category.coverPath = '';
        }
        return FileHelper.readFromFilePromise(node.nativeURL + 'info.json');
      }).then(function(content){
        var info = JSON.parse(content);
        category.name = info.name;
        category.originalOrder = parseInt(info.order);
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
      var card = {};
      card.uuid = node.name.slice(0, -8);
      card.category = category.uuid;
      card.isCategory = false;
      card.isOffcial = category.isOffcial;
      card.cdvpath = node.toInternalURL();
      return getCardImages(node.nativeURL + 'images/').then(function(images){
        return card.images = images;
      }).then(function(){
        return getCardAudios(node.nativeURL + 'audios/').then(function(audios){
          return card.audios = audios;
        });
      }).then(function(){
        // Get card name
        return FileHelper.readFromFilePromise(node.nativeURL + "info.json").then(function(content){
          // card.name = data;
          var info = JSON.parse(content);
          card.name = info.name;
          card.originalOrder = parseInt(info.order);
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
        return node.toInternalURL();
      }
    }));
  });
}

var getCardAudios = function(audioPath) {
  return FileHelper.listDirectoryPromise(audioPath).then(function(list){
    return Q.all(list.map(function(node){
      if(_.endsWith(node.nativeURL, '.mp3')) {
        return node.toInternalURL();
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

// Classwares are displayed in YdDisplay page. Classwares also have tree structure.
// Top-level folder (parent == root) are classares showed in dropdown list.
// And special 'All' classware is added dynamically.
//
// Classware item should have 2 types, one is folder, that can contain cards
// the other one is cards, which can be a card in resource or a resource category.
// For folder
// {
//   uuid: uuid,
//   name: name,
//   type: folder,
//   parent: uuid | root,
//   cover: path_to_image
//   order: order // order in parent
// TODO: grid: not genreate this. if null app should use default setting determined by screen size.
// }
// For card
// {
//   uuid: uuid,
//   type: card,
//   content: uuid,
//   parent: uuid,
//   animation: no | enlarge | rotate
//   order: order  // order in parent
//   mute: false
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
    classware.parent = 'root';
    classware.cover = result.coverPath;
    classware.order = result.originalOrder;
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
      card.order = item.originalOrder;
      card.mute = false;
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

var getClasswareList = function() {
  var fromDB = getClasswareCollection()
              .chain()
              .find({'parent': 'root'})
              .simplesort('order')
              .data();
  fromDB.push({'name': 'All', 'uuid': 'all'});
  return fromDB;
}

var getCardsOfClassware = function(uuid) {
  if (uuid == 'all') {
    uuid = 'root'
  }
  return getClasswareCollection()
        .chain()
        .find({'parent': uuid})
        .simplesort('order')
        .data()
}

var getCardByUuid = function(uuid) {
  return getResourceCollection().findOne({'uuid': uuid});
}

var updateClasswareItem = function(doc) {
  getClasswareCollection().update(doc);
}

var deleteClasswareItem = function(doc) {
  var collection = getClasswareCollection();
  var order = doc.order;
  var parent = doc.parent;
  collection.remove(doc);
  collection.findAndUpdate({'order': {'$gt': order}, 'parent': {'$eq': parent}}, function(obj){
    obj.order = obj.order - 1;
  })
}


export default {
  initDB,

  // YdDisplay methods
  getDisplayGridSize,
  getRootClasswareUuid,
  setRootClasswareUuid,
  getCardsOfClassware,
  getClasswareItemByUuid,

  updateClasswareItem,
  deleteClasswareItem,

  // YdResource methods
  getCardByUuid,

  // Build database
  generateOfficialClasswares,
  buildResourceCollection,
  buildOfficialResourceCollection,
  generateOfficialClasswares,
  removeSettingsCollection,
  removeClasswareCollection,
  removeResourceCollection,

  hasClasswareBuilt,
  getClasswareList,

}
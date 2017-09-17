import Loki from 'lokijs'
import LokiCordovaFSAdapter from 'loki-cordova-fs-adapter'
// import Utils from './utils.js'
import Q from 'q'
import _ from 'lodash'
import FileHelper from './FileHelper'
import uuidv4 from 'uuid/v4'

var database
/* eslint-disable no-unused-vars */
var settingsCollection
var resourceCollection
var classwareCollection

const CLASSWARE_COLLECTION = 'classwares'
const RESOURCE_COLLECTION = 'resources'
const SETTINGS_COLLECTION = 'settings'
const DB_PREFIX = 'yuudee'
const DATABASE_NAME = 'database.db'

const SETTINGS_CLASSWARE_BUILT_TIMESTAMP = 'timestampClasswareBuiltDate'
const SETTINGS_DATABASE_VERSION = 'databaseVersion'

var initDB = function() {
  var deferred = Q.defer()

  var autoloadCallback = function() {
    settingsCollection = getSettingsCollection()
    resourceCollection = getResourceCollection()
    classwareCollection = getClasswareCollection()
    deferred.resolve('database loaded')
  }

  var dbConfig = {
    unique: true,
    autoload: true,
    autoloadCallback: autoloadCallback,
    autosave: true,
    autosaveInterval: 200 // ms
  }

  var dbFSAdapter = new LokiCordovaFSAdapter({'prefix': DB_PREFIX})

  dbConfig.adapter = dbFSAdapter

  database = new Loki(DATABASE_NAME, dbConfig)
  return deferred.promise
}

var getCollection = function(collectionName, uniqueField) {
  var collection = database.getCollection(collectionName)
  if (collection === null) {
    collection = database.addCollection(collectionName, {unique: [uniqueField]})
  }
  return collection
}

var getSettingsCollection = function() {
  // if (settingsCollection != null) {
  //   return settingsCollection
  // }
  return getCollection(SETTINGS_COLLECTION, 'name')
}

var getResourceCollection = function() {
  // if (resourceCollection != null) {
  //   return resourceCollection
  // }
  return getCollection(RESOURCE_COLLECTION, 'uuid')
}

var getClasswareCollection = function() {
  // if (classwareCollection != null) {
  //   return classwareCollection
  // }
  return getCollection(CLASSWARE_COLLECTION, 'uuid')
}

var hasClasswareBuilt = function() {
  var result = getSettingsCollection().find({name: SETTINGS_CLASSWARE_BUILT_TIMESTAMP})
  var classwareTimestampDoc = getSettingsCollection().find()

  return !_.isEmpty(result)
}

// Only for displaying all category, and use as default value
var getDefaultGridSize = function() {
  var result = getSettingsCollection().findOne({'name': 'gridSize'})
  if (result === null) {
    var size = window.innerWidth >= 480 ? 3 : 2
    result = getSettingsCollection().insert({'name': 'gridSize', 'row': size, 'col': size})
  }
  return {
    'row': result.row,
    'col': result.col
  }
}

var setDefaultGridSize = function(row, col) {
  var doc = getSettingsCollection().findOne({'name': 'gridSize'})
  doc.row = row
  doc.col = col
  getSettingsCollection().update(doc)
}

var getLanguage = function() {
  var lang = getSettingsCollection().findOne({'name': 'language'})
  if (lang) {
    return lang.value
  } else {
    return null
  }
}

var setLanguage = function(langString) {
  var lang = getSettingsCollection().findOne({'name': 'language'})
  if (lang === null) {
    lang = getSettingsCollection().insert({'name': 'language', 'value': langString})
  } else {
    lang.value = langString
    getSettingsCollection().update(lang)
  }
}

var getNewUserHelperFlag = function() {
  let flag = getSettingsCollection().findOne({'name': 'newUserHelperFlag'})
  if (typeof flag !== 'undefined' && flag !== null) {
    return flag.value
  } else {
    return true
  }
}

var setNewUserHelperFlag = function(value) {
  var flag = getSettingsCollection().findOne({'name': 'newUserHelperFlag'})
  if (flag === null) {
    flag = getSettingsCollection().insert({'name': 'newUserHelperFlag', 'value': value})
  } else {
    flag.value = value
    getSettingsCollection().update(value)
  }
}

var getRootClasswareUuid = function() {
  var rootUuid = getSettingsCollection().findOne({'name': 'rootClassware'})
  if (rootUuid === null) {
    rootUuid = getSettingsCollection().insert({'name': 'rootClassware', 'value': 'all'})
  }
  return rootUuid.value
}

var setRootClasswareUuid = function(uuid) {
  var rootUuid = getSettingsCollection().findOne({'name': 'rootClassware'})
  if (rootUuid === null) {
    rootUuid = getSettingsCollection().insert({'name': 'rootClassware', 'value': uuid})
  } else {
    rootUuid.value = uuid
    getSettingsCollection().update(rootUuid)
  }
}

var getClasswareItemByUuid = function(uuid) {
  if (uuid === 'all') {
    let allLocalized
    try {
      allLocalized = window.app.$t('message.all')
    } catch (error) {
      allLocalized = 'All'
    }
    return {'name': allLocalized}
  }
  return getClasswareCollection().findOne({'uuid': uuid})
}

// Top-level folders are considered as categories. There should not be any xydcards
// appears at the top level. If there is any, put them into other category.
/* eslint-disable no-undef */
var buildOfficialResourceCollection = function() {
  return buildResourceCollection(cordova.file.dataDirectory + 'card-assets/', true)
}

var buildResourceCollection = function(resourceRootPath, isOfficial) {
  // Walkthough card-assets folder. Resource should not have layers.
  return FileHelper.listDirectoryPromise(resourceRootPath).then(function(list) {
    var filtered = _.filter(list, function(item) {
      return item.isDirectory && !_.endsWith(item.nativeURL, 'xydcard/')
    })
    // var categories = []
    return Q.all(filtered.map(function(node) {
      var category = {}
      category.uuid = node.name
      category.cordovaFullPath = node.fullPath
      category.nativeFullPath = node.nativeURL
      category.cdvpath = node.toInternalURL()
      category.isCategory = true
      category.isOffcial = isOfficial

      category.cover = category.cdvpath + 'cover.jpg'
      return FileHelper.fileExistPromise(category.cover).then(function(isExist) {
        if (!isExist) {
          console.log(category.cover + ' does not exist. Set to ""')
          category.cover = ''
        }
        return FileHelper.readFromFilePromise(node.nativeURL + 'info.json')
      }).then(function(content) {
        var info = JSON.parse(content)
        category.name = info.name
        category.originalOrder = parseInt(info.order)
        return category
      })
    }))
  }).then(function(categories) {
    // Save categories to db
    getResourceCollection().insert(categories)
    // Build cards
    let allCards = []
    let deferred = Q()
    for (let i = 0; i < categories.length; i++) {
      deferred = deferred.then(() => {
        return getCardsInPath(categories[i])
      }).then((cards) => {
        allCards = allCards.concat(cards)
      })
    }
    return deferred.then(() => {
      return allCards
    })
  }).then(function(cards) {
    // Save cards to db
    getResourceCollection().insert(cards)
  })
}

var getCardsInPath = function(category) {
  return FileHelper.listDirectoryPromise(category.nativeFullPath).then(function(list) {
    var cards = _.filter(list, function(node) {
      return node.isDirectory && _.endsWith(node.nativeURL, '.xydcard/')
    })
    return Q.all(cards.map(function(node) {
      var card = {}
      card.uuid = node.name.slice(0, -8)
      card.category = category.uuid
      card.isCategory = false
      card.isOffcial = category.isOffcial
      card.cdvpath = node.toInternalURL()
      return getCardImages(node.nativeURL + 'images/').then(function(images) {
        card.images = images
      }).then(function() {
        return getCardAudios(node.nativeURL + 'audios/').then(function(audios) {
          card.audios = audios
        })
      }).then(function() {
        // Get card name
        return FileHelper.readFromFilePromise(node.nativeURL + 'info.json').then(function(content) {
          // card.name = data
          var info = JSON.parse(content)
          card.name = info.name
          card.originalOrder = parseInt(info.order)
        })
      }).then(function() {
        return card
      })
    }))
  })
}

var getCardImages = function(imagesPath) {
  return FileHelper.listDirectoryPromise(imagesPath).then(function(list) {
    return Q.all(list.map(function(node) {
      if (_.endsWith(node.nativeURL, '.jpg')) {
        return node.toInternalURL()
      }
    }))
  })
}

var getCardAudios = function(audioPath) {
  return FileHelper.listDirectoryPromise(audioPath).then(function(list) {
    return Q.all(list.map(function(node) {
      let ext = FileHelper.getExtensionFromPath(node.nativeURL)
      let possibleAudioFormats = ['mp3', 'wav', 'mp4', 'm4a', 'amr', 'ogg', 'mkv', '.flac', '3gp', 'ts', 'aac']
      if (_.indexOf(possibleAudioFormats, ext) > -1) {
        return node.toInternalURL()
      } else {
        console.log('Audio format not supported!!!! ' + node.nativeURL)
        window.ga.trackException('Audio format not supported: ' + ext, true) // where Fatal is boolean
      }
    }))
  })
}

var getOrderFromPath = function(path) {
  if (_.endsWith(path, '/')) {
    path = path.slice(0, -1)
  }
  var segments = path.split('/')
  var lastSegment = segments[segments.length - 1]
  if (_.endsWith(lastSegment, '.xydcard')) {
    lastSegment = lastSegment.slice(0, -8)
  }
  var order = parseInt(lastSegment)
  return order
}

// Classwares are displayed in YdDisplay page. Classwares also have tree structure.
// Top-level folder (parent === root) are classares showed in dropdown list.
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
  var results = getResourceCollection().find({'isCategory': true})
  var classwares = []
  results.map(function(result) {
    var classware = {}
    classware.uuid = result.uuid
    classware.name = result.name
    classware.type = 'folder'
    classware.parent = 'root'
    classware.cover = result.cover
    classware.order = result.originalOrder
    classwares.push(classware)
  })

  // Copy cards to corresponding classware folder
  var cards = []
  classwares.map(function(folder) {
    var cardsOfCat = getResourceCollection().find({'category': folder.uuid})
    cardsOfCat.map(function(item) {
      var card = {}
      card.uuid = item.uuid
      card.type = 'card'
      card.content = item.uuid
      card.parent = folder.uuid
      card.animation = 'enlarge'
      card.order = item.originalOrder
      card.mute = false
      cards.push(card)
    })
  })

  getClasswareCollection().insert(classwares)
  getClasswareCollection().insert(cards)

  updateClasswareTimestamp()
}

var updateClasswareTimestamp = function() {
  var classwareTimestampDoc = getSettingsCollection().find({name: SETTINGS_CLASSWARE_BUILT_TIMESTAMP})
  var timestamp = Date.now()
  if (_.isEmpty(classwareTimestampDoc)) {
    getSettingsCollection().insert({
      name: SETTINGS_CLASSWARE_BUILT_TIMESTAMP,
      value: timestamp
    })
  } else {
    classwareTimestampDoc.value = timestamp
    getSettingsCollection().update(classwareTimestampDoc)
  }
}

var removeCollection = function(collectionName) {
  var deferred = Q.defer()
  database.removeCollection(collectionName)
  database.saveDatabase(function(error) {
    if (error) {
      deferred.reject(error)
    } else {
      deferred.resolve(collectionName + ' removed')
    }
  })
  return deferred.promise
}

var removeSettingsCollection = function() {
  return removeCollection(SETTINGS_COLLECTION)
}

var removeClasswareCollection = function() {
  return removeCollection(CLASSWARE_COLLECTION)
}

var removeResourceCollection = function() {
  return removeCollection(RESOURCE_COLLECTION)
}

/* eslint-disable indent */
var getClasswareList = function() {
  var fromDB = getClasswareCollection()
              .chain()
              .find({'parent': 'root'})
              .simplesort('order')
              .data()
  let allLocalized
  try {
    allLocalized = window.app.$t('message.all')
  } catch (error) {
    allLocalized = 'All'
  }
  fromDB.push({'name': allLocalized, 'uuid': 'all'})
  return fromDB
}

var getCardsOfClassware = function(uuid) {
  if (uuid === 'all') {
    uuid = 'root'
  }
  return getClasswareCollection()
        .chain()
        .find({'parent': uuid})
        .simplesort('order')
        .data()
}

var getCardByUuid = function(uuid) {
  return getResourceCollection().findOne({'uuid': uuid})
}

var updateClasswareItem = function(doc) {
  getClasswareCollection().update(doc)
}

var deleteTopLevelCourseware = function(doc) {
  // Remove sub content
  deleteAllSubClasswareItem(doc)
  var collection = getClasswareCollection()
  var order = doc.order
  var parent = doc.parent
  collection.remove(doc)

  // Reorder. Move all cards after deleted card 1 position forward
  collection.findAndUpdate({'order': {'$gt': order}, 'parent': {'$eq': parent}}, function(obj) {
    obj.order = obj.order - 1
  })
}

var deleteClasswareItem = function(doc) {
  var collection = getClasswareCollection()
  var order = doc.order
  var parent = doc.parent

  // Update to place holder type
  doc.uuid = uuidv4()
  doc.type = 'placeholder'
  delete doc.content
  delete doc.mute
  delete doc.animation
  var updated = collection.update(doc)

  // Now compare the order of the last non-placeholder card and
  // the order of the last all cards
  var allCards = collection.chain().find({
    'parent': {'$eq': parent}
  }).simplesort('order').data()

  var allNonPlaceholders = collection.chain().find({
    'parent': {'$eq': parent},
    'type': {'$ne': 'placeholder'}
  }).simplesort('order').data()

  var lastOfAll = allCards[allCards.length - 1].order
  var lastOfNonPlaceholder
  if (allNonPlaceholders.length === 0) {
    // No non-placeholder left, delete from 0
    lastOfNonPlaceholder = 0
  } else {
    // Delete everything after this card
    lastOfNonPlaceholder = allNonPlaceholders[allNonPlaceholders.length - 1].order
  }

  if (lastOfNonPlaceholder < lastOfAll) {
    console.log(`Removing trailing placeholder cards. pos: ${lastOfNonPlaceholder} to pos: ${lastOfAll}`)
    collection.findAndRemove({
      'parent': {'$eq': parent},
      'order': {'$gt': lastOfNonPlaceholder, '$lte': lastOfAll}
    })
  }
}

var deleteAllSubClasswareItem = function(doc) {
  if (doc.type !== 'folder') {
    throw new Error('Card item should not have sub items')
  }
  console.log('deleting sub contents')
  var collection = getClasswareCollection()
  var subfolders = collection.find({'parent': {'$eq': doc.uuid}, 'type': {'$eq': 'folder'}})
  for (var i = 0; i < subfolders.length; i++) {
    console.log('recursively deleting: ' + i)
    deleteAllSubClasswareItem(subfolders[i])
  }
  // TODO: switch to findAndRemove
  // collection.findAndUpdate({'parent': {'$eq': doc.uuid}}, function(obj) {
  //   console.log(obj.uuid)
  // })
  collection.findAndRemove({'parent': {'$eq': doc.uuid}})
}

var insertResourceCategory = function(categoryPath, isOfficial) {
  return FileHelper.getDirPromise(categoryPath).then(function(node) {
    var category = {}
    category.uuid = node.name
    category.cordovaFullPath = node.fullPath
    category.nativeFullPath = node.nativeURL
    category.cdvpath = node.toInternalURL()
    category.isCategory = true
    category.isOffcial = isOfficial
    category.cover = category.cdvpath + 'cover.jpg'
    return FileHelper.fileExistPromise(category.cover).then(function(isExist) {
      if (!isExist) {
        console.log(category.cover + ' does not exist. Set to ""')
        category.cover = ''
      }
      return FileHelper.readFromFilePromise(node.nativeURL + 'info.json')
    }).then(function(content) {
      var info = JSON.parse(content)
      category.name = info.name
      category.originalOrder = parseInt(info.order)
      return category
    })
  }).then(function(category) {
    return getResourceCollection().insert(category)
  })
}

var insertResourceCard = function(cardPath, category) {
  return FileHelper.getDirPromise(cardPath).then(function(node) {
    var card = {}
    card.uuid = node.name.slice(0, -8)
    card.category = category.uuid
    card.isCategory = false
    card.isOffcial = category.isOfficial
    card.cdvpath = node.toInternalURL()
    return getCardImages(node.nativeURL + 'images/').then(function(images) {
      card.images = images
    }).then(function() {
      return getCardAudios(node.nativeURL + 'audios/').then(function(audios) {
        card.audios = audios
      }).catch((error) => {
        // It is possible that no audio is provided. return empty array
        console.log('error processing audio to db: ' + error.code)
        card.audios = []
      })
    }).then(function() {
      // Get card name
      return FileHelper.readFromFilePromise(node.nativeURL + 'info.json').then(function(content) {
        // card.name = data
        var info = JSON.parse(content)
        card.name = info.name
        card.originalOrder = parseInt(info.order)
      })
    }).then(function() {
      return card
    })
  }).then(function(card) {
    return getResourceCollection().insert(card)
  })
}

var deleteResourceCategory = function(doc) {
  if (!doc.isCategory) {
    console.log('Mismatch. Should be a category')
    return Q.reject('Not a category')
  }
  // Resource does not allow more than 2 layer. No need to do it resursively
  // Step 1, find all cards in this category, delete it in classware collection
  var resCards = getResourceCollection().find({
    'category': {'$eq': doc.uuid}
  })
  if (resCards && resCards.length > 0) {
    resCards.forEach((card) => {
      console.log('removing res card ' + card.uuid + ' from classware')
      removeCoursewareItemByContentId(card.uuid)
    })
  }
  // Now search and delete itself in courseware collection
  removeCoursewareItemByContentId(doc.uuid)

  // Step 2, delete from resource collection
  getResourceCollection().findAndRemove({
    'category': {'$eq': doc.uuid}
  })
  getResourceCollection().remove(doc)

  // Step 3, remove folder from fs
  return FileHelper.removeFolderIfExistPromise(doc.cdvpath)
}

var getCardsOfRecourceCategory = function(uuid) {
  if (uuid === 'all') {
    return getResourceCollection()
           .chain()
           .find({'isCategory': true})
           .simplesort('originalOrder')
           .data()
  } else {
    return getResourceCollection()
           .chain()
           .find({'category': {'$eq': uuid}})
           .simplesort('originalOrder')
           .data()
  }
}

var getAllResourceCategories = function() {
  return getResourceCollection().chain()
         .find({'isCategory': true})
         .simplesort('originalOrder')
         .data()
}

var getNonOfficialResourceCategories = function() {
  let result = getResourceCollection().chain()
         .find({
           'isCategory': {'$eq': true},
           'isOffcial': {'$eq': false}
          }).simplesort('originalOrder')
         .data()
  result.push(getCardByUuid('Other'))
  return result
}

var insertRootClassware = function(name) {
  var classware = {}
  classware.uuid = uuidv4()
  classware.name = name
  classware.type = 'folder'
  classware.parent = 'root'
  classware.cover = ''
  var fromDB = getClasswareCollection()
            .chain()
            .find({'parent': 'root'})
            .simplesort('order')
            .data()
  if (fromDB.length !== 0) {
    var largestOrder = fromDB[fromDB.length - 1].order
    classware.order = largestOrder + 1
  } else {
    classware.order = 1
  }

  return getClasswareCollection().insert(classware)
}

var deleteResourceCard = function(doc) {
  getResourceCollection().remove(doc)
  // Remove corresponding courseware items
  removeCoursewareItemByContentId(doc.uuid)
}

var removeCoursewareItemByContentId = function(id) {
  var coursewareItems = getClasswareCollection().find({'content': {'$eq': id}})
  if (coursewareItems && coursewareItems.length > 0) {
    coursewareItems.forEach((item) => {
      deleteClasswareItem(item)
    })
  }
}

var addFolderContentToCourseware = function(folder) {
  // Find its content
  var cards = getCardsOfRecourceCategory(folder.content)

  var toAdd = []
  if (cards && cards.length > 0) {
    // Generate a courseware item and push to array
    for (let i = 0; i < cards.length; i++) {
      let item = cards[i]
      let card = {}
      card.uuid = uuidv4()
      card.type = 'card'
      card.content = item.uuid
      card.parent = folder.uuid
      card.animation = 'enlarge'
      card.order = i
      card.mute = false
      toAdd.push(card)
      console.log('new classware item created: ' + card.uuid)
    }
    getClasswareCollection().insert(toAdd)
  } else {
    console.log('Warning: Adding a category but sub content is not found')
  }
}

export default {
  initDB,

  getLanguage,
  setLanguage,
  getNewUserHelperFlag,
  setNewUserHelperFlag,

  // YdDisplay methods
  getDefaultGridSize,
  setDefaultGridSize,
  getRootClasswareUuid,
  setRootClasswareUuid,
  getCardsOfClassware,
  getClasswareItemByUuid,

  updateClasswareItem,
  deleteClasswareItem,
  deleteTopLevelCourseware,
  deleteAllSubClasswareItem,
  insertRootClassware,
  addFolderContentToCourseware,

  // YdResource methods
  getCardByUuid,
  getCardsOfRecourceCategory,
  getAllResourceCategories,
  getNonOfficialResourceCategories,
  insertResourceCategory,
  insertResourceCard,
  deleteResourceCategory,
  deleteResourceCard,

  // Build database
  // generateOfficialClasswares,
  buildResourceCollection,
  buildOfficialResourceCollection,
  generateOfficialClasswares,
  removeSettingsCollection,
  removeClasswareCollection,
  removeResourceCollection,

  hasClasswareBuilt,
  getClasswareList,

  getClasswareCollection,
  getResourceCollection
}

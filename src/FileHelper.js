import Q from 'q'
import _ from 'lodash'

var errorHandler = function (fileName, e) {
  var msg = ''

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'Storage quota exceeded'
      break
    case FileError.NOT_FOUND_ERR:
      msg = 'File not found'
      break
    case FileError.SECURITY_ERR:
      msg = 'Security error'
      break
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'Invalid modification'
      break
    case FileError.INVALID_STATE_ERR:
      msg = 'Invalid state'
      break
    default:
      msg = 'Unknown error'
      break
  }

  console.log('Error (' + fileName + '): ' + msg)
}

var errorHandlerPromise = function(fileName, deferred, e) {
  errorHandler(fileName, e)
  deferred.reject(e)
}

// function readFromFile(pathToFile, cb) {
//   // var pathToFile = cordova.file.dataDirectory + fileName
//   window.resolveLocalFileSystemURL(pathToFile, function (fileEntry) {
//     fileEntry.file(function (file) {
//     var reader = new FileReader()

//     reader.onloadend = function (e) {
//       cb(JSON.parse(this.result))
//     }

//     reader.readAsText(file)
//     }, errorHandler.bind(null, fileName))
//     }, errorHandler.bind(null, fileName))
// }

function fileExistPromise(pathToFile) {
  var deferred = Q.defer()
  window.resolveLocalFileSystemURL(pathToFile, function (fileEntry) {
    deferred.resolve(true)
  }, function(error) {
    if (error.code === FileError.NOT_FOUND_ERR) {
      deferred.resolve(false)
    } else {
      errorHandlerPromise(pathToFile, deferred, error)
    }
  })
  return deferred.promise
}

function dirExistPromise(pathToDir) {
  var deferred = Q.defer()
  window.resolveLocalFileSystemURL(pathToDir, function (dirEntry) {
    deferred.resolve(true)
  }, function(error) {
    if (error.code === FileError.NOT_FOUND_ERR) {
      deferred.resolve(false)
    } else {
      errorHandlerPromise(pathToDir, deferred, error)
    }
  })
  return deferred.promise
}

function getDirPromise(pathToDir) {
  var deferred = Q.defer()
  window.resolveLocalFileSystemURL(pathToDir, function (dirEntry) {
    deferred.resolve(dirEntry)
  }, errorHandlerPromise.bind(null, pathToDir, deferred))
  return deferred.promise
}

function getFilePromise(pathTofile) {
  var deferred = Q.defer()
  window.resolveLocalFileSystemURL(pathTofile, function (fileEntry) {
    deferred.resolve(fileEntry)
  }, errorHandlerPromise.bind(null, pathTofile, deferred))
  return deferred.promise
}

function readFromFilePromise(pathToFile) {
  var deferred = Q.defer()
  window.resolveLocalFileSystemURL(pathToFile, function (fileEntry) {
    fileEntry.file(function (file) {
      var reader = new FileReader()

      reader.onloadend = function (e) {
        // cb(JSON.parse(this.result))
        deferred.resolve(this.result)
      }

      reader.readAsText(file)
    }, errorHandlerPromise.bind(null, pathToFile, deferred))
  }, errorHandlerPromise.bind(null, pathToFile, deferred))
  return deferred.promise
}

// function writeToFile(fileName, data) {
//   data = JSON.stringify(data, null, '\t')
//   window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (directoryEntry) {
//     directoryEntry.getFile(fileName, { create: true }, function (fileEntry) {
//       fileEntry.createWriter(function (fileWriter) {
//         fileWriter.onwriteend = function (e) {
//           // for real-world usage, you might consider passing a success callback
//           console.log('Write of file "' + fileName + '"" completed.')
//         }

//         fileWriter.onerror = function (e) {
//           // you could hook this up with our global error handler, or pass in an error callback
//           console.log('Write failed: ' + e.toString())
//         }

//         var blob = new Blob([data], { type: 'text/plain' })
//         fileWriter.write(blob)
//       }, errorHandler.bind(null, fileName))
//     }, errorHandler.bind(null, fileName))
//   }, errorHandler.bind(null, fileName))
// }

function writeToFilePromise(folder, fileName, data) {
  var deferred = Q.defer()
  var pathToFile = `${folder}/${fileName}`

  data = JSON.stringify(data, null, '\t')
  window.resolveLocalFileSystemURL(folder, function (directoryEntry) {
    directoryEntry.getFile(fileName, { create: true }, function (fileEntry) {
      fileEntry.createWriter(function (fileWriter) {
        fileWriter.onwriteend = function (e) {
          console.log('Write of file "' + fileName + '" completed.')
          deferred.resolve(e)
        }

        fileWriter.onerror = function (e) {
          console.log('Write failed: ' + e.toString())
          deferred.reject(e)
        }

        var blob = new Blob([data], { type: 'text/plain' })
        fileWriter.write(blob)
      }, errorHandlerPromise.bind(null, pathToFile, deferred))
    }, errorHandlerPromise.bind(null, pathToFile, deferred))
  }, errorHandlerPromise.bind(null, pathToFile, deferred))
  return deferred.promise
}

// function downloadFile(url, cdvDirectory, path) {
//   var targetPath = cdvDirectory + path
//   var trustHosts = true
//   var options = {}
//   var ft = new FileTransfer()

//   ft.download(
//     url,
//     targetPath,
//     function(entry){console.log("download complete: " + entry.toURL())},
//     function(error) {
//       console.log("download error source " + error.source)
//       console.log("download error target " + error.target)
//       console.log("download error code" + error.code)
//     },
//     {}
//   )
// }

/* eslint-disable no-undef */
function downloadFilePromise(url, pathToFile, onProgress) {
  var deferred = Q.defer()
  // var trustHosts = true
  // var options = {}
  var ft = new FileTransfer()
  if (onProgress) {
    ft.onprogress = onProgress
  }
  console.log('downloading')
  ft.download(
    url,
    pathToFile,
    function(entry) {
      console.log('download complete: ' + entry.toURL())
      deferred.resolve(entry)
    }, function(error) {
      console.log('download error source ' + error.source)
      console.log('download error target ' + error.target)
      console.log('download error code' + error.code)
      deferred.reject(error)
    },
    false,
    {}
  )
  return deferred.promise
}

function toArray(list) {
  return Array.prototype.slice.call(list || [], 0)
}

function listDirectoryPromise(pathToDir) {
  var deferred = Q.defer()
  // console.log(pathToDir)

  // TODO: polyfill window.resolveLocalFileSystemURL
  window.resolveLocalFileSystemURL(pathToDir, function (directoryEntry) {
    var dirReader = directoryEntry.createReader()
    var entries = []
    // Call the reader.readEntries() until no more results are returned.
    var readEntries = function() {
      dirReader.readEntries(function(results) {
        if (!results.length) {
          // listResults(entries.sort())
          deferred.resolve(entries.sort())
        } else {
          entries = entries.concat(toArray(results))
          readEntries()
        }
      }, errorHandlerPromise.bind(null, pathToDir, deferred))
    }
    readEntries() // Start reading dirs.
  }, errorHandlerPromise.bind(null, pathToDir, deferred))
  return deferred.promise
}

function removeFolderIfExistPromise(pathToDir) {
  var deferred = Q.defer()
  window.resolveLocalFileSystemURL(pathToDir, function (directoryEntry) {
    // directoryEntry.removeRecursively(deferred.resolve, deferred.reject)
    directoryEntry.removeRecursively(deferred.resolve, deferred.reject)
  }, function(error) {
    if (error.code === FileError.NOT_FOUND_ERR) {
      deferred.resolve()
    } else {
      errorHandlerPromise(pathToDir, deferred, error)
    }
  })
  return deferred.promise
}

function removeFile(pathToFile) {
  var deferred = Q.defer()
  window.resolveLocalFileSystemURL(pathToFile, function (fileEntry) {
    fileEntry.remove(deferred.resolve, deferred.reject)
  }, errorHandlerPromise.bind(null, pathToFile, deferred))
  return deferred.promise
}

function getCdvPath(pathToFile) {
  var deferred = Q.defer()
  window.resolveLocalFileSystemURL(pathToFile, function (fileEntry) {
    deferred.resolve(fileEntry.toInternalURL())
  }, deferred.reject)
  return deferred.promise
}

function getExtensionFromPath(pathToFile) {
  var pathSegments = pathToFile.split('.')
  return pathSegments[pathSegments.length - 1]
}

function getFolderFromPath(pathToFile) {
  if (_.endsWith(pathToFile, '/')) {
    return pathToFile
  }
  var pathSegments = pathToFile.split('/')
  return pathSegments.slice(0, pathSegments.length - 1).join('/') + '/'
}


// Borrowed from ng-cordova
function moveFilePromise(path, fileName, newPath, newFileName) {
  var q = Q.defer()

  newFileName = newFileName || fileName

  if ((/^\//.test(fileName)) || (/^\//.test(newFileName))) {
    q.reject('file-name cannot start with /')
  }

  try {
    window.resolveLocalFileSystemURL(path, function (fileSystem) {
      fileSystem.getFile(fileName, {create: false}, function (fileEntry) {
        window.resolveLocalFileSystemURL(newPath, function (newFileEntry) {
          fileEntry.moveTo(newFileEntry, newFileName, function (result) {
            q.resolve(result)
          }, function (error) {
            q.reject(error)
          })
        }, function (err) {
          q.reject(err)
        })
      }, function (err) {
        q.reject(err)
      })
    }, function (er) {
      q.reject(er)
    })
  } catch (e) {
    q.reject(e)
  }
  return q.promise
}

// Borrowed from ng-cordova
function createDirPromise(path, dirName, replaceBool) {
  var q = Q.defer()

  if ((/^\//.test(dirName))) {
    q.reject('directory cannot start with /')
  }

  replaceBool = !replaceBool

  var options = {
    create: true,
    exclusive: replaceBool
  }

  try {
    window.resolveLocalFileSystemURL(path, function (fileSystem) {
      fileSystem.getDirectory(dirName, options, function (result) {
        q.resolve(result)
      }, function (error) {
        q.reject(error)
      })
    }, function (err) {
      errorHandlerPromise(`${path}/${dirName}`, q, err)
    })
  } catch (e) {
    errorHandlerPromise(`${path}/${dirName}`, q, e)
  }
  return q.promise
}

function moveDirPromise(path, dirName, newPath, newDirName) {
  var q = Q.defer()

  newDirName = newDirName || dirName

  if (/^\//.test(dirName) || (/^\//.test(newDirName))) {
    q.reject('file-name cannot start with /')
  }

  try {
    window.resolveLocalFileSystemURL(path, function (fileSystem) {
      fileSystem.getDirectory(dirName, {create: false}, function (dirEntry) {
        window.resolveLocalFileSystemURL(newPath, function (newDirEntry) {
          dirEntry.moveTo(newDirEntry, newDirName, function (result) {
            q.resolve(result)
          }, function (error) {
            q.reject(error)
          })
        }, function (erro) {
          q.reject(erro)
        })
      }, function (err) {
        q.reject(err)
      })
    }, function (er) {
      q.reject(er)
    })
  } catch (e) {
    q.reject(e)
  }
  return q.promise
}

function copyFilePromise (srcPath, targetDir, targetName) {
  var deferred = Q.defer()
  window.resolveLocalFileSystemURL(srcPath, function (fileEntry) {
    window.resolveLocalFileSystemURL(targetDir, function (newFolderEntry) {
      if (!targetName) {
        targetName = fileEntry.name
      }
      fileEntry.copyTo(newFolderEntry, targetName, deferred.resolve, errorHandlerPromise.bind(null, srcPath, deferred))
    }, errorHandlerPromise.bind(null, srcPath, deferred))
  }, errorHandlerPromise.bind(null, srcPath, deferred))

  return deferred.promise
}

function moveFileBySrcPromise (srcPath, targetDir, targetName) {
  var deferred = Q.defer()
  window.resolveLocalFileSystemURL(srcPath, function (fileEntry) {
    window.resolveLocalFileSystemURL(targetDir, function (newFolderEntry) {
      if (!targetName) {
        targetName = fileEntry.name
      }
      fileEntry.moveTo(newFolderEntry, targetName, deferred.resolve, errorHandlerPromise.bind(null, srcPath, deferred))
    }, errorHandlerPromise.bind(null, srcPath, deferred))
  }, errorHandlerPromise.bind(null, srcPath, deferred))

  return deferred.promise
}

function writeJsonToFilePromise (jsonObj, targetDir, fileName) {
  var deferred = Q.defer()

  window.resolveLocalFileSystemURL(targetDir, function(folderEntry) {
    folderEntry.getFile(fileName, {create: true}, function(fileEntry) {
      fileEntry.createWriter(function(fileWriter) {
        fileWriter.onwriteend = function(event) {
          deferred.resolve()
        }
        fileWriter.write(JSON.stringify(jsonObj))
      }, deferred.reject)
    }, errorHandlerPromise.bind(null, targetDir, deferred))
  }, errorHandlerPromise.bind(null, targetDir, deferred))

  return deferred.promise
}

function getUserFolderParent() {
  var userResourceParentFolder
  if (cordova.platformId === 'ios') {
    userResourceParentFolder = cordova.file.dataDirectory
  } else {
    userResourceParentFolder = cordova.file.externalApplicationStorageDirectory
  }
  return userResourceParentFolder
}

function getUserAssetFolder() {
  return getUserFolderParent() + 'UserAssets/'
}

function getUserCoverFolder() {
  return getUserFolderParent() + 'UserCovers/'
}

export default {
  downloadFilePromise,
  writeToFilePromise,
  readFromFilePromise,
  fileExistPromise,
  dirExistPromise,
  getDirPromise,
  getFilePromise,
  listDirectoryPromise,
  removeFolderIfExistPromise,
  removeFile,
  getCdvPath,
  moveFilePromise,
  moveFileBySrcPromise,
  createDirPromise,
  moveDirPromise,
  copyFilePromise,
  writeJsonToFilePromise,

  // Utils
  getExtensionFromPath,
  getFolderFromPath,

  // Constants Getter
  getUserFolderParent,
  getUserAssetFolder,
  getUserCoverFolder
}

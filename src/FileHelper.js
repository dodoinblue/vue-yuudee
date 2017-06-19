import Q from 'q'

var errorHandler = function (fileName, e) {  
  var msg = '';

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'Storage quota exceeded';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'File not found';
      break;
    case FileError.SECURITY_ERR:
      msg = 'Security error';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'Invalid modification';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'Invalid state';
      break;
    default:
      msg = 'Unknown error';
      break;
  };

  console.log('Error (' + fileName + '): ' + msg);
}

var errorHandlerPromise = function(fileName, deferred, e) {
  errorHandler(fileName, e);
  deferred.reject(e);
}

function readFromFile(pathToFile, cb) {
  // var pathToFile = cordova.file.dataDirectory + fileName;
  window.resolveLocalFileSystemURL(pathToFile, function (fileEntry) {
    fileEntry.file(function (file) {
    var reader = new FileReader();

    reader.onloadend = function (e) {
      cb(JSON.parse(this.result));
    };

    reader.readAsText(file);
    }, errorHandler.bind(null, fileName));
    }, errorHandler.bind(null, fileName));
}

function readFromFilePromise(pathToFile) {
  var deferred = Q.defer();
  window.resolveLocalFileSystemURL(pathToFile, function (fileEntry) {
    fileEntry.file(function (file) {
    var reader = new FileReader();

    reader.onloadend = function (e) {
      // cb(JSON.parse(this.result));
      deferred.resolve(JSON.parse(this.result));
    };

    reader.readAsText(file);
    }, errorHandlerPromise.bind(null, pathToFile, deferred));
  }, errorHandlerPromise.bind(null, pathToFile, deferred));
  return deferred.promise
}

function writeToFile(fileName, data) {
  data = JSON.stringify(data, null, '\t');
  window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (directoryEntry) {
    directoryEntry.getFile(fileName, { create: true }, function (fileEntry) {
      fileEntry.createWriter(function (fileWriter) {
        fileWriter.onwriteend = function (e) {
          // for real-world usage, you might consider passing a success callback
          console.log('Write of file "' + fileName + '"" completed.');
        };

        fileWriter.onerror = function (e) {
          // you could hook this up with our global error handler, or pass in an error callback
          console.log('Write failed: ' + e.toString());
        };

        var blob = new Blob([data], { type: 'text/plain' });
        fileWriter.write(blob);
      }, errorHandler.bind(null, fileName));
    }, errorHandler.bind(null, fileName));
  }, errorHandler.bind(null, fileName));
}

function writeToFilePromise(folder, fileName, data) {
  var deferred = Q.defer();
  var pathToFile = `${folder}/${fileName}`

  data = JSON.stringify(data, null, '\t');
  window.resolveLocalFileSystemURL(folder, function (directoryEntry) {
    directoryEntry.getFile(fileName, { create: true }, function (fileEntry) {
      fileEntry.createWriter(function (fileWriter) {
        fileWriter.onwriteend = function (e) {
          console.log('Write of file "' + fileName + '"" completed.');
          deferred.resolve(e);
        };

        fileWriter.onerror = function (e) {
          console.log('Write failed: ' + e.toString());
          deferred.reject(e);
        };

        var blob = new Blob([data], { type: 'text/plain' });
        fileWriter.write(blob);
      }, errorHandlerPromise.bind(null, pathToFile, deferred));
    }, errorHandlerPromise.bind(null, pathToFile, deferred));
  }, errorHandlerPromise.bind(null, pathToFile, deferred));
  return deferred.promise;
}

function downloadFile(url, cdvDirectory, path) {
  // var url = "http://cdn.wall-pix.net/albums/art-space/00030109.jpg";
  // var targetPath = cordova.file.externalRootDirectory + "/Download/testImage.png";
  var targetPath = cdvDirectory + path;
  var trustHosts = true;
  var options = {};
  var ft = new FileTransfer();
  // ft.onprogress = function(progressEvent) {
  //   if (progressEvent.lengthComputable) {
  //       loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);
  //   } else {
  //       loadingStatus.increment();
  //   }
  // };
  ft.download(
    url,
    targetPath,
    function(entry){console.log("download complete: " + entry.toURL())},
    function(error) {
      console.log("download error source " + error.source);
      console.log("download error target " + error.target);
      console.log("download error code" + error.code);
    },
    {}
  );
}

function downloadFilePromise(url, pathToFile, onProgress) {
  var deferred = Q.defer();
  var trustHosts = true;
  var options = {};
  var ft = new FileTransfer();
  if(onProgress) {
    ft.onprogress = onProgress;
  }
  ft.download(
    url,
    pathToFile,
    function(entry){
      console.log("download complete: " + entry.toURL());
      deferred.resolve(entry);
    }, function(error) {
      console.log("download error source " + error.source);
      console.log("download error target " + error.target);
      console.log("download error code" + error.code);
      deferred.reject(error);
    },
    {}
  );
  return deferred.promise;
}

export default {
  downloadFilePromise,
  writeToFilePromise,
  readFromFilePromise,
}
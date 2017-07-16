<template>
<!-- App -->
<div id="app">
  <keep-alive>
    <router-view></router-view>
  </keep-alive>
</div>
</template>

<script>
import YdDisplay from './pages/YdDisplay.vue'
import db from './db.js'
import {EventBus} from './EventBus.js'
import Utils from './utils.js'
import FileHelper from './FileHelper.js'
import Q from 'q'

export default {
  components: {
    'yd-display': (resolve) => {
      console.log("resolving yd-display component");
      EventBus.$on("RESOURCE_LOADED", function(){
        resolve(YdDisplay);
      })
    },
  },
  methods: {
    startupChecks: function() {
      // Check if classwareCollection has been built
      // TODO: do init db here
      if (! db.hasClasswareBuilt()) {
      // if (true) {
        // FileHelper.removeFolderIfExistPromise(cordova.file.dataDirectory + 'card-assets/').then(function(file){
        //   console.log('folder deleted');
        // }).catch(console.log);
        var f7 = this.f7;
        f7.showPreloader("Downloading...");
        // Start fresh
        // TODO: use promise
        db.removeResourceCollection().then(function(){console.log('resource deleted')});
        db.removeClasswareCollection().then(function(){console.log('classware deleted')});
        var cardResourceFolder = `${cordova.file.dataDirectory}card-assets/`
        var downloadTempPath = `${cordova.file.cacheDirectory}/Download/yuudee-card-lite.zip`
        // var remoteResourceURL = "http://orrmhr3bd.bkt.clouddn.com/yuudee-card-lite.zip"
        var remoteResourceURL = "http://orrmhr3bd.bkt.clouddn.com/yuudee-card-uuid-v1-lite-cn.zip"
        FileHelper.removeFolderIfExistPromise(cardResourceFolder).then(function(){
          var onProgress = function(progressEvent) {
            if (progressEvent.lengthComputable) {
              console.log(`percentage: ${progressEvent.loaded / progressEvent.total * 100} %`);
            } else {
              console.log('onProgress');
            }
          }
          return FileHelper.downloadFilePromise(remoteResourceURL, downloadTempPath, onProgress);
        }).then(function(){
          // return unzipDownloaded(downloadTempPath, cardResourceFolder)
          var deferred = Q.defer();
          zip.unzip(downloadTempPath, cordova.file.dataDirectory, function(){
            deferred.resolve();
          }, function(progressEvent){
            console.log("unzipping..." + Math.round((progressEvent.loaded / progressEvent.total) * 100))
          });
          return deferred.promise;
        }).then(function(){
          return db.buildOfficialResourceCollection();
        }).then(function(){
          return db.generateOfficialClasswares();
        }).then(function(){
          // TODO: load external user cards
          // return db.removeResourceCollection('USER_RESOURCE_PATH');
          // Cleanup
          // TODO: Remove temp file
          EventBus.$emit("RESOURCE_LOADED");
          f7.hidePreloader();
        }).catch(function(error){
          // Close preloader
          f7.hidePreloader();
          console.log(error);
        })
      } else {
        // Load configuration
        // Load classware
        // Done
        EventBus.$emit("RESOURCE_LOADED");
      }
    },
  },
  created() {
    console.log("app created")
    // Startup checks here...
    EventBus.$on('ROOT_MOUNTED', () => {
      this.startupChecks();
    });
  },
  mounted() {
    this.f7 = new Framework7();
    console.log("app mounted")
  }
}
</script>

<style>
#app {
  background-image: url("../static/img/background.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  margin: 0px;
  height: 100%;
  position: relative;
}
.yd-button {
  border-radius: 5px;
  background: url("../static/img/button-raw.png");
  border-style: solid;
  border-color: rgb(105,61,34);
  border-width: 1px;
  background-size: cover;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
  padding-top: 0.5em;
  padding-bottom: 0.5em;
  color: rgb(230,220,210);
  font-weight: bold;
  text-align: center;
}
</style>
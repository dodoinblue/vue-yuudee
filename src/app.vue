<template>
<!-- App -->
<div id="app">
  <router-view></router-view>
</div>
</template>

<script>
import YdDisplay from './YdDisplay.vue'
import db from './db.js'
import {EventBus} from './EventBus.js'
import Utils from './utils.js'
import FileHelper from './FileHelper.js'
import CardProvider from './CardProvider.js'
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
        console.log('building');
        var f7 = this.f7;
        f7.showPreloader("Downloading...");
        // Start fresh
        // TODO: use promise
        db.removeResourceCollection();
        db.removeClasswareCollection();
        var cardResourceFolder = `${cordova.file.dataDirectory}card-assets/`
        var downloadTempPath = `${cordova.file.cacheDirectory}/Download/yuudee-card-lite.zip`
        var remoteResourceURL = "http://orrmhr3bd.bkt.clouddn.com/yuudee-card-lite.zip"
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
            // console.log("unzipping..." + Math.round((progressEvent.loaded / progressEvent.total) * 100))
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
      window.db = db;

      // console.log(db.getDisplayGridSize());
      // console.log(db.getClasswareCollection());
    });

    EventBus.$on('NO_OFFICIAL_CARDS', () => {
      this.downloadOfficalCards();
    });

    EventBus.$on('OFFICIAL_CARD_DOWNLOADED', () => {
      this.unzipCardzip();
    })
    
  },
  mounted() {
    this.f7 = new Framework7();
    console.log("app mounted")
    // TODO: move this to proper location
    setTimeout(function(){
      EventBus.$emit("RESOURCE_LOADED")
    }, 500);
  }
}
</script>

<style scoped>
#app {
  background-image: url("../static/img/background.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  margin: 0px;
  height: 100%;
}
</style>
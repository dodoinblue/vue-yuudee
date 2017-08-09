<template>
<!-- App -->
<div id="app">

  <transition name="slidein" mode="out-in">
    <keep-alive exclude="YdResource">
      <router-view></router-view>
    </keep-alive>
  </transition>

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
  methods: {
    startupChecks: function() {
      // No need to chain this part. Next step is either downloading or user navigate to resource
      // page to create new category/ card, which all will take much longer time than this.
      FileHelper.getDirPromise(FileHelper.getUserAssetFolder()).catch(function(error){
        console.log("User Asset folder is not available, creating..");
        return FileHelper.createDirPromise(FileHelper.getUserFolderParent(), 'UserAssets', false)
      }).then(function(){
        return FileHelper.getDirPromise(FileHelper.getUserAssetFolder() + '/Other').catch(function(error){
          return FileHelper.createDirPromise(FileHelper.getUserAssetFolder(), 'Other', false).then(function(){
            return FileHelper.writeJsonToFilePromise({name: 'Other'}, FileHelper.getUserAssetFolder() + '/Other', 'info.json');
          });
        })
      }).then(function(){
        return FileHelper.getDirPromise(FileHelper.getUserCoverFolder()).catch(function(error){
          console.log("User Cover folder is not available, creating..");
          return FileHelper.createDirPromise(FileHelper.getUserFolderParent(), 'UserCovers', false)
        })
      }).then(function(){
        console.log("User folders created");
      }).catch(console.log);

      // Check if classwareCollection has been built
      var cardResourceFolder = `${cordova.file.dataDirectory}card-assets/`
      var downloadTempPath = `${cordova.file.cacheDirectory}/Download/yuudee-card-lite.zip`
      var remoteResourceURL = "http://orrmhr3bd.bkt.clouddn.com/yuudee-card-uuid-v1-lite-cn.zip"
      if (! db.hasClasswareBuilt()) {
      // if (true) {
        var f7 = this.f7;
        f7.showPreloader(this.$t('message.downloading'));
        // Start fresh
        db.removeResourceCollection().then(function(){
          console.log('resource deleted');
          return db.removeClasswareCollection();
        }).then(function(){
          console.log('classware deleted');

          return FileHelper.removeFolderIfExistPromise(cardResourceFolder).then(function(){
            var onProgress = function(progressEvent) {
              if (progressEvent.lengthComputable) {
                // console.log(`percentage: ${progressEvent.loaded / progressEvent.total * 100} %`);
              } else {
                console.log('onProgress');
              }
            }
            return FileHelper.downloadFilePromise(remoteResourceURL, downloadTempPath, onProgress);
          })
        }).then(function(){
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
        }).then(() => {
          // Wait for db save.
          return Utils.waitForSeconds(1.5);
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
        // Done
        EventBus.$emit("RESOURCE_LOADED");
      }
    },
  },
  created() {
    // Startup checks here...
    EventBus.$on('ROOT_MOUNTED', () => {
      this.startupChecks();
    });
  },
  mounted() {
    this.f7 = Utils.getF7();
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

/* Animations */
.slidein-enter-active {
  transition: all .2s ease;
  overflow: hidden;
}
.slidein-leave-active {
  /*transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);*/
  transition: all .2s ease;
  overflow: hidden;
}
.slidein-enter, .slidein-leave-to
/* .slide-fade-leave-active for <2.1.8 */ {
  transform: translateX(-100%);
}
html {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
}
</style>
<template>
<!-- App -->
<div id="app">
  <yd-display>
  </yd-display>
</div>
</template>

<script>
import YdDisplay from './YdDisplay.vue'
import db from './db.js'
import {EventBus} from './EventBus.js'
import Utils from './utils.js'
import FileHelper from './FileHelper.js'
import CardProvider from './CardProvider.js'

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
      var that = this;
      // Check if official cards exists
      if (Utils.isBrowser()) {
        console.log('using preloaded cards.json');
        // var cards = require('../static/card-assets/cards-lite.json');
        // CardProvider.setAllCards(cards);
        return;
      }
      var pathToCardListJson = `${cordova.file.dataDirectory}card-assets/cards.json`
      FileHelper.readFromFilePromise(pathToCardListJson).then(function(content){
        // CardProvider.setAllCards(JSON.parse(content));
      }).catch(function(e){
        if (e.code == FileError.NOT_FOUND_ERR) {
          EventBus.$emit("NO_OFFICIAL_CARDS");
        } else {
          console.log("something is seriously wrong.")
          console.log(e);
        }
      });
    },
    downloadOfficalCards: function() {
      var sourceZip = "http://orrmhr3bd.bkt.clouddn.com/yuudee-card-lite.zip";
      var targetPath = `${cordova.file.cacheDirectory}/Download/yuudee-card-lite.zip`;
      var onProgress = function(progressEvent) {
        if (progressEvent.lengthComputable) {
          console.log(`percentage: ${progressEvent.loaded / progressEvent.total * 100} %`);
        } else {
          console.log('onProgress');
        }
      }
      var f7 = this.$root.$f7;
      f7.showPreloader("Downloading...");
      FileHelper.downloadFilePromise(sourceZip, targetPath, onProgress).then(function(entry){
        console.log("caller: downloaded: " + entry.toURL())
        f7.hidePreloader();
        EventBus.$emit('OFFICIAL_CARD_DOWNLOADED')
      }).catch(function(error){
        console.log("On Error: " + error);
        f7.hidePreloader();
      });
    }, 
    unzipCardzip: function() {
      var f7 = this.$root.$f7;
      f7.showPreloader("Unzipping...");
      zip.unzip(`${cordova.file.cacheDirectory}Download/yuudee-card-lite.zip`,
                  cordova.file.dataDirectory, function(){
                    console.log("unzip done");
                    f7.hidePreloader();
                    EventBus.$emit("RESOURCE_LOADED")
                  }, function(progressEvent){
                    console.log("unzipping..." + Math.round((progressEvent.loaded / progressEvent.total) * 100))
                  })
    }
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
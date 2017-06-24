<template>
<!-- App -->
<div id="app">

  <!-- Statusbar -->
  <!--<f7-statusbar></f7-statusbar>-->

  <div class="row">
    <!-- Yuudee's logo' -->
    <div class="col-33">
    </div>
    <div class="col-33">
      <img class="app-logo" src="../static/img/yuudee_logo.svg" @click="toogleEditMode">
    </div>
    <div class="col-33">
    </div>
  </div>

  <!--v-for-->
  <yd-drawer :path="rootPath" :edit-mode="editMode" :root="true"></yd-drawer>
  <yd-drawer v-for="(drawer, index) in drawers"
             :path="drawer"
             :edit-mode="editMode"
             :root="false"
             :key="index"></yd-drawer>

  <!-- settings layer -->
  <div id="app-settings-header" v-if="editMode">
    <div class="row align-center">
      <div class="col col-25">
        <div class="yd-button" @click="toogleEditMode">结束编辑</div>
      </div>
      <div class="col col-50">
        <div class="yd-button">
          <dropdown></dropdown>
        </div>
      </div>
      <div class="col col-25">
        <div class="yd-button" ng-click="goToResource()">素材库</div>
      </div>
    </div>
  </div>

  <!--footer-->
  <div id="app-settings-footer" class="row row-bottom align-center" v-if="editMode">
    <div class="col col-25">
      <div class="yd-button">新建</div>
    </div>
    <div class="col col-25 col-offset-50">
      <div class="yd-button">设置</div>
    </div>
  </div>
</div>
</template>

<script>
import YdCard from './YdCard.vue'
import YdDrawer from './YdDrawer.vue'
import { EventBus } from './EventBus.js'
import Dropdown from './dropdown.vue'
import FileHelper from './FileHelper.js'
import CardProvider from './CardProvider'
// import Q from 'q'

export default {
  data() {
    return {
      rootPath: '.',
      drawers: [],
      editMode: false,
    }
  },
  components: { YdDrawer, Dropdown },
  computed: {
    path: function() {
      var result = this.rootPath;
      if (this.drawers.length != 0) {
        result = this.drawers[this.drawers.length - 1];
      }
      console.log("returning path: " + result);
      return result;
    }
  },
  methods: {
    toogleEditMode: function() {
      this.editMode = ! this.editMode;
    },
    loadConfiguration: function() {

    },
    startupChecks: function() {
      var that = this;
      // Check if official cards exists
      if (typeof cordova == 'undefined') {
        console.log('using preloaded cards.json');
        // var cards = require('../static/card-assets/cards-lite.json');
        // CardProvider.setAllCards(cards);
        return;
      }
      var pathToCardListJson = `${cordova.file.dataDirectory}/card-assets/cards.json`
      FileHelper.readFromFilePromise(pathToCardListJson).then(function(content){
        CardProvider.setAllCards(content);
      }).catch(function(e){
        if (e.code == FileError.NOT_FOUND_ERR) {
          EventBus.$emit("NO_OFFICIAL_CARDS");
        } else {
          console.log("something is seriously wrong.")
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
          console.log('onProgress')
        }
      }
      var f7 = this.$root.$f7;
      f7.showPreloader("Downloading...");
      FileHelper.downloadFilePromise(sourceZip, targetPath, onProgress).then(function(entry){
        console.log("caller: downloaded: " + entry.toURL())
        EventBus.$emit('OFFICIAL_CARD_DOWNLOADED')
        f7.hidePreloader();
      }).catch(function(error){
        console.log("On Error: " + error);
        f7.hidePreloader();
      });
      console.log(zip);


    },
    unzipCardzip: function() {
      var f7 = this.$root.$f7;
      f7.showPreloader("Unzipping...");
      zip.unzip(`${cordova.file.cacheDirectory}/Download/yuudee-card-lite.zip`,
                  cordova.file.dataDirectory, function(){
                    console.log("unzip done");
                    f7.hidePreloader();
                  }, function(progressEvent){
                    console.log("unzipping..." + Math.round((progressEvent.loaded / progressEvent.total) * 100))
                  })
    }
  },
  created() {
    EventBus.$on('DrawerBackClicked', path => {
      this.drawers.pop();
    });
    EventBus.$on('StackClicked', path => {
      this.drawers.push(path);
    });
    // Should get root path from settings
    this.rootPath="."

    EventBus.$on('ROOT_MOUNTED', () => {
      // this.startupChecks();
    });

    EventBus.$on('NO_OFFICIAL_CARDS', () => {
      this.downloadOfficalCards();
    });

    EventBus.$on('OFFICIAL_CARD_DOWNLOADED', () => {
      this.unzipCardzip();
    })
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
.app-logo {
  height: 18%;
  padding: 5% 0 0 0;
  text-align: center;
  width: 80%;
}
.grid-display {
  height: 100%;
  margin-top: 5%;
  border: 1px solid #ddd;
}
.card-img {
  width: 95%;
}

/* Settings Layer */
#app-settings-header {
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  margin-left: 2.5%;
  margin-right: 2.5%;
  margin-top: 1.5%;
}

#app-settings-footer {
  position: absolute;
  bottom: 0px;
  left: 0px;
  right: 0px;
  margin-left: 2.5%;
  margin-right: 2.5%;
  margin-bottom: 1.5%;
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

select {
  /*width: 50%;*/
  height: 100%;
  color: rgb(230,220,210);
  font-weight: bold;
  font-size: 0.95em;
  padding: 0px;
  margin: 0px;
  text-align: center;
}
option {
  width: 100%;
}
</style>
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
    prepareResource: function() {
      let cardResourceFolder = `${cordova.file.dataDirectory}card-assets/`
      let lang = this.$root.$i18n.locale || 'zh'
      let preloadZipPath = cordova.file.applicationDirectory + 'www/static/' + lang + '/yuudee-card-v1.zip'
      let f7 = Utils.getF7();
      f7.showPreloader(this.$t('message.downloading'));
      return db.removeResourceCollection().then(() => {
        console.log('resource db cleared')
        return db.removeClasswareCollection()
      }).then(() => {
        console.log('classware db cleared')
        return FileHelper.removeFolderIfExistPromise(cardResourceFolder)
      }).then(() => {
        db.setRootClasswareUuid('all')
        // https://github.com/MobileChromeApps/cordova-plugin-zip/issues/56
        return FileHelper.copyFilePromise(preloadZipPath, cordova.file.cacheDirectory, 'yuudee-card.zip').catch(() => {
          return Q().then(() => {
            console.log("failed to copy")
            f7.hidePreloader()
            let comfirmDeferred = Q.defer()
            f7.alert(this.$t('message.download_confirm_body'), this.$t('message.download_confirm_title'), () => {
              comfirmDeferred.resolve()
            })
            return comfirmDeferred.promise
          }).then(() => {
            f7.showPreloader(this.$t('message.downloading'));
            return FileHelper.downloadFilePromise(`http://orrmhr3bd.bkt.clouddn.com/yuudee-card-v1-${lang}.zip`, cordova.file.cacheDirectory + 'yuudee-card.zip')
          }).catch(() => {
            f7.alert(this.$t('message.download_fail_body'), this.$t('message.download_fail_title'), () => {
              navigator.app.exitApp()
            })
          })
        })
      }).then(() => {
        console.log('Previous resource folder removed')
        var deferred = Q.defer()
        zip.unzip(cordova.file.cacheDirectory + 'yuudee-card.zip', cordova.file.dataDirectory, () => {
          deferred.resolve()
        }, function(progressEvent){
          // console.log("unzipping..." + Math.round((progressEvent.loaded / progressEvent.total) * 100))
        });
        console.log('returning from zip block')
        return deferred.promise
      }).then(() => {
        return db.buildOfficialResourceCollection()
      }).then(() => {
        return db.generateOfficialClasswares()
      }).then(() => {
        // Wait for db save.
        return Utils.waitForSeconds(1.5)
      }).then(() => {
        // TODO: load external user cards
        // return db.removeResourceCollection('USER_RESOURCE_PATH');
        // Cleanup
        FileHelper.removeFile(cordova.file.cacheDirectory + 'yuudee-card.zip')

        // TODO: Remove temp file
        f7.hidePreloader();
      }).catch(function(error){
        // Close preloader
        f7.hidePreloader()
        console.log(error)
      })
    },
    createUserFolders: function() {
      return FileHelper.getDirPromise(FileHelper.getUserAssetFolder()).catch((error) => {
        console.log("User Asset folder is not available, creating..");
        return FileHelper.createDirPromise(FileHelper.getUserFolderParent(), 'UserAssets', false)
      }).then(() => {
        return FileHelper.getDirPromise(FileHelper.getUserAssetFolder() + '/Other').catch((error) => {
          return FileHelper.createDirPromise(FileHelper.getUserAssetFolder(), 'Other', false)
        }).then(() => {
          let infoName = this.$t('message.other')
          console.log('other category name: ' + infoName)
          return FileHelper.writeJsonToFilePromise({name: infoName}, FileHelper.getUserAssetFolder() + '/Other', 'info.json');
        })
      }).then(() => {
        return FileHelper.getDirPromise(FileHelper.getUserCoverFolder()).catch(function(error){
          console.log("User Cover folder is not available, creating..");
          return FileHelper.createDirPromise(FileHelper.getUserFolderParent(), 'UserCovers', false)
        })
      }).then(() => {
        console.log("User folders checked");
      }).catch(console.log);
    },
    chooseLanguage: function() {
      let deferred = Q.defer()
      Utils.getF7().modal({
        title:  '选择语言<br>Choose language',
        text: '',
        verticalButtons: true,
        buttons: [
          {
            text: '中文',
            onClick: function() {
              deferred.resolve('zh')
            }
          },
          {
            text: 'English',
            onClick: function() {
              deferred.resolve('en')
            }
          },
        ]
      })
      return deferred.promise
    },
    startupChecks: function() {
      console.log("startup check")
      // For GA
      let t0
      let firstStartup = false

      // window.fhelper = FileHelper
      // window.db = db
      let startPromise = Q()
      let langString = db.getLanguage()
      // let langString
      if (!langString) {
        startPromise = startPromise.then(() => {
          return this.chooseLanguage()
        }).then((langString) => {
          db.setLanguage(langString)
          this.$root.$i18n.locale = langString
          window.ga.trackEvent('USER_EVENT', 'LANGUAGE', 'CHOOSE', langString, false)
        })
      } else {
        this.$root.$i18n.locale = langString
      }


      startPromise = startPromise.then(() => {
        t0 = Date.now()
        // Check and create
        return this.createUserFolders()
      })

      // Check if classwareCollection has been built
      if (! db.hasClasswareBuilt()) {
        firstStartup = true
      // if (true) {
        startPromise = startPromise.then(() => {
          console.log('prepareRes')
          return this.prepareResource()
        })
      }
      startPromise = startPromise.then(() => {
        // Check and create other category in resource collection
        let otherCategory = db.getCardByUuid('Other')
        if (!otherCategory) {
          console.log('creating otherCategory in db')
          db.insertResourceCategory(FileHelper.getUserAssetFolder() + '/Other', true)
        }
        console.log("emit: RESOURCE_LOADED")
        if (firstStartup) {
          window.ga.trackEvent('LIFE_CYCLE', 'APP_LAUNCH', 'FIRST_TIME_SPEND', Date.now() - t0, false)
        } else {
          window.ga.trackEvent('LIFE_CYCLE', 'APP_LAUNCH', 'REGULAR_TIME_SPEND', Date.now() - t0, false)
        }
        EventBus.$emit("RESOURCE_LOADED")
      }).then(() => {
        return FileHelper.listDirectoryPromise(cordova.file.cacheDirectory).then((entries) => {
          entries.forEach((entry) => {
            if (entry.isFile) {
              FileHelper.removeFile(cordova.file.cacheDirectory + entry.fullPath)
            } else if (entry.isDirectory) {
              FileHelper.removeFolderIfExistPromise(cordova.file.cacheDirectory + entry.fullPath)
            } else {
              console.log("error deleting cache files" + entry.fullPath)
            }
          })
        })
      }).then(() => {
        console.log("cache contents removed")
      })
    },
  },
  created() {
    window.ga.trackEvent('LIFE_CYCLE', 'APP_LAUNCH', 'DEVICE_READY', Date.now(), true)
    // Startup checks here...
    EventBus.$on('ROOT_MOUNTED', () => {
      this.startupChecks();
    });
  },
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
  box-shadow: 2px 2px 2px #8c642d;
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
<template>
<div class="settings-container">
  <div class="container-background"></div>
  <div class="settings-dialog">
    <div class="settings-frame">
      <img src="static/img/edit-dialog-big-background.png">
    </div>
    <div class="settings-dialog-title">{{ isEditing ? $t('message.edit_card') : $t('message.new_card') }}</div>
    <div class="settings-dialog-content row">
      <div class="col col-50 yd-card">
        <div class="card-frame">
          <img src="static/img/card_bg.png">
        </div>
        <div class="card-content">
          <img :src="cardImage">
        </div>
        <div class="card-text"><div>{{cardName}}</div></div>
        <div class="card-edit-button" v-if="isEditing" @click="deleteCard"></div>
      </div>
      <div class="col col-50">
        <div class="row">
          <div class="col-100 light-button">
            <img src="static/img/choose.png">
            <span class="dropdown-text" @click="showCategoryList" ref="catDropdown">{{category.name}}</span>
          </div>
        </div>
        <div class="row">
          <div class="col col-50"><div class="yd-button-light" @click="takePicture"><i class="fa fa-camera-retro">&nbsp;</i>{{ $t('message.camera') }}</div></div>
          <div class="col col-50"><div class="yd-button-light" @click="choosePicture"><i class="fa fa-file-image-o">&nbsp;</i>{{ $t('message.album') }}</div></div>
        </div>
        <div class="row">
          <div class="col-100 light-button">
            <img src="static/img/single-line-text-field.png">
            <span><input type="text" v-model="cardName"></input></span>
          </div>
        </div>
      </div>
    </div>
    <div class="settings-dialog-audio row">
      <div class="col col-33"><div class="yd-button-light" @click="recordAudio"><i class="fa fa-circle dark-red">&nbsp;</i>{{ $t('message.record') }}</div></div>
      <div class="col col-33"><div class="yd-button-light" @click="playAudio"><i class="fa fa-play sky-blue">&nbsp;</i>{{ $t('message.play') }}</div></div>
      <div class="col col-33"><div class="yd-button-light" @click="removeAudio"><i class="fa fa-trash-o">&nbsp;</i>{{ $t('message.delete') }}</div></div>
    </div>
    <div class="settings-dialog-confirm row">
      <div class="col col-50"><a href='#' class="button button-fill color-gray button-raised" @click="cancel">{{ $t('message.cancel') }}</a></div>
      <div class="col col-50"><a href='#' class="button button-fill color-blue button-raised" @click="confirm">{{ $t('message.confirm') }}</a></div>
    </div>
  </div>

  <!--All category popover-->
  <div class="popover popover-resource-categories">
    <div class="popover-angle"></div>
    <div class="popover-inner">
      <div class="list-block inset">
        <ul>
          <li v-for="cat in categoryList" :key="cat.uuid" @click="chooseCategory(cat)"> <a href="#" class="list-button item-link">{{ cat.name }}</a></li>
        </ul>
      </div>
    </div>
  </div>
</div>

</template>

<script>
import {EventBus, Events} from '../EventBus'
import Utils from '../utils'
import FileHelper from '../FileHelper'
import uuidv4 from 'uuid/v4'
import db from '../db'

export default {
  props: ['mode', 'cardInEdit'],
  data() {
    return {
      cardImage: "static/img/dummy_content.jpg",
      cardAudio: "",
      uuid: "",
      cardName: "",
      category: {},
      categoryList: [],
    }
  },
  computed: {
    isEditing: function() {
      return ! _.isEmpty(this.cardInEdit)
    }
  },
  methods: {
    chooseCategory: function (cat) {
      this.category = cat;
      this.f7.closeModal(this.popover, false);
    },
    showCategoryList: function(){
      this.f7 = Utils.getF7();
      this.popover = this.f7.popover('.popover-resource-categories', this.$refs.catDropdown);
    },
    cancel: function() {
      EventBus.$emit(Events.RESOURCE_NEW_CARD_CLOSE);
    },
    updateCard: function() {
      var editObj = _.clone(this.cardInEdit)
      var p = Utils.emptyPromise()
      var originalImage = _.isEmpty(this.cardInEdit.images[0]) ? "" : this.cardInEdit.images[0]
      if (this.cardImage !== originalImage) {
        // Update image
        let ext = FileHelper.getExtensionFromPath(this.cardImage);
        var newImage = Date.now() + '.' + ext
        p = p.then(() => {
          return FileHelper.removeFile(originalImage).then(function(){
          }).catch(function(error){
            console.log("error removing old image" + error.code)
          })
        }).then(() => {
          console.log('adding new')
          return FileHelper.copyFilePromise(this.cardImage, this.cardInEdit.cdvpath, newImage);
        }).then((fileEntry) => {
          editObj.images = [this.cardInEdit.cdvpath + newImage]
        })
      }
      var originalAudio = _.isEmpty(this.cardInEdit.audios[0]) ? "" : this.cardInEdit.audios[0]
      if (this.cardAudio !== originalAudio) {
        // Update audio
        let ext = FileHelper.getExtensionFromPath(this.cardAudio);
        p = p.then(() => {
          return FileHelper.removeFile(originalAudio).then(function(){
          }).catch(function(error){
            console.log("error removing old audio" + error.code)
          })
        }).then(() => {
          return FileHelper.copyFilePromise(this.cardAudio, this.cardInEdit.cdvpath + 'audios', '01.' + ext);
        }).then(() => {
          editObj.audios = [this.cardInEdit.cdvpath + 'audios/01.' + ext]
        })
      }
      if (this.cardName !== this.cardInEdit.name) {
        // Update card
        p = p.then(() => {
          editObj.name = this.cardName
        })
      }
      if (this.category.uuid !== this.cardInEdit.category) {
        // Move card - keep uuid
        // FileHelper.moveDirPromise
        console.log('update category')
        p = p.then(() => {
          // Move in fs
          return FileHelper.moveDirPromise(
            FileHelper.getUserAssetFolder() + this.cardInEdit.category,
            this.cardInEdit.uuid + '.xydcard',
            FileHelper.getUserAssetFolder() + this.category.uuid,
            this.cardInEdit.uuid + '.xydcard'
          )
        }).then((dirEntry) => {
          // Update db
          db.getResourceCollection().remove(this.cardInEdit)
          // TODO: new order...
          db.insertResourceCard(dirEntry.nativeURL, this.category)
        }).then(() => {
          // Remove from old category
          EventBus.$emit(Events.RESOURCE_ITEM_DELETED, this.cardInEdit.category)
          EventBus.$emit(Events.RESOURCE_NEW_CARD_ADDED, this.category)
        })
      } else {
        p.then(() => {
          var updated = db.getResourceCollection().update(editObj)
        }).then(() => {
          EventBus.$emit(Events.RESOURCE_CARD_UPDATED, editObj);
        })
      }
      p = p.then(() => {
        console.log('close dialog')
        EventBus.$emit(Events.RESOURCE_NEW_CARD_CLOSE);
      }).catch(console.log)
    },
    deleteCard: function() {
      FileHelper.removeFolderIfExistPromise(this.cardInEdit.cdvpath).then(() => {
        return db.deleteResourceCard(this.cardInEdit)
      }).then(() => {
        EventBus.$emit(Events.RESOURCE_ITEM_DELETED, this.cardInEdit.category)
        EventBus.$emit(Events.RESOURCE_NEW_CARD_CLOSE);
      }).catch(console.log)
    },
    confirm: function() {
      if (this.cardName == "" || ! this.category.uuid || this.cardImage == "static/img/dummy_content.jpg") {
        var f7 = Utils.getF7();
        f7.alert(this.$t('message.missing_info_body'), this.$t('message.missing_info_title'));
        return
      }

      if (this.isEditing) {
        this.updateCard()
        return
      }

      // Final location
      var userResourceRoot = FileHelper.getUserAssetFolder();

      // create card folder in cache folder first
      FileHelper.createDirPromise(cordova.file.cacheDirectory, this.uuid, false).then(() => {
        // Copy audio if exist
        console.log('saving audio');
        return FileHelper.getFilePromise(this.cardAudio).then(() => {
          var ext = FileHelper.getExtensionFromPath(this.cardAudio);
          return FileHelper.createDirPromise(cordova.file.cacheDirectory + this.uuid, 'audios', false).then(() => {
            return FileHelper.copyFilePromise(this.cardAudio, cordova.file.cacheDirectory + this.uuid + '/audios', '01.' + ext);
          })
        }).catch((error) => {
          console.log("error saving audio: " + error.code);
          return FileHelper.createDirPromise(cordova.file.cacheDirectory + this.uuid, 'audios', false)
        })
      }).then(() => {
        // Do the same for image
        console.log('saving images: ' + this.cardImage)
        return FileHelper.getFilePromise(this.cardImage).then(() => {
          var ext = FileHelper.getExtensionFromPath(this.cardImage);
          return FileHelper.createDirPromise(cordova.file.cacheDirectory + this.uuid, 'images', false).then(() => {
            return FileHelper.copyFilePromise(this.cardImage, cordova.file.cacheDirectory + this.uuid + '/images', '01.' + ext);
          })
        }).catch((error) => {
          console.log("error saving image: " + error.code);
          return FileHelper.createDirPromise(cordova.file.cacheDirectory + this.uuid, 'images', false)
        })
      }).then(() => {
        return db.getCardsOfRecourceCategory(this.category.uuid).length + 1
      }).then((order) => {
        // Save info
        var info = {};
        info.name = this.cardName;
        info.originalOrder = order
        console.log('writing card info.json with order: ' + order)
        return FileHelper.writeJsonToFilePromise(info, cordova.file.cacheDirectory + this.uuid, 'info.json')
      }).then(() => {
        console.log('moving...');
        // Move folder to final location
        // Assume root folder exist since it asks for a category.
        // TODO: check userasset folder at startup
        // TODO: create a "other" category at startup.
        return FileHelper.moveDirPromise(cordova.file.cacheDirectory, this.uuid, userResourceRoot + this.category.uuid, this.uuid + '.xydcard');
      }).then((dirEntry) => {
        // Sync db
        return db.insertResourceCard(dirEntry.nativeURL, this.category);
      }).then(function(doc){
        console.log('card saving done');
        EventBus.$emit(Events.RESOURCE_NEW_CARD_CLOSE);
        EventBus.$emit(Events.RESOURCE_NEW_CARD_ADDED, doc);
      }).catch(console.log);
    },
    takePicture: function(){
      console.log('take picture');
      Utils.takePicturePromise({}).then(function(filePath){
        console.log(filePath);
        return plugins.crop.promise(filePath, {quality: 50});
      }).then((croppedPath) => {
        console.log('cropped: ' + croppedPath);
        // this.cardImage = croppedPath;
        return FileHelper.getCdvPath(croppedPath);
      }).then((internalPath) => {
        this.cardImage = internalPath;
        // TODO Cleanup cache folder. or do this when save/cancel
      }).catch(console.log);
    },
    choosePicture: function() {
      console.log('choose picture');
      Utils.choosePicturePromise().then(function(filePath){
        console.log(filePath);
        return plugins.crop.promise(filePath, {quality: 50});
      }).then((croppedPath) => {
        console.log('cropped: ' + croppedPath);
        // this.cardImage = croppedPath;
        return FileHelper.getCdvPath(croppedPath);
      }).then((internalPath) => {
        this.cardImage = internalPath;
        // TODO Cleanup cache folder. or do this when save/cancel
      }).catch(console.log);
    },
    recordAudio: function() {
      Utils.recordAudioPromise().then(function(audio){
        // Move to cache folder
        if(cordova.platformId == 'ios') {
          console.log(audio)
          return FileHelper.getFilePromise(audio.localURL)
        } else {
          var extension = FileHelper.getExtensionFromPath(audio.fullPath);
          var oldFolder = FileHelper.getFolderFromPath(audio.fullPath);
          var filename = uuidv4();
          return FileHelper.moveFilePromise(oldFolder, audio.name,
              cordova.file.cacheDirectory, filename + '.' + extension);
        }

      }).then((audioEntry) => {
        this.cardAudio = audioEntry.toInternalURL();
      }).catch(console.log);
    },
    playAudio: function() {
      FileHelper.getCdvPath(this.cardAudio).then(function(cdvPath){
        Utils.mediaPluginPlayAudio(cdvPath)
      }).catch(console.log); // Notify when no audio.
    },
    removeAudio: function() {
      this.cardAudio = "";
    }
  },
  created() {
    this.categoryList = db.getNonOfficialResourceCategories();
    if (this.isEditing) {
      this.cardImage = _.isEmpty(this.cardInEdit.images) ? "static/img/dummy_content.jpg" : this.cardInEdit.images[0]
      this.cardAudio = _.isEmpty(this.cardInEdit.audios) ? "" : this.cardInEdit.audios[0]
      this.uuid = this.cardInEdit.uuid
      this.cardName = this.cardInEdit.name
      this.category = _.find(this.categoryList, (o) => {
        return o.uuid === this.cardInEdit.category
      })
    } else {
      this.uuid = uuidv4();
      let other = db.getCardByUuid('Other')
      if (other) {
        this.category = other
      }
    }
  }
}
</script>

<style scoped>
.settings-container {
  position:fixed;
  width: 100%;
  height: 100%;
  padding: 0px;
  margin: 0px;
  top:0;
  left:0;
  z-index: 100;
}

.container-background {
  position:fixed;
  background: black;
  opacity: 0.5;
  top:0;
  left:0;
  width: 100%;
  height: 100%;
  z-index: 200;
}

.settings-dialog {
  position: absolute;
  margin-top: 30%;
  left: 0%;
  width: 100%;
  z-index: 300;
}

.settings-dialog img {
  width: 100%;
}

.settings-dialog .settings-dialog-title {
  position: absolute;
  top: 7%;
  width: 70%;
  margin-left: 15%;
  margin-right: 15%;
  text-align: center;
  font-size: 18px;
  color: lightgrey;
}

.settings-dialog .settings-dialog-content {
  position: absolute;
  top: 19%;
  width: 86%;
  margin-left: 6%;
}

.settings-dialog .settings-dialog-audio {
  position: absolute;
  top: 58%;
  width: 80%;
  margin-left: 10%;
  margin-right: 10%;
}

.settings-dialog .settings-dialog-confirm {
  position: absolute;
  top: 75%;
  width: 80%;
  margin-left: 10%;
  margin-right: 10%;
}

img.layout {
  border-width: 3px;
  border-color: transparent;
  border-radius: 7px;
  border-style: solid;
  border-spacing: 3px;
}

img.selected {
  border-color: lightskyblue;
}

.yd-card {
  position: relative;
  max-width: 100%;
  text-align: center;
}

.yd-card img {
  max-width: 100%;
}

/*.yd-card .card-frame {
  z-index: 999;
}*/

.yd-card .card-content img {
  height: 100%;
  width: 100%;
  -moz-border-radius: 5px;
  border-radius: 5px;
}

/*
  full width = 632
  full heigh = 612

  content margins:
  margin top = 46
  margin left = 77
  margin right = 81
  margin bottom = 209
*/
.yd-card .card-content {
  position: absolute;
  left: 12%;
  top: 7.3%;
  right: 12%;
  bottom: 33.9%
}

.yd-card .card-text {
  max-width: 100%;
  text-align: center;
  position: absolute;
  top: 66%;
  left: 12.18%;
  right: 12.82%;
  height: 20%;
  font-size: 12px;
  color: rgb(80,45,17);
}

.card-text div {
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}

.yd-card .card-edit-button {
  max-width: 30%;
  content: url("../../static/img/trash.png");
  position: absolute;
  top: -5%;
  right: 0%;
  bottom: 80%;
}

.light-button {
  position: relative;
}

.light-button .dropdown-text {
  font-size: 14px;
}

.light-button span {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0px;
  left: 0px;
  /*text-align: center;*/
  color: #8c642d;
  padding-top: 9px;
  padding-left: 14px;
  font-size: 16px;
}

.light-button span input{
  position: absolute;
  height: 30%;
  width: 70%;
  top: 7%;
  left: 0%;
  /*text-align: center;*/
  color: #8c642d;
  padding-top: 9px;
  padding-left: 14px;
  font-size: 16px;
  border: none;
  background-color: transparent;
}

.yd-button-light {
  border-radius: 5px;
  background: url("../../static/img/blank-button-light.png") center no-repeat;
  width: 100%;
  height: 100%;
  padding-top: 0.5em;
  padding-bottom: 0.5em;
  color: #8c642d;
  font-weight: bold;
  text-align: center;
  margin-top: 5px;
  margin-bottom: 5px;
  box-shadow: 2px 2px 2px #8c642d;
  font-size: 12px
}

.dark-red {
  color: darkred;
}

.sky-blue {
  color: skyblue;
}
.popover-resource-categories {
  height: 30%;
  width: 50%;
}

.popover-inner {
  height: 100%;
  overflow-y: scroll;
}
</style>

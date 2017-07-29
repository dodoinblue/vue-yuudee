<template>
<div class="settings-container">
  <div class="container-background"></div>
  <div class="settings-dialog">
    <div class="settings-frame">
      <img src="static/img/edit-dialog-small-background.png">
    </div>
    <div class="settings-dialog-title">New Category</div>
    <div class="settings-dialog-content row">
      <div class="col col-50 yd-card">
        <div class="card-frame">
          <img src="static/img/cat_bg.png">
        </div>
        <div class="card-content">
          <img :src="cardImage">
        </div>
      </div>
      <div class="col col-50">
        <div class="row choose-cover">
          <div class="col col-100"><div class="yd-button-light" @click="choosePicture"><i class="fa fa-file-image-o">&nbsp;</i>Choose cover</div></div>
        </div>
        <div class="row category-name">
          <div class="col-100 light-button">
            <img src="static/img/single-line-text-field.png">
            <span><input type="text" placeholder="category name" v-model="cardName"></input></span>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-dialog-confirm row">
      <div class="col col-50"><a href='#' class="button button-fill color-gray button-raised" @click="cancel">Cancel</a></div>
      <div class="col col-50"><a href='#' class="button button-fill color-blue button-raised" @click="confirm">Confirm</a></div>
    </div>
  </div>
  <!--All category popover-->
</div>

</template>

<script>
import {EventBus, Events} from '../EventBus'
import Utils from '../utils'
import FileHelper from '../FileHelper'
import uuidv4 from 'uuid/v4'
import db from '../db'

export default {
  props: ['mode'],
  data() {
    return {
      cardImage: "static/img/dummy_content.jpg",
      cardName: "",
    }
  },
  methods: {
    cancel: function() {
      EventBus.$emit(Events.RESOURCE_NEW_CARD_CLOSE);
      // remove content in cache folder
    },
    confirm: function() {
      if (this.cardName == "") {
        var f7 = Utils.getF7();
        f7.alert('Please choose a name before save', 'Missing info');
        return
      }
      var cat_path = uuidv4();
      // create folder
      var userResourceRoot;
      var userResourceParentFolder;
      if (cordova.platformId == 'ios') {
        userResourceParentFolder = cordova.file.dataDirectory;
      } else {
        userResourceParentFolder = cordova.file.externalApplicationStorageDirectory;
      }
      userResourceRoot = userResourceParentFolder + 'UserAssets/';

      FileHelper.createDirPromise(cordova.file.cacheDirectory, cat_path, false).then(() => {
        if (this.cardImage == 'static/img/dummy_content.jpg') {
          console.log('no cover image selected');
          return
        }
        return FileHelper.copyFilePromise(this.cardImage, cordova.file.cacheDirectory + cat_path, 'cover.jpg')
      }).then(function(){
        // Get next order number
        return db.getAllResourceCategories().length + 1
      }).then((order) => {
        console.log("write info.json with order: " + order);
        return FileHelper.writeJsonToFilePromise({
          name: this.cardName,
          originalOrder: order,
        }, cordova.file.cacheDirectory + cat_path, 'info.json');
      }).then(() => {
        FileHelper.readFromFilePromise(cordova.file.cacheDirectory + cat_path + '/info.json').then(console.log);
        return FileHelper.getDirPromise(userResourceRoot).catch(function(error){
          console.log(userResourceRoot + ' does not exist ' + error);
          return FileHelper.createDirPromise(userResourceParentFolder, 'UserAssets/', false);
        })
      }).then(function(){
        return FileHelper.moveDirPromise(cordova.file.cacheDirectory, cat_path, userResourceRoot, cat_path);
      }).then(() => {
        return db.insertResourceCategory(userResourceRoot + cat_path, false);
      }).then((doc) => {
        console.log("done. emit event");
        EventBus.$emit(Events.RESOURCE_NEW_CARD_CLOSE);
        EventBus.$emit(Events.RESOURCE_NEW_CATEGORY_ADDED, doc);
      }).catch(console.log)
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
  },
  mounted() {
    console.log('mounted');
  },
  created() {
    console.log('Created');
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
  top: 20%;
  left: 0%;
  width: 100%;
  z-index: 300;
}

.settings-dialog img {
  width: 100%;
}

.settings-dialog .settings-dialog-title {
  position: absolute;
  top: 9%;
  width: 70%;
  margin-left: 15%;
  margin-right: 15%;
  text-align: center;
  font-size: 18px;
  color: lightgrey;
}

.settings-dialog .settings-dialog-content {
  position: absolute;
  top: 23%;
  width: 86%;
  margin-left: 6%;
}

.settings-dialog-content .choose-cover {
  margin-top: 10%;
}

.settings-dialog-content .category-name {
  margin-top: 5%;
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

.light-button {
  position: relative;
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
  font-size: 14px;
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

</style>
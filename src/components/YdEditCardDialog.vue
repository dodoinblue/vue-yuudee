<template>
<div class="settings-container">
  <div class="container-background"></div>
  <div class="settings-dialog">
    <div class="settings-frame">
      <img src="static/img/edit-dialog-big-background.png">
    </div>
    <div class="settings-dialog-title">Edit Card</div>
    <div class="settings-dialog-content row">
      <div class="col col-50 yd-card">
        <div class="card-frame">
          <img src="static/img/card_bg.png">
        </div>
        <div class="card-content">
          <img :src="cardImage">
        </div>
      </div>
      <div class="col col-50">
        <div class="row">
          <div class="col-100 light-button">
            <img src="static/img/choose.png">
            <span class="dropdown-text">abc</span>
          </div>
        </div>
        <div class="row">
          <div class="col col-50"><div class="yd-button-light"><i class="fa fa-camera-retro">&nbsp;</i>Camera</div></div>
          <div class="col col-50"><div class="yd-button-light"><i class="fa fa-file-image-o">&nbsp;</i>Album</div></div>
        </div>
        <div class="row">
          <div class="col-100 light-button">
            <img src="static/img/single-line-text-field.png" @click="setName2">
            <span><input type="text"></input></span>
          </div>
        </div>
      </div>
    </div>
    <div class="settings-dialog-audio row">
      <div class="col col-33"><div class="yd-button-light"><i class="fa fa-circle dark-red">&nbsp;</i>Record</div></div>
      <div class="col col-33"><div class="yd-button-light"><i class="fa fa-play sky-blue">&nbsp;</i>Play</div></div>
      <div class="col col-33"><div class="yd-button-light"><i class="fa fa-trash-o">&nbsp;</i>Delete</div></div>
    </div>
    <div class="settings-dialog-confirm row">
      <div class="col col-50"><a href='#' class="button button-fill color-gray button-raised" @click="cancel">Cancel</a></div>
      <div class="col col-50"><a href='#' class="button button-fill color-blue button-raised" @click="confirm">Confirm</a></div>
    </div>
  </div>
</div>

</template>

<script>
import {EventBus} from '../EventBus'

export default {
  props: ['mode'],
  data() {
    return {
      cardImage: "static/img/dummy_content.jpg"
    }
  },
  methods: {
    cancel: function() {
      EventBus.$emit("CARD_SETTINGS_CLOSE", this.uuid);
    },
    confirm: function() {
    },
    setName: function() {
      var f7 = new window.Framework7();
      f7.prompt('What is this card\'s name?', 'Set Name', function(){
        console.log('on ok');
      }, function(){
        console.log('on cancel');
      });
    }
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

</style>

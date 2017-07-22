<template>
<div>
  <div class="settings-container"></div>
  <div class="settings-dialog">
    <div class="settings-frame">
      <img src="static/img/parent_settingspop_bg.png">
    </div>
    <div class="settings-dialog-title">Edit Card</div>
    <div class="classware-title">
      <!--<input type="text" :placeholder="cardContent.name"></input>-->
      {{cardContent.name}}
    </div>
    <div class="classware-layout">
      <div class="row">Choose animation</div>
      <div class="row">
        <div v-for="animation in animations" class="col col-33" :key="animation.id" @click="select(animation.value)">
          <img class="layout" :class="{'selected': animation.value === selected}" :src="animation.pic">
          <small>{{ animation.name}}</small>
        </div>
      </div>
    </div>
    <div class="classware-delete row">
      <div class="col col-50 delete-text" @click="deleteClasswareItem">Delete this card</div>
      <div class="col col-50 delete-checkbox">
        <div class="item-input">
            <input type="checkbox" id="checkbox" v-model="mute">
            <label for="checkbox">{{ mute ? 'muted' : 'mute' }}</label>
        </div>
      </div>
    </div>
    <div class="classware-confirm row">
      <div class="col col-50"><a href='#' class="button button-fill color-gray button-raised" @click="cancel">Cancel</a></div>
      <div class="col col-50"><a href='#' class="button button-fill color-blue button-raised" @click="confirm">Confirm</a></div>
    </div>
  </div>
</div>

</template>

<script>
import {EventBus, Events} from '../EventBus'
import db from '../db'
import _ from 'lodash'
import Utils from '../utils'

export default {
  props: ['card'],
  data() {
    return {
      selected: '',
      animations: [
        {
          id: 0,
          name: 'None',
          value: 'none',
          pic: 'static/img/parent_settingspop_layout1_1.png'
        },
        {
          id: 1,
          name: 'Enlarge',
          value: 'enlarge',
          pic: 'static/img/animation-enlarge.png'
        },
        {
          id: 2,
          name: 'Rotate',
          value: 'rotate',
          pic: 'static/img/animation-rotate.png'
        }
      ],
      mute: false,
      cardContent: {}
    }
  },
  methods: {
    cancel: function() {
      EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_CLOSE, this.card);
    },
    select: function(value) {
      this.selected = value;
    },
    deleteClasswareItem: function() {
      var f7 = Utils.getF7();
      f7.confirm('Are you sure?', 'Delete Card', () => {
        db.deleteClasswareItem(this.card);
        EventBus.$emit(Events.DISPLAY_DRAWER_UPDATED, this.card.parent);
        EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_CLOSE, this.card);
      });

    },
    confirm: function() {
      var changed = false;
      var changedObj = {};
      if (this.card.animation != this.selected) {
        changed = true;
        changedObj.animation = this.selected;
      }
      if (this.card.mute != this.mute) {
        changed = true;
        changedObj.mute = this.mute;
      }
      if (changed) {
        var obj = _.assign(this.card, changedObj);
        db.updateClasswareItem(obj);
      }
      EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_CLOSE, this.card, changed);
    }
  },
  created() {
    // Load data
    this.cardContent = db.getCardByUuid(this.card.content);
    this.selected = this.card.animation;
    this.mute = this.card.mute;
    console.log(this.card);
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
  background: transparent;
  z-index: 200;
}
.settings-dialog {
  position: relative;
  top: 20%;
  left: 10%;
  width:80%;
  height:60%;
  z-index: 300;
}

.settings-dialog img {
  width: 100%;
}

.settings-dialog .settings-dialog-title {
  position: absolute;
  top: 6%;
  width: 70%;
  margin-left: 15%;
  margin-right: 15%;
  text-align: center;
  font-size: 15px;
  color: lightgrey;
}

.settings-dialog .classware-title {
  position: absolute;
  top: 19%;
  width: 70%;
  margin-left: 15%;
  margin-right: 15%;
}

.classware-title input {
  border: none;
  background-color: transparent;
}
.settings-dialog .classware-layout {
  position: absolute;
  top: 27%;
  width: 70%;
  margin-left: 15%;
  margin-right: 15%;
  text-align: center;
}

.settings-dialog .classware-delete {
  position: absolute;
  top: 69%;
  width: 74%;
  margin-left: 13%;
  margin-right: 13%;
}

.classware-delete .delete-text {
  color: red;
}

.settings-dialog .classware-confirm {
  position: absolute;
  top: 81.5%;
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
</style>

<template>
<div>
  <div class="settings-container"></div>
  <div class="settings-dialog">
    <div class="settings-frame">
      <img src="static/img/parent_settingspop_bg.png">
    </div>
    <div class="settings-dialog-title">{{ $t('message.edit_card') }}</div>
    <div class="classware-title">
      <!--<input type="text" :placeholder="cardContent.name"></input>-->
      {{cardContent.name}} <span @click="editFromLibrary">({{ $t('message.edit_from_library') }})</span>
    </div>
    <div class="classware-layout">
      <div class="row">{{ $t('message.choose_animation') }}</div>
      <div class="row">
        <div v-for="animation in animations" class="col col-33" :key="animation.id" @click="select(animation.value)">
          <img class="layout" :class="{'selected': animation.value === selected}" :src="animation.pic">
          <small>{{ animation.name }}</small>
        </div>
      </div>
    </div>
    <div class="classware-delete row">
      <div class="col col-50 delete-text" @click="deleteClasswareItem">{{ $t('message.delete_card') }}</div>
      <div class="col col-50 delete-checkbox">
        <div class="item-input">
            <input type="checkbox" id="checkbox" v-model="mute">
            <label for="checkbox">{{ $t('message.mute') }}</label>
        </div>
      </div>
    </div>
    <div class="classware-confirm row">
      <div class="col col-50"><a href='#' class="button button-fill color-gray button-raised" @click="cancel">{{ $t('message.cancel') }}</a></div>
      <div class="col col-50"><a href='#' class="button button-fill color-blue button-raised" @click="confirm">{{ $t('message.confirm') }}</a></div>
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
          name: this.$t('message.none'),
          value: 'none',
          pic: 'static/img/parent_settingspop_layout1_1.png'
        },
        {
          id: 1,
          name: this.$t('message.enlarge'),
          value: 'enlarge',
          pic: 'static/img/animation-enlarge.png'
        },
        {
          id: 2,
          name: this.$t('message.swing'),
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
      EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_CLOSE, this.card)
    },
    select: function(value) {
      this.selected = value
    },
    editFromLibrary: function() {
      console.log('edit from library')
      let categoryList = db.getNonOfficialResourceCategories()
      let isOfficialCategory = _.find(categoryList, (o) => {
        return o.uuid === this.cardContent.category
      })
      if (isOfficialCategory) {
        EventBus.$emit(Events.DISPLAY_SAME_SCREEN_EDIT_RESOURCE, this.cardContent)
      } else {
        var f7 = Utils.getF7()
        f7.alert(this.$t('message.cannot_edit_preload'), this.$t('message.forbidden'))
      }
    },
    deleteClasswareItem: function() {
      var f7 = Utils.getF7()
      f7.confirm(this.$t('message.are_you_sure'), this.$t('message.alert_delete_card'), () => {
        db.deleteClasswareItem(this.card)
        EventBus.$emit(Events.DISPLAY_DRAWER_UPDATED, this.card.parent)
        EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_CLOSE, this.card)
        window.ga.trackEvent('USER_EVENT', 'DISPLAY', 'ITEM_DELETED')
      })
    },
    confirm: function() {
      var changed = false
      var changedObj = {}
      if (this.card.animation !== this.selected) {
        changed = true
        changedObj.animation = this.selected
      }
      if (this.card.mute !== this.mute) {
        changed = true
        changedObj.mute = this.mute
      }
      if (changed) {
        this.card = _.assign(this.card, changedObj)
        db.updateClasswareItem(this.card)
      }
      EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_CLOSE, this.card, changed)
    }
  },
  created() {
    // Load data
    this.cardContent = db.getCardByUuid(this.card.content)
    this.selected = this.card.animation
    this.mute = this.card.mute
    window.ga.trackEvent('USER_EVENT', 'DISPLAY_CARD_SETTING', 'ENTER')
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
  margin-top: 30%;
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

.classware-title span {
  margin-left: 0.25em;
  color: red;
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

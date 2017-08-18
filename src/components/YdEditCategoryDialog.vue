<template>
<div>
  <div class="settings-container"></div>
  <div class="settings-dialog">
    <div class="settings-frame">
      <img src="static/img/edit-dialog-with-text-field.png">
    </div>
    <div class="settings-dialog-title">{{ $t('message.edit_category') }}</div>
    <div class="classware-title">
      <input v-if="newCategory" type=text :placeholder="$t('message.category_name')" v-model="cardTitle"></input>
      <input v-else type=text :placeholder="cardTitle" v-model="cardTitle"></input>
    </div>

    <div class="classware-delete" @click="deleteCategory" v-if="!newCategory">{{ $t('message.delete_courseware') }}</div>
    <div class="classware-confirm row">
      <div class="col col-50"><a href='#' class="button button-fill color-gray button-raised" @click="cancel">{{ $t('message.cancel') }}</a></div>
      <div class="col col-50"><a href='#' class="button button-fill color-blue button-raised" @click="confirm">{{ $t('message.confirm') }}</a></div>
    </div>
  </div>
</div>

</template>

<script>
import { EventBus, Events } from '../EventBus'
import db from '../db'
import _ from 'lodash'
import Utils from '../utils'

export default {
  props: ['card', 'newCategory'],
  data() {
    return {
      cardTitle: '',
    }
  },
  methods: {
    cancel: function() {
      EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_CLOSE, this.card);
    },
    confirm: function() {
      if (this.cardTitle == '') {
        var f7 = Utils.getF7();
        f7.alert(this.$t('message.require_category_title'), this.$t('message.missing_info_title'));
        return
      }
      if(this.newCategory) {
        var doc = db.insertRootClassware(this.cardTitle);
        EventBus.$emit(Events.DISPLAY_NEW_ROOT_CLASSWARE, doc);
        EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_CLOSE, doc);
        return
      }

      // Editing existing
      if (this.card.parent == 'root') {
        var f7 = Utils.getF7();
        f7.confirm(this.$t('message.cannot_edit_in_all'), this.$t('message.forbidden'), function () {
          EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_CLOSE, this.card);
        });
      } else if (this.card.type == 'card') {
        var f7 = Utils.getF7();
        f7.confirm(this.$t('message.modify_card_in_library'), this.$t('message.forbidden'), function () {
          EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_CLOSE, this.card);
        });
      } else {
        if (cardTitle != card.name) {
          var changedObj = {};
          changedObj.name = cardTitle;
          var obj = _.assign(this.card, changedObj);
          console.log(obj);
          // db.updateClasswareItem(this.card);
        }
      }
    },
    deleteCategory: function() {
      console.log(this.card.parent);
      if (this.card.parent == 'root') {
        var f7 = Utils.getF7();
        f7.confirm(this.$t('message.cannot_delete_in_all'), this.$t('message.forbidden'), function () {
          EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_CLOSE, this.card);
        });
      } else {
        var f7 = Utils.getF7();
        f7.confirm(this.$t('message.are_you_sure'), this.$t('message.delete_whole_category'), () => {
          if (this.card.type == 'folder') {
            // remove sub content
            db.deleteAllSubClasswareItem(this.card);
            // reorder
            db.deleteClasswareItem(this.card);
          } else {
            // remove and reorder
            db.deleteClasswareItem(this.card);
          }
          EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_CLOSE, this.card);
          EventBus.$emit(Events.DISPLAY_CATEGORY_DELETED, this.card);
        });
      }
    }
  },
  created() {
    if (this.newCategory) {
      window.ga.trackEvent('USER_EVENT', 'DISPLAY_CATEGORY', 'CREATE')
      return
    }
    if (this.card.type == 'folder') {
      this.cardTitle = this.card.name
      window.ga.trackEvent('USER_EVENT', 'DISPLAY_CATEGORY', 'EDIT')
    } else {
      // This item is a collection of asset cards
      var content = db.getCardByUuid(this.card.content);
      this.cardTitle = content.name;
      window.ga.trackEvent('USER_EVENT', 'DISPLAY_CATEGORY', 'EDIT_RES_CAT')
    }
  },
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
  z-index: 200;
}
.settings-dialog {
  position: relative;
  margin-top: 40%;
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
  top: 8%;
  width: 70%;
  margin-left: 15%;
  margin-right: 15%;
  text-align: center;
  font-size: 15px;
  color: lightgrey;
}

.settings-dialog .classware-title {
  position: absolute;
  top: 30%;
  width: 70%;
  margin-left: 15%;
  margin-right: 15%;
}

.classware-title input {
  border: none;
}

.settings-dialog .classware-delete {
  position: absolute;
  top: 45%;
  width: 70%;
  margin-left: 15%;
  margin-right: 15%;
  color: red;
}

.settings-dialog .classware-confirm {
  position: absolute;
  top: 68%;
  width: 80%;
  margin-left: 10%;
  margin-right: 10%;
}
</style>

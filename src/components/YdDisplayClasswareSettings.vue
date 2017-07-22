<template>
<div>
  <div class="settings-container"></div>
  <div class="settings-dialog">
    <div class="settings-frame">
      <img src="static/img/parent_settingspop_bg.png">
    </div>
    <div class="settings-dialog-title">Edit Classware</div>
    <div class="classware-title">
      <input type="text" :placeholder="classwareInfo.name" :disabled="classwareId == 'all'"></input>
    </div>
    <div class="classware-layout">
      <div class="row">Choose layout</div>
      <div class="row">
        <div v-for="setting in gridSettings" class="col col-50" :key="setting.id" @click="select(setting.size)">
          <img class="layout" :class="{'selected': setting.size == selectedGridSize}" :src="setting.pic">
        </div>
      </div>
    </div>
    <div class="classware-delete" @click="deleteClassware">Delete this courseware</div>
    <div class="classware-confirm row">
      <div class="col col-50"><a href='#' class="button button-fill color-gray button-raised" @click="cancel">Cancel</a></div>
      <div class="col col-50"><a href='#' class="button button-fill color-blue button-raised" @click="confirm">Confirm</a></div>
    </div>
  </div>
</div>

</template>

<script>
import { EventBus, Events } from '../EventBus'
import db from '../db.js'
import Utils from '../utils'

export default {
  props: ['classwareId'],
  data() {
    return {
      gridSettings: [
        {
          id: 0,
          size: 1,
          pic: 'static/img/parent_settingspop_layout1_1.png'
        },
        {
          id: 1,
          size: 2,
          pic: 'static/img/parent_settingspop_layout2_2.png'
        }
      ],
      selectedGridSize: 2,
      classwareInfo: {}
    }
  },
  methods: {
    cancel: function() {
      EventBus.$emit(Events.DISPLAY_CLASSWARE_SETTINGS_CLOSE);
    },
    deleteClassware: function() {
      if (this.classwareId == 'all') {
        this.f7.alert('Cannot delete All', 'Forbiden');
      } else {
        this.f7.confirm('Are you sure?', 'Delete Whole Category', () => {
          if (this.classwareInfo.type == 'folder') {
            // remove sub content
            db.deleteAllSubClasswareItem(this.classwareInfo);
            // reorder
            db.deleteClasswareItem(this.classwareInfo);
          }
          EventBus.$emit(Events.DISPLAY_CURRENT_CATEGORY_DELETED, this.classwareInfo);
          EventBus.$emit(Events.DISPLAY_CLASSWARE_SETTINGS_CLOSE, this.classwareInfo);
        });
      }
    },
    select: function(size) {
      this.selectedGridSize = size;
    },
    confirm: function() {
    }
  },
  created() {
    console.log(this.classwareId);
    if (this.classwareId == 'all') {
      this.classwareInfo = {
        name: 'All'
      }
    } else  {
      this.classwareInfo = db.getClasswareItemByUuid(this.classwareId);
    }
  },
  mounted() {
    this.f7 = Utils.getF7();
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
  background: transparent;
}

.settings-dialog .classware-layout {
  position: absolute;
  top: 27%;
  width: 70%;
  margin-left: 15%;
  margin-right: 15%;
}

.settings-dialog .classware-delete {
  position: absolute;
  top: 69%;
  width: 74%;
  margin-left: 13%;
  margin-right: 13%;
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

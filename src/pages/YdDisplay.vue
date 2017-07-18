<template>
<div id="display">

  <div class="row logo-bar">
    <!-- Yuudee's logo' -->
    <div class="col-33">
    </div>
    <div class="col-33 app-logo">
      <img src="static/img/yuudee_logo.svg">
    </div>
    <div class="col-33">
    </div>
  </div>

  <!--v-for-->
  <yd-drawer v-for="(uuid, index) in drawers"
             :uuid="uuid"
             :col="gridSize.column"
             :row="gridSize.row"
             :edit-mode="editMode"
             :root="isRoot(uuid)"
             :key="uuid">
  </yd-drawer>

  <!-- settings layer -->
  <div id="app-settings-header" v-if="editMode">
    <div class="row align-center">
      <div class="col col-25">
        <div class="yd-button" @click="toogleEditMode">结束编辑</div>
      </div>
      <div class="col col-50">
        <div class="yd-button" ref="classwarePopover" @click="openClasswarePopover">{{classwareName}}</div>
      </div>
      <div class="col col-25">
        <div class="yd-button"><router-link to="/resource">素材库</router-link></div>
      </div>
    </div>
  </div>

  <!--footer-->
  <div id="app-settings-footer" class="row row-bottom align-center" v-if="editMode">
    <div class="col col-25">
      <div class="yd-button" @click="newClick" ref="newbutton">新建</div>
    </div>
    <div class="col col-25 col-offset-50">
      <div class="yd-button" @click="openClasswareSettings">设置</div>
    </div>
  </div>

  <!--Popover-->
    <div class="popover popover-classwares">
      <div class="popover-angle"></div>
      <div class="popover-inner">
        <div class="list-block inset">
          <ul>
            <li v-for="(classware, index) in classwares" :key="index">
              <a href="#" class="list-button item-link" @click="onChooseRootClassware(classware.uuid)">{{classware.name}}</a>
            </li>
          </ul>
        </div>
      </div>
  </div>

  <!--Dialogs-->
  <transition name="slide">
    <yd-display-card-settings v-if="showCardSettings" :card="cardInEdit"></yd-display-card-settings>
    <yd-display-classware-settings v-if="showClasswareSettings" :classwareId="rootUuid"></yd-display-classware-settings>
    <yd-edit-category-dialog v-if="showCategorySettings" :card="cardInEdit" :newCategory="showNewClasswareCategorySettings"></yd-edit-category-dialog>
  </transition>
  <div class="dark-overlay" v-if="isOverlay"></div>
  <!--Multi-touch areas-->
  <div v-if="!editMode">
    <v-touch v-for="(area, index) in touchAreas"
            class="touch-area" :class="area.name"
            v-on:press="pressed(index)"
            v-on:pressup="pressup(index)"
            :key="area.name"
            >
    </v-touch>
  </div>

</div>
</template>

<style scoped>
#display {
  height: 100%;
  width: 100%;
  position: absolute;
}
.popover-classwares {
  max-height: 50%;
  width: 50%;
}

.popover-inner {
  height: 100%;
  overflow-y: scroll;
}

.row.logo-bar {
  position: absolute;
  top: 4%;
  left:0px;
  width: 100%;
}
.app-logo img{
  width: 90%;
  height: 90%;
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

.touch-area {
  position: absolute;
  height: 15%;
  width: 25%;
  /*background: black;*/
}

.touch-area.touch-top-left {
  top: 0px;
  left: 0px;
}

.touch-area.touch-top-right {
  top: 0px;
  right: 0px;
}
.touch-area.touch-bottom-right {
  bottom: 0px;
  right: 0px;
}

.dark-overlay {
  position:fixed;
  width: 100%;
  height: 100%;
  padding: 0px;
  margin: 0px;
  top:0;
  left:0;
  background: #aaaaaa;
  opacity: 0.5;
  z-index: 110;
}

/* Animations */
.slide-enter-active {
  transition: all 0.2s ease;
  overflow: hidden;
  z-index: 1;
}
.slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
  z-index: 1;
}
.slide-enter, .slide-leave-to
/* .slide-fade-leave-active for <2.1.8 */ {
  transform: translateY(100%);
  z-index: 1;;
}
</style>

<script>
import YdCard from '../components/YdCard.vue'
import YdDrawer from '../components/YdDrawer.vue'
import { EventBus, Events } from '../EventBus.js'
import db from '../db.js'
import YdDisplayClasswareSettings from '../components/YdDisplayClasswareSettings'
import YdDisplayCardSettings from '../components/YdDisplayCardSettings'
import YdEditCategoryDialog from '../components/YdEditCategoryDialog'

export default {
  data() {
    return {
      drawers: [],
      editMode: false,
      rootUuid: '',
      classwares: [],
      gridSize: {},
      cardInEdit: {},
      showClasswareSettings: false,
      showNewClasswareCategorySettings: false,
      touchAreas: [
        { name: 'touch-top-left', pressed: false},
        { name: 'touch-top-right', pressed: false},
        { name: 'touch-bottom-right', pressed: false}
      ]
    }
  },
  components: { YdDrawer, YdDisplayClasswareSettings, YdDisplayCardSettings, YdEditCategoryDialog },
  computed: {
    classwareName: function() {
      // TODO: check root classware existance before displaying
      var classwareObj = db.getClasswareItemByUuid(this.rootUuid);
      if (!classwareObj) {
        return "Error"
      }
      return classwareObj.name;
    },
    showCardSettings: function() {
      if (this.cardInEdit && this.cardInEdit.type == 'card') {
        return true
      }
      return false
    },
    showCategorySettings: function() {
      if (this.cardInEdit && this.cardInEdit.type == 'folder' || this.showNewClasswareCategorySettings) {
        return true
      }
      return false
    },
    isOverlay: function() {
      return this.showCardSettings || this.showCategorySettings || this.showClasswareSettings
    }
  },
  methods: {
    isRoot: function(uuid) {
      return this.rootUuid == uuid;
    },
    newClick: function() {
      this.showNewClasswareCategorySettings = true;
    },
    toogleEditMode: function() {
      this.editMode = ! this.editMode;
    },
    openClasswarePopover: function() {
      this.popover = this.f7.popover('.popover-classwares', this.$refs.classwarePopover);
    },
    onChooseRootClassware: function(uuid) {
      this.f7.closeModal(this.popover, false)
      this.popover = null;
      this.drawers = [];
      this.rootUuid = uuid;
      this.drawers.push(uuid);
      db.setRootClasswareUuid(uuid);
    },
    openClasswareSettings: function() {
      this.showClasswareSettings = true;
    },
    pressed: function(index) {
      this.touchAreas[index].pressed = true;
      if (this.touchAreas[0].pressed && this.touchAreas[1].pressed && this.touchAreas[2].pressed) {
        this.editMode = true;
        this.touchAreas[0].pressed = false;
        this.touchAreas[1].pressed = false;
        this.touchAreas[2].pressed = false;
      }
    },
    pressup: function(index) {
      this.touchAreas[index].pressed = false;
    }
  },
  created() {
    EventBus.$on(Events.DISPLAY_DRAWER_CLOSE, uuid => {
      this.drawers.pop();
    });
    EventBus.$on(Events.DISPLAY_CATEGORY, uuid => {
      this.drawers.push(uuid);
    });
    EventBus.$on(Events.DISPLAY_CARD_SETTINGS_OPEN, cardOrCategory => {
      this.cardInEdit = cardOrCategory;
    })
    EventBus.$on(Events.DISPLAY_CARD_SETTINGS_CLOSE, uuid => {
      this.cardInEdit = {};
      this.showNewClasswareCategorySettings = false;
    });
    EventBus.$on(Events.DISPLAY_CLASSWARE_SETTINGS_CLOSE, () => {
      // TODO: Close drawers or warn if root is not the same with top classware
      this.showClasswareSettings = false;
    });
    EventBus.$on(Events.DISPLAY_NEW_ROOT_CLASSWARE, (doc) => {
      this.classwares.push(doc);
      this.drawers = [];
      this.rootUuid = doc.uuid;
      this.drawers.push(doc.uuid);
      db.setRootClasswareUuid(doc.uuid);
    })
    EventBus.$on(Events.DISPLAY_CURRENT_CATEGORY_DELETED, (doc) => {
      window.setTimeout(() => {
        this.drawers = [];
        this.rootUuid = 'all';
        this.drawers.push('all');
        db.setRootClasswareUuid('all');
      }, 500);
    })

    // Load root classware uuid
    this.classwares = db.getClasswareList();
    this.rootUuid = db.getRootClasswareUuid();
    this.drawers.push(this.rootUuid);

    // TODO: Grid size should be classware specific
    this.gridSize = db.getDisplayGridSize();
  },
  mounted() {
    this.f7 = new Framework7();
  },
}
</script>
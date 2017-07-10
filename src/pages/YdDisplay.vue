<template>
<div>
  <div class="row">
    <!-- Yuudee's logo' -->
    <div class="col-33">
    </div>
    <div class="col-33 app-logo">
      <img src="static/img/yuudee_logo.svg" @click="toogleEditMode">
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
  <yd-display-classware-settings v-if="showClasswareSettings"></yd-display-classware-settings>
  <yd-display-card-settings v-if="cardInEdit" :card="cardInEdit"></yd-display-card-settings>
  <yd-edit-category-dialog v-if="showCategoryDialog"></yd-edit-category-dialog>
</div>
</template>

<style scoped>
.popover-classwares {
  max-height: 50%;
  width: 50%;
}

.popover-inner {
  height: 100%;
  overflow-y: scroll;
}

.app-logo {
  display: flex;
  justify-content: center;
  padding-top: 5%;
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
      cardInEdit: null,
      showClasswareSettings: false,
      showCategoryDialog: false
    }
  },
  components: { YdDrawer, YdDisplayClasswareSettings, YdDisplayCardSettings, YdEditCategoryDialog },
  computed: {
    classwareName: function() {
      return db.getClasswareByUuid(this.rootUuid).name;
    }
  },
  methods: {
    isRoot: function(uuid) {
      return this.rootUuid == uuid;
    },
    newClick: function() {

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
    }
  },
  created() {
    EventBus.$on(Events.DISPLAY_DRAWER_CLOSE, uuid => {
      this.drawers.pop();
    });
    EventBus.$on(Events.DISPLAY_CATEGORY, uuid => {
      this.drawers.push(uuid);
    });
    EventBus.$on(Events.DISPLAY_CARD_SETTINGS_OPEN, card => {
      console.log('editing: ' + card.uuid);
      this.cardInEdit = card;
    })
    EventBus.$on(Events.DISPLAY_CARD_SETTINGS_CLOSE, uuid => {
      this.cardInEdit = null;
    });
    EventBus.$on(Events.DISPLAY_CLASSWARE_SETTINGS_CLOSE, () => {
      this.showClasswareSettings = false;
    });

    // Load root classware uuid
    this.classwares = db.getClasswareList();
    this.rootUuid = db.getRootClasswareUuid();
    this.drawers.push(this.rootUuid);

    // TODO: Grid size should be classware specific
    this.gridSize = db.getDisplayGridSize();
  },
  mounted() {
    this.f7 = new Framework7();
  }
}
</script>
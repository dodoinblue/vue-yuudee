<template>
<div id="display">

  <div class="row logo-bar">
    <!-- Yuudee's logo' -->
    <div class="col-33">
    </div>
    <div class="col-33 app-logo">
      <img v-if="!editMode" src="static/img/yuudee_logo.svg">
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
        <div class="yd-button" @click="toggleEditMode">{{ $t('message.done') }}</div>
      </div>
      <div class="col col-50">
        <div class="yd-button" ref="classwarePopover" @click="openClasswarePopover">{{classwareName}}</div>
      </div>
      <div class="col col-25">
        <div class="yd-button" @click="goToResource">{{ $t('message.library') }}</div>
      </div>
    </div>
  </div>

  <!--footer-->
  <div id="app-settings-footer" class="row row-bottom align-center" v-if="editMode">
    <div class="col col-25">
      <div class="yd-button" @click="newClick" ref="newbutton">{{ $t('message.new') }}</div>
    </div>
    <div class="col col-25 col-offset-50">
      <div class="yd-button" @click="openClasswareSettings">{{ $t('message.settings') }}</div>
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
  <transition name="slideup">
    <yd-display-card-settings v-if="showCardSettings" :card="cardInEdit"></yd-display-card-settings>
    <yd-display-classware-settings v-if="showClasswareSettings" :classwareId="rootUuid"></yd-display-classware-settings>
    <yd-edit-category-dialog v-if="showCategorySettings" :card="cardInEdit" :newCategory="showNewClasswareCategorySettings"></yd-edit-category-dialog>
    <yd-edit-card-dialog v-if="showEditResCardDialog" :cardInEdit="cardInEdit"></yd-edit-card-dialog>
  </transition>
  <div class="dark-overlay" v-if="isOverlay"></div>
  <!--Multi-touch areas-->
  <div v-if="!editMode">
    <v-touch v-for="(area, index) in touchAreas"
            class="touch-area" :class="area.name"
            v-on:press="pressed(index)"
            v-on:pressup="pressup(index)"
            v-bind:press-options="{ time: 50 }"
            :key="area.name"
            >
      <transition name="flash">
        <img v-if="showHintDots" class="circle-dot" src="static/img/circle-dot.png">
      </transition>
    </v-touch>
    <img class="unlock-icon" src="static/img/unlockicon.png" @click="showHint">
  </div>

  <!-- Helper overlay -->
  <div id="helper-overlay" v-if="firstStartup">
    <div v-for="(area, index) in touchAreas"
        class="touch-area" :class="area.name"
        v-bind:press-options="{ time: 50 }"
        :key="area.name"
        >
      <img class="circle-dot" src="static/img/circle-dot.png">
    </div>
    <img class="guide-arrows" src="static/img/guide.png">
    <div id="helper-content">
      <div class="row helper-text">
        {{ $t('message.helper_message') }}
      </div>
      <div class="row helper-button">
        <div class="col-33"></div>
        <div class="col-33">
          <a href='#' class="button button-fill color-blue button-raised" @click="helperDone">{{ $t('message.confirm') }}</a>
        </div>
        <div class="col-33"></div>
      </div>
    </div>
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
  height: 50%;
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

/* Helper overlay */
#helper-overlay {
  position: absolute;
  top: 0px;
  left: 0px;
  height: 100%;
  width: 100%;
}

#helper-overlay .guide-arrows {
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  background: black;
  opacity: 0.5;
}

#helper-content {
  position: absolute;
  left: 10%;
  right: 10%;
  top: 37%;
  height: 20%;
  text-align: center;
  align-content: center;
  align-items: center;
}

.helper-text {
  display: inline-block;
  margin-top: 1em;
  font-size: 1.2em;
  width: 100%;
  color: white;
  text-align: center;
}

.helper-button {
  margin-top: 1em;
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

.touch-top-left .circle-dot {
  position: absolute;
  height: 32px;
  width: 32px;
  top: 10px;
  left: 10px;
}

.touch-area.touch-top-right {
  top: 0px;
  right: 0px;
}
.touch-top-right .circle-dot {
  position: absolute;
  height: 32px;
  width: 32px;
  top: 10px;
  right: 10px;
}
.touch-area.touch-bottom-right {
  bottom: 0px;
  right: 0px;
}
.touch-bottom-right .circle-dot {
  position: absolute;
  height: 32px;
  width: 32px;
  bottom: 10px;
  right: 10px;
}

.unlock-icon {
  position: absolute;
  height: 32px;
  width: 32px;
  bottom: 10px;
  left: 10px;
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
.slideup-enter-active {
  transition: all 0.2s ease;
  overflow: hidden;
  z-index: 1;
}
.slideup-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
  z-index: 1;
}
.slideup-enter, .slideup-leave-to
/* .slide-fade-leave-active for <2.1.8 */ {
  transform: translateY(100%);
  z-index: 1;;
}

@keyframes flash {
  from, 50%, to {
    opacity: 1;
  }

  25%, 75% {
    opacity: 0;
  }
}

.flash-enter-active {
  animation: flash .5s;
}
</style>

<script>
// import YdCard from '../components/YdCard.vue'
import YdDrawer from '../components/YdDrawer.vue'
import { EventBus, Events } from '../EventBus.js'
import db from '../db.js'
import Utils from '../utils'
import YdDisplayClasswareSettings from '../components/YdDisplayClasswareSettings'
import YdDisplayCardSettings from '../components/YdDisplayCardSettings'
import YdEditCategoryDialog from '../components/YdEditCategoryDialog'
import YdEditCardDialog from '../components/YdEditCardDialog'
import _ from 'lodash'

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
      showEditResCardDialog: false,
      showHintDots: false,
      firstStartup: false,
      touchAreas: [
        { name: 'touch-top-left', pressed: false },
        { name: 'touch-top-right', pressed: false },
        { name: 'touch-bottom-right', pressed: false }
      ]
    }
  },
  components: { YdDrawer, YdDisplayClasswareSettings, YdDisplayCardSettings, YdEditCategoryDialog, YdEditCardDialog },
  watch: {
    editMode: function(val, oldVal) {
      window.ga.trackEvent('USER_EVENT', 'EDITMODE', 'CHANGE', val, false)
    }
  },
  computed: {
    classwareName: function() {
      // TODO: check root classware existance before displaying
      var classwareObj = db.getClasswareItemByUuid(this.rootUuid)
      if (!classwareObj) {
        return 'Error'
      }
      return classwareObj.name
    },
    showCardSettings: function() {
      if (this.showEditResCardDialog) {
        return false
      }
      if (this.cardInEdit && this.cardInEdit.type === 'card') {
        return true
      }
      return false
    },
    showCategorySettings: function() {
      if ((this.cardInEdit && this.cardInEdit.type === 'folder') || this.showNewClasswareCategorySettings) {
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
      return this.rootUuid === uuid
    },
    newClick: function() {
      this.showNewClasswareCategorySettings = true
    },
    toggleEditMode: function() {
      this.editMode = !this.editMode
    },
    openClasswarePopover: function() {
      this.popover = this.f7.popover('.popover-classwares', this.$refs.classwarePopover)
    },
    goToResource: function() {
      this.$router.push('/resource')
    },
    helperDone: function() {
      this.firstStartup = false
      db.setNewUserHelperFlag(false)
    },
    showHint: function() {
      this.showHintDots = true
      setTimeout(() => {
        this.showHintDots = false
      }, 750)
    },
    onChooseRootClassware: function(uuid) {
      this.f7.closeModal(this.popover, false)
      this.popover = null
      this.drawers = []
      this.rootUuid = uuid
      this.drawers.push(uuid)
      db.setRootClasswareUuid(uuid)
    },
    openClasswareSettings: function() {
      this.showClasswareSettings = true
    },
    pressed: function(index) {
      this.touchAreas[index].pressed = true
      if (this.touchAreas[0].pressed && this.touchAreas[1].pressed && this.touchAreas[2].pressed) {
        this.editMode = true
        this.touchAreas[0].pressed = false
        this.touchAreas[1].pressed = false
        this.touchAreas[2].pressed = false
      }
    },
    pressup: function(index) {
      this.touchAreas[index].pressed = false
    }
  },
  created() {
    window.db = db
    this.firstStartup = db.getNewUserHelperFlag()
    EventBus.$on(Events.DISPLAY_DRAWER_CLOSE, uuid => {
      this.drawers.pop()
    })
    EventBus.$on(Events.DISPLAY_CATEGORY, uuid => {
      this.drawers.push(uuid)
    })
    EventBus.$on(Events.DISPLAY_CARD_SETTINGS_OPEN, cardOrCategory => {
      this.cardInEdit = cardOrCategory
    })
    EventBus.$on(Events.DISPLAY_CARD_SETTINGS_CLOSE, uuid => {
      this.cardInEdit = {}
      this.showNewClasswareCategorySettings = false
    })
    EventBus.$on(Events.DISPLAY_CLASSWARE_SETTINGS_CLOSE, () => {
      // TODO: Close drawers or warn if root is not the same with top classware
      this.showClasswareSettings = false
    })
    EventBus.$on(Events.DISPLAY_SAME_SCREEN_EDIT_RESOURCE, (doc) => {
      console.log('from display: ')
      console.log(doc)
      // this.showCardSettings = false
      this.cardInEdit = doc
      this.showEditResCardDialog = true
    })
    // for eidt resource dialog to be closed
    EventBus.$on(Events.RESOURCE_NEW_CARD_CLOSE, () => {
      this.showEditResCardDialog = false
      this.cardInEdit = {}
    })
    EventBus.$on(Events.DISPLAY_NEW_ROOT_CLASSWARE, (doc) => {
      window.ga.trackEvent('USER_EVENT', 'DISPLAY', 'ROOT_COURSEWARE_CHANGED')
      window.setTimeout(() => {
        this.classwares = db.getClasswareList()
        this.drawers = []
        this.rootUuid = doc.uuid
        this.drawers.push(doc.uuid)
        db.setRootClasswareUuid(doc.uuid)
      }, 250)
    })
    EventBus.$on(Events.DISPLAY_CURRENT_CATEGORY_DELETED, (doc) => {
      window.setTimeout(() => {
        this.classwares = db.getClasswareList()
        this.drawers = []
        this.rootUuid = 'all'
        this.drawers.push('all')
        db.setRootClasswareUuid('all')
      }, 250)
    })

    // Load root classware uuid
    this.classwares = db.getClasswareList()
    this.rootUuid = db.getRootClasswareUuid()
    this.drawers.push(this.rootUuid)

    // TODO: Grid size should be classware specific
    // this.gridSize = db.getDisplayGridSize()

    // Back button
    this.backCount = 0
    document.addEventListener('backbutton', () => {
      if (this.$store.state.isCardPlaying) {
        return
      }
      switch (this.$route.path) {
        case '/display':
          if (this.showClasswareSettings) {
            this.showClasswareSettings = false
          } else if (this.showNewClasswareCategorySettings) {
            this.showNewClasswareCategorySettings = false
          } else if (this.showEditResCardDialog) {
            this.showEditResCardDialog = false
          } else if (!_.isEmpty(this.cardInEdit)) {
            this.cardInEdit = {}
          } else if (this.drawers.length > 1) {
            this.drawers.pop()
          } else if (this.editMode) {
            this.editMode = false
          } else if (this.backCount > 0) {
            navigator.app.exitApp()
            // this.$router.back()
          } else {
            this.backCount++
            this.f7.addNotification({
              title: this.$t('message.notice'),
              message: this.$t('message.press_again_to_exit'),
              hold: 2000
            })
            window.setTimeout(() => {
              this.backCount = 0
            }, 2000)
          }
          break
        case '/resource':
          EventBus.$emit(Events.RESOURCE_BACK_PRESSED)
          break
        case '/resource/pick':
          EventBus.$emit(Events.RESOURCE_BACK_PRESSED)
          break
        default:
          console.log(this.$route.path)
      }
    }, false)
  },
  mounted() {
    this.f7 = Utils.getF7()
    window.ga.trackView('PAGE_DISPLAY')
  }
}
</script>
<template>
<!-- App -->
<div id="app">

  <!-- Statusbar -->
  <!--<f7-statusbar></f7-statusbar>-->

  <div class="row">
    <!-- Yuudee's logo' -->
    <div class="col-33">
    </div>
    <div class="col-33">
      <img class="app-logo" src="../static/img/yuudee_logo.svg" @click="toogleEditMode">
    </div>
    <div class="col-33">
    </div>
  </div>

  <!--v-for-->
  <yd-drawer :path="rootPath" :edit-mode="editMode" :root="rootPath === rootPath"></yd-drawer>
  <yd-drawer v-for="(drawer, index) in drawers" :path="drawer" :edit-mode="editMode" :root="drawer === rootPath"></yd-drawer>

  <!-- settings layer -->
  <div id="app-settings-header" v-if="editMode">
    <div class="row align-center">
      <div class="col col-25">
        <div class="yd-button" @click="toogleEditMode">结束编辑</div>
      </div>
      <div class="col col-50">
        <div class="yd-button">
          <dropdown></dropdown>
        </div>
      </div>
      <div class="col col-25">
        <div class="yd-button" ng-click="goToResource()">素材库</div>
      </div>
    </div>
  </div>

  <!--footer-->
  <div id="app-settings-footer" class="row row-bottom align-center" v-if="editMode">
    <div class="col col-25">
      <div class="yd-button">新建</div>
    </div>
    <div class="col col-25 col-offset-50">
      <div class="yd-button">设置</div>
    </div>
  </div>
</div>
</template>

<script>
import YdCard from './YdCard.vue'
import YdDrawer from './YdDrawer.vue'
import { EventBus } from './EventBus.js'
import Dropdown from './dropdown.vue'

export default {
  data() {
    return {
      rootPath: '.',
      drawers: [],
      editMode: false,
    }
  },
  components: { YdDrawer, Dropdown },
  computed: {
    path: function() {
      var result = this.rootPath;
      if (this.drawers.length != 0) {
        result = this.drawers[this.drawers.length - 1];
      }
      console.log("returning path: " + result);
      return result;
    },
    root: function() {
      if (this.path == this.rootPath) {
        return true;
      } else {
        return false;
      }
    }
  },
  methods: {
    toogleEditMode: function() {
      this.editMode = ! this.editMode;
    },
  },
  created() {
    EventBus.$on('DrawerBackClicked', path => {
      this.drawers.pop();
    });
    EventBus.$on('StackClicked', path => {
      this.drawers.push(path);
    });    
  }
}
</script>

<style scoped>
#app {
  background-image: url("../static/img/background.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  margin: 0px;
  height: 100%;
}
.app-logo {
  height: 18%;
  padding: 5% 0 0 0;
  text-align: center;
  width: 80%;
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

.yd-button {
  border-radius: 5px;
  background: url("../static/img/button-raw.png");
  border-style: solid;
  border-color: rgb(105,61,34);
  border-width: 1px;
  background-size: cover;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
  padding-top: 0.5em;
  padding-bottom: 0.5em;
  color: rgb(230,220,210);
  font-weight: bold;
  text-align: center;
}

select {
  /*width: 50%;*/
  height: 100%;
  color: rgb(230,220,210);
  font-weight: bold;
  font-size: 0.95em;
  padding: 0px;
  margin: 0px;
  text-align: center;
}
option {
  width: 100%;
}
</style>
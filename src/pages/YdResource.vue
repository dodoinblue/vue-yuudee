<template>
<div id="resource">
  <!--Header-->
  <div id="app-settings-header">
    <div class="row align-center">
      <div class="col col-25">
        <div class="yd-button" @click="back">Back</div>
      </div>
      <div class="col col-50 title">
        Library
      </div>
      <div class="col col-25">
        <div class="yd-button" ref="newButton" @click="showNewPopover">New</div>
      </div>
    </div>
  </div>

  <yd-drawer v-for="(uuid, index) in drawers"
              :uuid="uuid"
              :col="gridSize.column"
              :row="gridSize.row"
              :edit-mode="editMode"
              :root="isRoot(uuid)"
              :key="uuid"
              from="resource">
  </yd-drawer>

  <!--Dialogs-->
  <yd-edit-card-dialog v-if="showNewCardDialog"></yd-edit-card-dialog>
  <yd-res-new-category v-if="showNewCategoryDialog"></yd-res-new-category>

  <!--Popover-->
  <div class="popover popover-new-card">
    <div class="popover-angle"></div>
    <div class="popover-inner">
      <div class="list-block inset">
        <ul>
          <li> <a href="#" class="list-button item-link" @click="newCard()">New Card</a></li>
          <li> <a href="#" class="list-button item-link" @click="newCategory()">New Category</a></li>
        </ul>
      </div>
    </div>
  </div>

</div>  
</template>

<script>
import YdDrawer from '../components/YdDrawer'
import YdEditCardDialog from '../components/YdEditCardDialog'
import YdResNewCategory from '../components/YdResNewCategory'
import {EventBus, Events} from '../EventBus'
import Utils from '../utils'

export default {
  components: { YdDrawer, YdEditCardDialog, YdResNewCategory },
  props: ['mode'],
  data() {
    return {
      rootUuid: 'all',
      gridSize: {column: 2, row: 2},
      drawers: [],
      showNewCardDialog: false,
      showNewCategoryDialog: false
    }
  },
  computed: {
    editMode: function() { // share this with pick mode. if in resource, this setting means pick mode TODO: a better name
      return this.mode === 'pick'
    },
  },
  methods: {
    back: function() {
      this.$router.back();
    },
    isRoot: function(uuid) {
      return this.rootUuid == uuid;
    },
    showNewPopover: function() {
      this.popover = this.f7.popover('.popover-new-card', this.$refs.newButton);
    },
    newCard: function() {
      this.f7.closeModal(this.popover, false);
      this.popover = null;
      this.showNewCardDialog = true;
    },
    newCategory: function() {
      this.f7.closeModal(this.popover, false);
      this.showNewCategoryDialog = true;
      this.popover = null;
    }
  },
  created() {
    this.drawers.push('all');
    EventBus.$on(Events.RESOURCE_NEW_CARD_CLOSE, () => {
      this.showNewCardDialog = false;
      this.showNewCategoryDialog = false;
    });
    EventBus.$on(Events.RESOURCE_CATEGORY, uuid => {
      this.drawers.push(uuid);
    });
    EventBus.$on(Events.RESOURCE_DRAWER_CLOSE, uuid => {
      this.drawers.pop();
    });
  },
  mounted() {
    this.f7 = Utils.getF7();
    console.log('mode: ' + this.mode);
  }
}
</script>

<style>
div.title {
  text-align: center;
  font-size: 22px;
  color: bisque;
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

.grid-display {
  height: 100%;
  margin-top: 5%;
  border: 1px solid #ddd;
}

.card-img {
  width: 95%;
}

.popover-new-card {
  max-height: 50%;
  width: 50%;
}

.popover-inner {
  height: 100%;
  overflow-y: scroll;
}
</style>
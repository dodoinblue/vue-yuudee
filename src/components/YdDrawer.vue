<template>
<transition name="slide">
  <div class="drawer" :class="{'with-background': !root}">
    <div class="drawer-back" @click="backClicked()" v-if="!root"></div>
    <div class="swiper-container drawer-content">
      <div class="swiper-wrapper drawer-wrapper">
        <!-- Slides -->
        <div class="swiper-slide" v-for="(page, index) in pagedCards" :key="index">
          <div class="card-group" :id="'card-group-' + index">
            <div class="card-group-item" v-for="(card , index) in page" :key="card.uuid" :data-id="card.uuid">
              <yd-card :classware="card" :edit-mode="editMode" :from="from"></yd-card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</transition>
</template>

<script>
import YdCard from './YdCard.vue'
import Vue from 'vue'
import { EventBus, Events } from '../EventBus.js'
import Swiper from 'swiper'
import Sortable from 'sortablejs'
import _ from 'lodash'
import Utils from '../utils.js'
import db from '../db.js'

Vue.component('debug', {
  template: "<!-- debug -->",
  props: [
    "item"
  ],
  created: function() {
    console.log("debug", this.item);
    // debugger
  }
});

export default {
  props: ['root', 'editMode', 'uuid', 'row', 'col', 'from'],
  components: { YdCard },
  data() {
    return {
      cardList: [],
    }
  },
  watch: {
    uuid: function(val, oldVal) {
      console.log(val);
      console.log(oldVal);
      console.log('uuid changed')
    },
  },
  methods: {
    backClicked: function() {
      if (this.from == "resource") {
        EventBus.$emit(Events.RESOURCE_DRAWER_CLOSE, this.uuid);
      } else {
        EventBus.$emit(Events.DISPLAY_DRAWER_CLOSE, this.uuid);
      }
    },
    createSwiper: function() {
      var swiperContainerElement = this.$el.getElementsByClassName('swiper-container')[0];
      // Swiper
      this.mySwiper = new Swiper (swiperContainerElement);
    },
  },
  computed: {
    pagedCards: function() {
      console.log('im here');
      if (this.from != 'resource' && this.editMode && this.uuid != 'all') {
        // Append empty cards in edit mode
        var pageSize = this.row * this.col;
        var numberToAppend = this.cardList.length % pageSize + pageSize;
        var appendList = []
        for (var i = 0; i < numberToAppend; i++) {
          appendList.push({empty: true})
        }
        return Utils.arrangeCards(this.cardList.concat(appendList), this.row, this.col);
      } else {
        return Utils.arrangeCards(this.cardList, this.row, this.col);
      }
    }
  },
  created() {
    if (this.from == 'resource') {
      console.log('Loading resource')
      this.cardList = db.getCardsOfRecourceCategory(this.uuid);
    } else {
      this.cardList = db.getCardsOfClassware(this.uuid);
    }

    EventBus.$on('ALL_CARDS_LOADED', () => {

    });

    if (this.from == 'resource') {
      EventBus.$on('RESOURCE_NEW_CATEGORY_ADDED', (doc) => {
        if (this.uuid == 'all') {
          this.cardList.push(doc);
        }
      });

      EventBus.$on('RESOURCE_NEW_CARD_ADDED', (doc) => {
        console.log(doc);
        console.log('uuid: ' + this.uuid);
        if (this.uuid == doc.category) {
          this.cardList.push(doc);
          console.log('doc pushed');
        }
      });
    } else {
      EventBus.$on('DISPLAY_DRAWER_UPDATED', (uuid) => {
        if (uuid == this.uuid) {
          this.cardList = db.getCardsOfClassware(this.uuid);
          console.log('updated list');
          console.log(this.cardList);
        }
      });
      EventBus.$on('DISPLAY_CATEGORY_DELETED', (item) => {
        console.log('deleting, current drawer id: ' + this.uuid);
        if (item.parent == 'root' && this.uuid == 'all' || item.parent == this.uuid) {
          window.setTimeout(() => {
            // Wait for database update and then reload... Haven't found a callback for this...
            this.cardList = db.getCardsOfClassware(this.uuid);
          }, 500);
        }
      });
    }
  },
  mounted() {
    this.createSwiper();

    // // Draggable - Sortable
    var that = this;
    // TODO: Use id, not class
    var el = this.$el.querySelector("#card-group-0");
    if (this.editMode && this.uuid != 'all') {
      Sortable.create(el, {
        fallbackOnBody: true,
        animation: 150,

        store: {
          get: function (sortable) {
            // var order = localStorage.getItem(sortable.options.group.name);
            return [];
          },
          set: function (sortable) {
            var order = sortable.toArray();
            console.log(order);
            // localStorage.setItem(sortable.options.group.name, order.join('|'));
          }
        },

        setData: function (/** DataTransfer */dataTransfer, /** HTMLElement*/dragEl) {
          // dataTransfer.setData('Text', dragEl.textContent); // `dataTransfer` object of HTML5 DragEvent
          console.log('setData')
        },
      });
    }
  }
}
</script>

<style scoped>
/* Drawer Layer */
.drawer {
  max-width: 885px; /* actual img width */
  max-height: 810px; /* actual img height */
  /**height: 810px; !* actual img height - IE7 *!*/
  /*background-image: url("../../img/child_incat_woodbg.png");*/
  background-size: cover;
  background-position: center;
  position:absolute;
  left:-10%;
  top:20%;
  right: 0;
  /*z-index: 100;*/
}

.drawer.with-background {
  background-image: url("../../static/img/child_incat_woodbg.png");
  min-height: 65%;
}
/*.drawer:after {*/
/*content: " ";*/
/*display: block;*/
/*width: 100%;*/
/*padding-top: 91.52%; !* 885:810 ratio *!*/
/*}*/
.drawer-content {
  margin-top: 2.72%;
  margin-left:10%;
  margin-bottom: 4.57%;
  margin-right: 0%;
  padding-top: 2.72%;
  overflow: visible;
  z-index: 0;
}

.drawer-wrapper {
  z-index: 0;
}

.drawer-back {
  position: absolute;
  content: url("../../static/img/child_incat_backbutton.png");
  height: 16.33%;
  top: -13.61%;
  left: 14.88%;
}

.card-group {
  display: flex;
  width: 100%;
  height: 100%;
  margin: 0px;
  padding: 0px;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
}
.card-group-item {
  width:50%;
  margin: 0px;
  padding: 0px;
}

.ghost-card {
  background-color: black;
}

.dragging-card {
  background-color: red;
}

/* Animations */
.slide-enter-active {
  transition: all .5s ease;
  overflow: hidden;
}
.slide-leave-active {
  /*transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);*/
  transition: all .5s ease;
  overflow: hidden;
}
.slide-enter, .slide-leave-to
/* .slide-fade-leave-active for <2.1.8 */ {
  transform: translateX(100%);
}
</style>

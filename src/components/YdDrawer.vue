<template>
<transition name="slide">
  <div class="drawer" :class="{'with-background': !root}">
    <div class="drawer-back" @click="backClicked()" v-if="!root"></div>
    <div class="swiper-container drawer-content">
      <div class="swiper-wrapper drawer-wrapper">

        <!-- Slides -->
        <div class="swiper-slide" v-for="(page, index) in pagedCards" :key="index">
          <div class="card-group" :ref="'group' + index" :id="'card-group-' + index">
            <div class="card-group-item" v-for="(card , index) in page" :key="card.uuid" :data-id="card.uuid">
              <yd-card :classware="card" :edit-mode="editMode" :from="from"></yd-card>
            </div>
          </div>
        </div>

        <!--<div class="swiper-slide card-group-item" v-for="card in cardList" :key="card.uuid" :data-id="card.uuid">
          <yd-card :classware="card" :edit-mode="editMode" :key="card.path" :from="from"></yd-card>
        </div>-->

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
import PickedCards from '../PickedCards'
import uuidv4 from 'uuid/v4'

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
    editMode: function(val, oldVal) {
      for (let i = 0; i < this.sortables.length; i++) {
        this.sortables[i].option("disabled", !val)
      }
    },
  },
  methods: {
    backClicked: function() {
      if (this.from == "resource") {
        if (this.editMode && PickedCards.hasItem()) {
            Utils.getF7().alert("Please add chosen items before navigating to another folder", "Forbidden")
          } else {
            EventBus.$emit(Events.RESOURCE_DRAWER_CLOSE, this.uuid);
          }
      } else {
        EventBus.$emit(Events.DISPLAY_DRAWER_CLOSE, this.uuid);
      }
    },
    createSwiper: function() {
      var swiperContainerElement = this.$el.getElementsByClassName('swiper-container')[0];
      // Swiper
      this.mySwiper = new Swiper (swiperContainerElement);
    },
    createDraggable: function() {
      // Draggable - Sortable
      var that = this;
      var els = this.$el.getElementsByClassName('card-group');

      var sortables = []

      var logElementsByDataId = function(elements) {
        var tmp = []
        for(var i = 0; i < elements.length; i++) {
          if (elements[i].attributes['data-id']) {
            tmp.push(elements[i].attributes['data-id'].value)
          } else {
            tmp.push(`element ${i} does not have data-id`)
          }
        }
        console.log(tmp)
      }

      var processScroll = function(fromGroupId, toGroupId) {
        if (toGroupId >= sortables.length || toGroupId < 0) {
          console.log('Warning: Scroll will not happen since it is at the boundary')
          return
        }
        console.log('from ' + fromGroupId + ': ' + sortables[fromGroupId].toArray())
        console.log('to ' + toGroupId + ' :' + sortables[toGroupId].toArray())

        console.log('dragged: ' + that.draggedItem.attributes['data-id'].value)
        console.log(els[fromGroupId].childNodes[0].attributes['data-id'].value)
        var fromElGroupFiltered = _.filter(els[fromGroupId].childNodes, function(o){
          var dataAttr = o.attributes['data-id']
          if (!dataAttr) {
            return true
          } else {
            return dataAttr !== that.draggedItem.attributes['data-id']
          }
        })
        var toElGroupFiltered = _.filter(els[toGroupId].childNodes, function(o){
          var dataAttr = o.attributes['data-id']
          if (!dataAttr) {
            return true
          } else {
            return dataAttr.value !== that.draggedItem.attributes['data-id']
          }
        })
        console.log('========filtered======')
        console.log(fromElGroupFiltered)
        console.log(toElGroupFiltered)
        logElementsByDataId(fromElGroupFiltered)
        logElementsByDataId(toElGroupFiltered)

        if (toGroupId < fromGroupId) {
          console.log('toGroupId < fromGroupId')
          let oldNode = els[toGroupId].removeChild(toElGroupFiltered[toElGroupFiltered.length -1])
          console.log('removed: ' + oldNode.attributes['data-id'].value)
          els[fromGroupId].insertBefore(oldNode, fromElGroupFiltered[0])
          logElementsByDataId(els[fromGroupId].childNodes)
        } else {
          console.log('else')
          let oldNode = els[toGroupId].removeChild(toElGroupFiltered[0])
          console.log('removed: ' + oldNode.attributes['data-id'].value)
          els[fromGroupId].appendChild(oldNode)
          logElementsByDataId(els[fromGroupId].childNodes)
        }
      }

      var delayedScrollNext = _.throttle((from, to) => {
        console.log('before scroll to next: ' + this.mySwiper.activeIndex)
        processScroll(from, to)
        this.mySwiper.slideNext()
        console.log('after scroll to next: ' + this.mySwiper.activeIndex)
      }, 1000, { 'trailing': false });

      var delayedScrollPrev = _.throttle((from, to) => {
        processScroll(from, to)
        this.mySwiper.slidePrev()
      }, 1000, { 'trailing': false });

      for(var i=0; i< els.length; i++) {
        var el = els[i]
        console.log('group: ' + el.id)
        var sorta = Sortable.create(el, {
          group: 'cards',
          sort: true,
          delay: 500,
          animation: 100,
          draggable: ".card-group-item",
          dragClass: "dragging-card",
          ghostClass: "ghost-card",
          disabled: true,
          preventOnFilter: true,
          fallbackOnBody: true,
          scrollFn: function(offsetX, offsetY, originalEvent) {
            console.log(this.el.id + ': scrollFn X: ' + originalEvent.clientX + ' Y: ' + originalEvent.clientY)
            if (originalEvent.clientX < 30) {
              console.log(this.el.id + ": calling prev");
              var from = parseInt(this.el.id.slice(11))
              delayedScrollPrev(from, from - 1);
            } else if (originalEvent.clientX > window.innerWidth - 30){
              console.log(this.el.id + ": calling next");
              var from = parseInt(this.el.id.slice(11))
              delayedScrollNext(from, from + 1);
            }
          },
          scrollSensitivity: 30, // px, how near the mouse must be to an edge to start scrolling.
          scrollSpeed: 10,
          store: {
            get: function (sortable) {
              return [];
            },
            set: function (sortable) {
              var order = sortable.toArray();
              console.log(sortable.el.id + ": " + order);
            }
          },
          onMove: function(event, originalEvent) {
            console.log(this.el.id + ': onmove X: ' + originalEvent.clientX + ' Y: ' + originalEvent.clientY)
          },
          onAdd: function() {
            console.log(this.el.id + ': onAdd')
          },
          onRemove: function() {
            console.log(this.el.id + ': onRemove')
          },
          onStart: function(evt) {
            console.log(this.el.id + ': onStart ')
            that.mySwiper.lockSwipes()
            that.draggedItem = evt.item
          },
          onEnd: function() {
            console.log(this.el.id + ': onEnd')
            that.mySwiper.unlockSwipes()
            that.draggedItem = null
            for (var j = 0; j < els.length; j++) {
              logElementsByDataId(els[j].childNodes)
            }
          }
        });
        sortables.push(sorta)
      }
      this.sortables = sortables
    }

  },
  computed: {
    pagedCards: function() {
      if (this.from != 'resource' && this.editMode && this.uuid != 'all') {
        // Append placeholder cards in edit mode
        var pageSize = this.row * this.col;
        var lastPageSize = this.cardList.length % pageSize
        var numberToAppend = lastPageSize > 0 ? pageSize - lastPageSize + pageSize : pageSize;
        var appendList = []
        for (var i = 0; i < numberToAppend; i++) {
          appendList.push({type: 'placeholder', order: i + this.cardList.length, uuid: uuidv4(), parent: this.uuid})
        }
        return Utils.arrangeCards(this.cardList.concat(appendList), this.row, this.col);
      } else {
        return Utils.arrangeCards(this.cardList, this.row, this.col);
      }
    }
  },
  updated() {
    this.mySwiper.update(true)
  },
  created() {
    if (this.from == 'resource') {
      this.cardList = db.getCardsOfRecourceCategory(this.uuid);
    } else {
      this.cardList = db.getCardsOfClassware(this.uuid);
    }
    // console.log(this.cardList)

    if (this.from == 'resource') {
      EventBus.$on(Events.RESOURCE_NEW_CATEGORY_ADDED, (doc) => {
        if (this.uuid == 'all') {
          // this.cardList.push(doc);
          // Reload cardList and then move swiper to last page
          // TODO: wait 200ms for db update... need to find actual event for this..
          window.setTimeout(() => {
            this.cardList = db.getCardsOfRecourceCategory(this.uuid);
          }, 200)
        }
      });

      EventBus.$on(Events.RESOURCE_NEW_CARD_ADDED, (doc) => {
        if (this.uuid == doc.category) {
          // this.cardList.push(doc);
          // Reload cardList and then move swiper to last page
          // TODO: wait 200ms for db update... need to find actual event for this..
          window.setTimeout(() => {
            this.cardList = db.getCardsOfRecourceCategory(this.uuid);
          }, 200)
        }
      });

      EventBus.$on(Events.RESOURCE_ITEM_DELETED, (uuid) => {
        if (this.uuid == uuid) {
          // Reload cardList and then move swiper to last page
          // TODO: wait 200ms for db update... need to find actual event for this..
          window.setTimeout(() => {
            this.cardList = db.getCardsOfRecourceCategory(this.uuid);
          }, 200)
        }
      })
    } else {
      EventBus.$on(Events.DISPLAY_DRAWER_UPDATED, (uuid) => {
        if (uuid == this.uuid) {
          this.cardList = db.getCardsOfClassware(this.uuid);
          console.log('updated list');
          console.log(this.cardList);
        }
      });

      EventBus.$on(Events.DISPLAY_CATEGORY_DELETED, (item) => {
        console.log('deleting, current drawer id: ' + this.uuid);
        if (item.parent == 'root' && this.uuid == 'all' || item.parent == this.uuid) {
          window.setTimeout(() => {
            // Wait for database update and then reload... Haven't found a callback for this...
            this.cardList = db.getCardsOfClassware(this.uuid);
          }, 200);
        }
      });

      EventBus.$on(Events.ADD_CARDS_FROM_RESOURCE, (object) => {
        console.log('drawerId: ' + object.drawerId)
        if (this.uuid !== object.drawerId) {
          return
        }
        console.log('adding cards: ' + object.list)
        let added = []
        for (let i = 0; i < object.list.length; i ++) {
          let newClasswareItem = {}
          newClasswareItem.uuid = uuidv4()
          newClasswareItem.type = 'card'
          newClasswareItem.content = object.list[i]
          newClasswareItem.parent = object.drawerId
          newClasswareItem.animation = 'enlarge' // default
          newClasswareItem.order = parseInt(object.order) + i
          newClasswareItem.mute = false
          added.push(newClasswareItem)
        }
        if (object.order >= this.cardList.length) {
          // Fill in placeholder cards
          console.log(`filling gap between ${this.cardList.length} and ${object.order}`)
          for (let i = this.cardList.length; i < object.order; i++) {
            let placeholder = {}
            placeholder.uuid = uuidv4()
            placeholder.type = 'placeholder'
            placeholder.parent = object.drawerId
            placeholder.order = i
            added.push(placeholder)
          }
          console.log('Processed: ' + JSON.stringify(added))
          db.getClasswareCollection().insert(added)
        } else {
          console.log('requesting position in the middle of the list')
          let emptySlots = db.getClasswareCollection().chain().where((item) => {
            return item.parent === object.drawerId 
                   && item.order >= object.order
                   && item.order < object.order + object.list.length
                   && item.type == 'placeholder'
          }).simplesort('order').data()
          console.log('emptySlots')
          console.log(emptySlots)
          for (let i = 0; i < emptySlots.length; i++) {
            // use new card's info to override everything except for order
            let o = emptySlots[i].order
            let updatedDoc = _.assign(emptySlots[i], added.pop())
            console.log('im here')
            updatedDoc.order = o
            console.log(updatedDoc)
            db.getClasswareCollection().update(updatedDoc)
          }
          if (added.length > 0) {
            console.log('remaining inserts')
            // reset order
            for (let i = 0; i < added.length; i++) {
              added[i].order = this.cardList.length + i
            }
            console.log(added)
            db.getClasswareCollection().insert(added)
          }
        }

        // Done. Wait db written and update cardList
        window.setTimeout(() => {
          this.cardList = db.getCardsOfClassware(this.uuid)
        }, 200)
        
      })
    }
  },
  mounted() {
    this.createSwiper();
    this.createDraggable();
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

<template>
<transition name="slide">
<div class="drawer-all">
  <div :class="$t('message.drawer_back')" @click="backClicked()" v-if="!root"></div>
  <div class="drawer" :class="{'with-background': !root}">
    <div class="swiper-container drawer-content">
      <div class="swiper-wrapper drawer-wrapper">

        <!-- Slides -->
        <div class="swiper-slide" v-for="(page, index) in pagedCards" :key="index">
          <div class="card-group" :ref="'group' + index" :id="'card-group-' + index">
            <div class="card-group-item" :class="'card-group-item-' + row" v-for="(card , index) in page" :key="card.uuid" :data-id="card.uuid">
              <yd-card :classware="card" :edit-mode="editMode" :from="from" v-on:pick="pickFromResource"></yd-card>
            </div>
          </div>
        </div>

        <!--<div class="swiper-slide card-group-item" v-for="card in cardList" :key="card.uuid" :data-id="card.uuid">
          <yd-card :classware="card" :edit-mode="editMode" :key="card.path" :from="from"></yd-card>
        </div>-->

      </div>
    </div>
  </div>
</div>
</transition>
</template>

<script>
import YdCard from './YdCard.vue'
import { EventBus, Events } from '../EventBus.js'
import Swiper from 'swiper'
import Sortable from 'sortablejs'
import _ from 'lodash'
import Utils from '../utils.js'
import db from '../db.js'
import PickedCards from '../PickedCards'
import uuidv4 from 'uuid/v4'

export default {
  props: ['root', 'editMode', 'uuid', 'from'],
  components: { YdCard },
  data() {
    return {
      cardList: [],
      row: 2,
      col: 2
    }
  },
  watch: {
    isCardPlaying: function(val, oldVal) {
      if (!this.mySwiper) {
        return
      }
      if (val) {
        this.mySwiper.lockSwipes()
      } else {
        this.mySwiper.unlockSwipes()
      }
    }
  },
  methods: {
    pickFromResource: function(holder) {
      // Clean any previous listener
      EventBus.$off(Events.ADD_CARDS_FROM_RESOURCE)
      EventBus.$on(Events.ADD_CARDS_FROM_RESOURCE, this.addFromResource)
      this.$router.push('resource/pick?request=' + holder.placeholderId + '&drawerId=' + this.uuid + '&order=' + holder.placeholderOrder)
    },
    addFromResource: function(object) {
      let added = []
      let folders = [] // Keep track of this, add all cards belong to folder
      for (let i = 0; i < object.list.length; i++) {
        let resContent = db.getCardByUuid(object.list[i])
        let newClasswareItem = {}
        newClasswareItem.uuid = uuidv4()
        newClasswareItem.content = object.list[i]
        newClasswareItem.parent = object.drawerId
        newClasswareItem.order = parseInt(object.order) + i

        if (resContent.isCategory) {
          newClasswareItem.type = 'folder'
          newClasswareItem.cover = resContent.cover
          newClasswareItem.name = resContent.name
          folders.push(newClasswareItem)
        } else {
          newClasswareItem.type = 'card'
          newClasswareItem.animation = 'enlarge' // default
          newClasswareItem.mute = false
        }
        added.push(newClasswareItem)
      }
      if (object.order >= this.cardList.length) {
        // Fill in placeholder cards
        for (let i = this.cardList.length; i < object.order; i++) {
          let placeholder = {}
          placeholder.uuid = uuidv4()
          placeholder.type = 'placeholder'
          placeholder.parent = object.drawerId
          placeholder.order = i
          added.push(placeholder)
        }
        db.getClasswareCollection().insert(added)
      } else {
        let emptySlots = db.getClasswareCollection().chain().where((item) => {
          return item.parent === object.drawerId && item.order >= object.order && item.order < object.order + object.list.length && item.type === 'placeholder'
        }).simplesort('order').data()
        for (let i = 0; i < emptySlots.length; i++) {
          // use new card's info to override everything except for order
          let o = emptySlots[i].order
          let updatedDoc = _.assign(emptySlots[i], added.pop())
          updatedDoc.order = o
          db.getClasswareCollection().update(updatedDoc)
        }
        if (added.length > 0) {
          // reset order
          for (let i = 0; i < added.length; i++) {
            added[i].order = this.cardList.length + i
          }
          db.getClasswareCollection().insert(added)
        }
      }

      // Add subcontent if there is any
      folders.forEach((folder) => {
        db.addFolderContentToCourseware(folder)
      })

      // Done. Wait db written and update cardList
      window.setTimeout(() => {
        this.cardList = db.getCardsOfClassware(this.uuid)
      }, 200)
      EventBus.$off(Events.ADD_CARDS_FROM_RESOURCE)
    },
    backClicked: _.throttle(function() {
      if (this.from === 'resource') {
        if (this.editMode && PickedCards.hasItem()) {
          Utils.getF7().alert(this.$t('message.cannot_navi_chosen_items'), this.$t('message.forbidden'))
        } else {
          EventBus.$emit(Events.RESOURCE_DRAWER_CLOSE, this.uuid)
        }
      } else {
        if (!this.$store.state.isCardPlaying) {
          EventBus.$emit(Events.DISPLAY_DRAWER_CLOSE, this.uuid)
        }
      }
    }, 1000, { 'trailing': false }),
    createSwiper: function() {
      var swiperContainerElement = this.$el.getElementsByClassName('swiper-container')[0]
      // Swiper
      this.mySwiper = new Swiper(swiperContainerElement)
    },
    createDraggable: function() {
      // Draggable - Sortable
      var that = this
      var els = this.$el.getElementsByClassName('card-group')

      var sortables = []

      var logElementsByDataId = function(elements) {
        var tmp = []
        for (var i = 0; i < elements.length; i++) {
          if (elements[i].attributes['data-id']) {
            tmp.push(elements[i].attributes['data-id'].value)
          } else {
            tmp.push(`element ${i} does not have data-id`)
          }
        }
        return tmp
      }

      var processScroll = function(fromGroupId, toGroupId) {
        if (toGroupId >= sortables.length || toGroupId < 0) {
          console.log('Warning: Scroll will not happen since it is at the boundary')
          return
        }
        var fromElGroupFiltered = _.filter(els[fromGroupId].childNodes, function(o) {
          var dataAttr = o.attributes['data-id']
          if (!dataAttr) {
            return true
          } else {
            return dataAttr !== that.draggedItem.attributes['data-id']
          }
        })
        var toElGroupFiltered = _.filter(els[toGroupId].childNodes, function(o) {
          var dataAttr = o.attributes['data-id']
          if (!dataAttr) {
            return true
          } else {
            return dataAttr.value !== that.draggedItem.attributes['data-id']
          }
        })
        logElementsByDataId(fromElGroupFiltered)
        logElementsByDataId(toElGroupFiltered)

        if (toGroupId < fromGroupId) {
          let oldNode = els[toGroupId].removeChild(toElGroupFiltered[toElGroupFiltered.length - 1])
          els[fromGroupId].insertBefore(oldNode, fromElGroupFiltered[0])
          logElementsByDataId(els[fromGroupId].childNodes)
        } else {
          let oldNode = els[toGroupId].removeChild(toElGroupFiltered[0])
          els[fromGroupId].appendChild(oldNode)
          logElementsByDataId(els[fromGroupId].childNodes)
        }
      }

      var delayedScrollNext = _.throttle((from, to) => {
        processScroll(from, to)
        this.mySwiper.slideNext()
      }, 1000, { 'trailing': false })

      var delayedScrollPrev = _.throttle((from, to) => {
        processScroll(from, to)
        this.mySwiper.slidePrev()
      }, 1000, { 'trailing': false })

      for (var i = 0; i < els.length; i++) {
        var el = els[i]
        var sorta = Sortable.create(el, {
          group: 'cards',
          sort: true,
          delay: 500,
          animation: 100,
          draggable: '.card-group-item',
          dragClass: 'dragging-card',
          ghostClass: 'ghost-card',
          disabled: that.draggableDisabled,
          preventOnFilter: true,
          fallbackOnBody: true,
          scrollFn: function(offsetX, offsetY, originalEvent) {
            var from
            if (originalEvent.clientX < 30) {
              from = parseInt(this.el.id.slice(11))
              delayedScrollPrev(from, from - 1)
            } else if (originalEvent.clientX > window.innerWidth - 30) {
              from = parseInt(this.el.id.slice(11))
              delayedScrollNext(from, from + 1)
            }
          },
          scrollSensitivity: 30, // px, how near the mouse must be to an edge to start scrolling.
          scrollSpeed: 10,
          store: {
            get: function (sortable) {
              return []
            },
            /* eslint-disable no-unused-vars */
            set: function (sortable) {
              var order = sortable.toArray()
            }
          },
          onMove: function(event, originalEvent) {
            // console.log(this.el.id + ': onmove X: ' + originalEvent.clientX + ' Y: ' + originalEvent.clientY)
          },
          onAdd: function() {
            // console.log(this.el.id + ': onAdd')
          },
          onRemove: function() {
            // console.log(this.el.id + ': onRemove')
          },
          onStart: function(evt) {
            // console.log(this.el.id + ': onStart ')
            that.mySwiper.disableTouchControl()
            that.draggedItem = evt.item
          },
          onEnd: function() {
            that.mySwiper.enableTouchControl()
            that.draggedItem = null
            var dataIdByGroup = []
            for (var j = 0; j < els.length; j++) {
              dataIdByGroup.push(logElementsByDataId(els[j].childNodes))
            }
            // TODO: Extract to a method
            // Step 1: Flatten result array as reference. This includes dynamically added placeholders
            var flattened = _.flatten(dataIdByGroup)
            // Step 2: Sort cardList with refence array
            var sortByRef = function(target, refs) {
              var result = []
              for (let i = 0; i < refs.length; i++) {
                let ref = refs[i]
                let f = _.find(target, function(o) {
                  return o.uuid === ref
                })
                if (f) {
                  result.push(f)
                } else {
                  throw new Error(`uuid : ${ref} not found in target list`)
                }
              }
              return result
            }
            var afterDragging = sortByRef(that.appendedCards, flattened)
            // Step 3: Remove trailing placeholder cards and update db
            var trailingPlaceholder = true
            for (let i = afterDragging.length - 1; i >= 0; i--) {
              if (trailingPlaceholder && afterDragging[i].type === 'placeholder') {
                let docToRemove = db.getClasswareItemByUuid(afterDragging[i].uuid)
                if (docToRemove) {
                  db.getClasswareCollection().remove(docToRemove)
                }
                continue
              } else {
                trailingPlaceholder = false
                // var originalOrder = afterDragging[i].order
                let docToReorder = db.getClasswareItemByUuid(afterDragging[i].uuid)
                if (docToReorder) {
                  docToReorder.order = i
                  db.getClasswareCollection().update(docToReorder)
                } else {
                  afterDragging[i].order = i
                  db.getClasswareCollection().insert(afterDragging[i])
                }
              }
            }
            // Sort done. Update cardlist
            window.setTimeout(() => {
              that.cardList = db.getCardsOfClassware(that.uuid)
            }, 200)
          }
        })
        sortables.push(sorta)
      }
      this.sortables = sortables
    },
    initList: function() {
      var grid = db.getDefaultGridSize()
      if (this.from === 'resource') {
        this.cardList = db.getCardsOfRecourceCategory(this.uuid)
        this.col = grid.col
        this.row = grid.row
      } else {
        this.cardList = db.getCardsOfClassware(this.uuid)
        if (this.uuid === 'all') {
          this.col = grid.col
          this.row = grid.row
        } else {
          var classware = db.getClasswareItemByUuid(this.uuid)
          var col = classware.col
          var row = classware.row
          if (!col || !row) {
            this.col = grid.col
            this.row = grid.row
          } else {
            this.col = col
            this.row = row
          }
        }
      }
    }
  },
  computed: {
    isCardPlaying: function() {
      return this.$store.state.isCardPlaying
    },
    appendedCards: function() {
      if (this.from !== 'resource' && this.editMode && this.uuid !== 'all') {
        // Append placeholder cards in edit mode
        var pageSize = this.row * this.col
        var lastPageSize = this.cardList.length % pageSize
        var numberToAppend = lastPageSize > 0 ? pageSize - lastPageSize + pageSize : pageSize
        var appendList = []
        for (var i = 0; i < numberToAppend; i++) {
          appendList.push({type: 'placeholder', order: i + this.cardList.length, uuid: uuidv4(), parent: this.uuid})
        }
        return this.cardList.concat(appendList)
      } else {
        return this.cardList
      }
    },
    pagedCards: function() {
      return Utils.arrangeCards(this.appendedCards, this.row, this.col)
    },
    draggableDisabled: function() {
      return !this.editMode || this.uuid === 'all' || this.from === 'resource'
    }
  },
  updated() {
    this.mySwiper.update(true)
  },
  created() {
    this.initList()
    // console.log(this.cardList)

    if (this.from === 'resource') {
      EventBus.$on(Events.RESOURCE_NEW_CATEGORY_ADDED, (doc) => {
        if (this.uuid === 'all') {
          // this.cardList.push(doc);
          // Reload cardList and then move swiper to last page
          // TODO: wait 200ms for db update... need to find actual event for this..
          window.setTimeout(() => {
            this.cardList = db.getCardsOfRecourceCategory(this.uuid)
          }, 200)
        }
      })

      EventBus.$on(Events.RESOURCE_NEW_CARD_ADDED, (doc) => {
        if (this.uuid === doc.category) {
          // this.cardList.push(doc);
          // Reload cardList and then move swiper to last page
          // TODO: wait 200ms for db update... need to find actual event for this..
          window.setTimeout(() => {
            this.cardList = db.getCardsOfRecourceCategory(this.uuid)
          }, 200)
        }
      })

      EventBus.$on(Events.RESOURCE_ITEM_DELETED, (uuid) => {
        if (this.uuid === uuid) {
          // Reload cardList and then move swiper to last page
          // TODO: wait 200ms for db update... need to find actual event for this..
          window.setTimeout(() => {
            this.cardList = db.getCardsOfRecourceCategory(this.uuid)
          }, 200)
        }
      })
    } else {
      EventBus.$on(Events.DISPLAY_DRAWER_UPDATED, (uuid) => {
        if (uuid === this.uuid) {
          // this.cardList = db.getCardsOfClassware(this.uuid);
          this.initList()
          // console.log(this.cardList);
        }
      })

      EventBus.$on(Events.DISPLAY_CATEGORY_DELETED, (item) => {
        console.log('deleting, current drawer id: ' + this.uuid)
        if ((item.parent === 'root' && this.uuid === 'all') || item.parent === this.uuid) {
          window.setTimeout(() => {
            // Wait for database update and then reload... Haven't found a callback for this...
            this.cardList = db.getCardsOfClassware(this.uuid)
          }, 200)
        }
      })
    }
  },
  mounted() {
    this.createSwiper()
    // // this.createDraggable()
  }
}
</script>

<style scoped>
/* Drawer Layer */
.drawer-all {
  position: absolute;
  top:0px;
  left:0px;
  right:0px;
  bottom:0px;
}
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
  min-height: 68%;
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
  height: 10%;
  top: 12%;
  left: 7%;
}

.drawer-back-en {
  position: absolute;
  content: url("../../static/img/child_incat_backbutton_en.png");
  height: 10%;
  top: 12%;
  left: 7%;
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
.card-group-item-1 {
  width: 100%;
  margin: 0px;
  padding: 0px;
}
.card-group-item-2 {
  width:50%;
  margin: 0px;
  padding: 0px;
}
.card-group-item-3 {
  width:33%;
  margin: 0px;
  padding: 0px;
}
/* for debug */
/*.ghost-card {
  background-color: black;
}

.dragging-card {
  background-color: red;
}*/

/* Animations */
.slide-enter-active {
  transition: all .5s ease;
  overflow: hidden;
}
.slide-leave-active {
  transition: all .5s ease;
  overflow: hidden;
}
.slide-enter, .slide-leave-to {
  transform: translateX(100%);
}
</style>

<template>
<transition name="slide">
  <div class="drawer" :class="{'with-background': !root}">
    <div class="drawer-back" @click="backClicked()" v-if="!root"></div>
    <div class="swiper-container drawer-content">
      <div class="swiper-wrapper">
        <!-- Slides -->
        <div class="swiper-slide" v-for="(page, index) in pagedCards" :key="index">
          <div class="card-group">
            <div class="card-group-item" v-for="(card , index) in page" :key="index">
              <yd-card :classware="card" :edit-mode="editMode"></yd-card>
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
import CardProvider from '../CardProvider'
import { EventBus } from '../EventBus.js'
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
  props: ['path', 'root', 'editMode', 'uuid', 'row', 'col'],
  components: { YdCard },
  data() {
    return {
      // cardList: [],
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
      EventBus.$emit('DrawerBackClicked', this.uuid);
    },
    createSwiper: function() {
      var swiperContainerElement = this.$el.getElementsByClassName('swiper-container')[0];
      // Swiper
      this.mySwiper = new Swiper (swiperContainerElement);
    },
  },
  computed: {
    sortedCards: function() {
      return sortCards(this.cardList, this.row, this.col);
    },
    pagedCards: function() {
      var cardList = db.getCardsOfClassware(this.uuid);
      return Utils.arrangeCards(cardList, this.row, this.col);
    }
  },
  created() {
    EventBus.$on('ALL_CARDS_LOADED', () => {
      // this.cardList = CardProvider.getCardsByPath(this.path);
      // this.createSwiper();
    });
    // this.cardList = db.getCardsOfClassware(this.uuid);
    // console.log(this.cardList);
  },
  mounted() {
    this.createSwiper();
    // window.swiper = this.mySwiper;

    // // Draggable - Sortable
    // var that = this;
    // // TODO: Use id, not class
    // var el = this.$el.getElementsByClassName('card-group')[0];
    // var delayedScrollNext = _.throttle(this.mySwiper.slideNext, 1000, { 'trailing': false });
    // var delayedScrollPrev = _.throttle(this.mySwiper.slidePrev, 1000, { 'trailing': false });

    // this.sortable = Sortable.create(el, {
    //   group: 'cards',
    //   sort: true,
    //   delay: 500,
    //   animation: 100,
    //   draggable: "x.card-group-item", /* remove x to enable swipe */
    //   dragClass: "dragging-card",
    //   ghostClass: "ghost-card",
    //   disabled: false,
    //   preventOnFilter: true,
    //   fallbackOnBody: true,
    //   scrollFn: function(offsetX, offsetY, originalEvent) { 
    //     if (offsetX < 0) {
    //       delayedScrollPrev();
    //     } else if (offsetX > 0){
    //       console.log("calling");
    //       delayedScrollNext();
    //     }
    //   },
    //   scrollSensitivity: 30, // px, how near the mouse must be to an edge to start scrolling.
	  //   scrollSpeed: 10,
    // });
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
  z-index: 100;
}

.drawer.with-background {
  background-image: url("../../static/img/child_incat_woodbg.png");
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
  /*position: absolute;*/
  padding-top: 2.72%;
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
}
.slide-leave-active {
  /*transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);*/
  transition: all .5s ease;
}
.slide-enter, .slide-leave-to
/* .slide-fade-leave-active for <2.1.8 */ {
  transform: translateX(100%);
}
</style>

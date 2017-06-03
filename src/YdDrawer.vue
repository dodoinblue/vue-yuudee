<template>
<!--<div class="button button-block button-calm" ng-click="testClick()">Click Me</div>-->
<!--<div ng-class="{'drawer animated slideInRight': clicked}" ng-show="clicked">-->
<div class="drawer with-background animated slideInRight">
  <div class="drawer-back" @click="backClicked()"></div>
  <f7-swiper class="drawer-content">
    <f7-swiper-slide class="swiper-slide full-height align-center-vertical" v-for="page in cards">
      <div class="row" v-for="r in page">
        <div class="col-50 no-padding" v-for="card in r">
          <yd-card :card="card"></yd-card>
        </div>
      </div>
    </f7-swiper-slide>
  </f7-swiper>
</div>
</template>

<script>
import YdCard from './YdCard.vue'
import Vue from 'vue'

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
  props: [],
  components: { YdCard },
  data() {
    return {
      path: '',
      cards: [ [ ["1", "2"], ["3", "4"] ], [ ["5"] ] ],
    }
  },
  methods: {
    backClicked: function() {
      console.log("back clicked");
    }
  },
  computed: {
    isBase() {

    },
    isLoaded() {

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
}

.drawer.with-background {
  background-image: url("../static/img/child_incat_woodbg.png");
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
  content: url("../static/img/child_incat_backbutton.png");
  height: 16.33%;
  top: -13.61%;
  left: 14.88%;
}
</style>

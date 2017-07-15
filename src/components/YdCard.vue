<template>
<div class="yd-card" :class="{'on-top': onTop}" @click="onCardClick()">
  <div class="card-frame">
    <img :src="card_bg_image">
  </div>
  <div class="card-content">
    <img :src="content_image">
  </div>
  <div class="card-text"><div>{{card.name}}</div></div>
  <div class="card-edit-button" v-if="editMode" @click.stop="onCardEditClick"></div>
</div>
</template>

<script>
import { EventBus, Events } from '../EventBus.js'
import { TweenLite } from "gsap"
import _ from 'lodash'
import db from '../db.js'
import Utils from '../utils'

/*
 * Calculate the parameters to animate a card to the center of screen.
 * win: window obj contains current windows's width and height
 * rect: element's rect from vm.$el.getBoundingClientRect()
 */
var calcToCenterAnimParams = function(win, rect) {
  var scale = win.width * 0.85 / rect.width;
  var winCenterLeft = win.width / 2;
  var winCenterTop = win.height / 2;
  var cardCenterLeft = rect.left + rect.width / 2;
  var cardCenterTop = rect.top + rect.height / 2;
  var xTrans = winCenterLeft - cardCenterLeft;
  var yTrans = winCenterTop - cardCenterTop;

  return {
    scaleX: scale,
    scaleY: scale,
    x: xTrans,
    y: yTrans
  }
}

var isPlaying = false;
var playAnimation = function(context) {
  if (isPlaying) return;
  console.log(context.classware);

  var el = context.$el;
  var oldStyle = {
    scaleX: 1,
    scaleY: 1,
    x: 0,
    y: 0
  }
  var win = {width: window.innerWidth, height: window.innerHeight};
  var animationParams = calcToCenterAnimParams(win, el.getBoundingClientRect());

  // Start Playing
  isPlaying = true;
  context.onTop = true;
  Utils.animationChain(el, 1, animationParams).then(function(){
    // Start slideshow
    context.slideshow = window.setInterval(() => {
      if (context.currentImageIndex == context.card.images.length - 1) {
        context.currentImageIndex = 0;
      } else {
        context.currentImageIndex ++;
      }
    }, 500);

    // Start playing sound
    // TODO: play all if there are more
    Utils.playAudioChain(context.card.audios[0]);

    // Swing if set to or wait
    if (context.classware.animation == 'rotate') {
      return Utils.animationChain(el, 0.5, {rotation: 20}).then(function(){
        return Utils.animationChain(el, 1, {rotation: -20});
      }).then(function(){
        return Utils.animationChain(el, 1, {rotation: 20});
      }).then(function(){
        return Utils.animationChain(el, 1, {rotation: -20});
      }).then(function(){
        return Utils.animationChain(el, 0.5, {rotation: 0});
      })
    } else {
      return Utils.waitForSeconds(3);
    }
  }).then(function(){
    window.clearInterval(context.slideshow);
    return Utils.animationChain(el, 1, oldStyle)
  }).then(function(){
    isPlaying = false;
    context.onTop = false;
    context.slideshow = null;
  });
}

export default {
  props: ['editMode', 'classware'],
  data() {
    return {
      currentImageIndex: 0,
      card: {},
      onTop: false
    }
  },
  methods: {
    onCardClick: _.throttle(function() {
      if (this.isStack) {
        EventBus.$emit(Events.DISPLAY_CATEGORY, this.card.uuid);
      } else {
        if (this.editMode) {
          return
        }
        playAnimation(this);
      }
    }, 500, {trailing: false}),
    onCardEditClick: function() {
      EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_OPEN, this.classware);
    },
  },
  computed: {
    isStack: function() {
      return this.card.type == 'folder'
    },
    card_bg_image: function() {
      if (this.isStack) {
        return 'static/img/cat_bg.png';
      } else {
        return 'static/img/card_bg.png';
      }
    },
    content_image: function() {
      if (this.isStack) {
        if (! this.card.cover) {
          return 'static/img/dummy_content.jpg';
        }
        return this.card.cover;
      } else {
        return this.card.images[this.currentImageIndex];
      }
    },
  },
  created() {
    if (this.classware.type == 'folder') {
      this.card = this.classware;
    } else {
      var content = db.getCardByUuid(this.classware.content);
      this.card = content;
    }
  }
}
</script>

<style scoped>
.yd-card {
  position: relative;
  max-width: 100%;
  text-align: center;
}

.yd-card img {
  max-width: 100%;
}

/*.yd-card .card-frame {
  z-index: 999;
}*/

.yd-card .card-content img {
  height: 100%;
  width: 100%;
  -moz-border-radius: 5px;
  border-radius: 5px;
}

/*
  full width = 632
  full heigh = 612

  content margins:
  margin top = 46
  margin left = 77
  margin right = 81
  margin bottom = 209
*/
.yd-card .card-content {
  position: absolute;
  left: 12%;
  top: 7.3%;
  right: 12%;
  bottom: 33.9%
}

.yd-card .card-text {
  max-width: 100%;
  text-align: center;
  position: absolute;
  top: 66%;
  left: 12.18%;
  right: 12.82%;
  height: 20%;
  font-size: 1.0em;
  /*z-index: 10;*/
  padding-top: 0.2em;
  color: rgb(80,45,17);
}

.card-text div {
  position: relative;
  top: 50%;
  transform: translateY(-50%); 
}

.yd-card .card-edit-button {
  max-width: 30%;
  content: url("../../static/img/edit.png");
  position: absolute;
  top: -5%;
  right: 0%;
  bottom: 80%;
}

.on-top {
  z-index: 9999;
}
</style>

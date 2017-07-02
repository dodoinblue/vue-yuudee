<template>
<div class="yd-card" @click="onCardClick()">
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
import { EventBus } from './EventBus.js'
import { TweenLite } from "gsap"
import _ from 'lodash'
import db from './db.js'

/*
 * Calculate the parameters to animate a card to the center of screen.
 * win: window obj contains current windows's width and height
 * rect: element's rect from vm.$el.getBoundingClientRect()
 */
var calcToCenterAnimParams = function(win, rect) {
  var scale = win.width / rect.width;
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

var buildTweenAnimation = function(parameters, element, onComplete, onReverseComplete) {
  var animationParams = parameters;
  animationParams.zIndex = 999;
  animationParams.paused = true;
  animationParams.onComplete = onComplete;
  animationParams.onReverseComplete = onReverseComplete;

  return TweenLite.to(element, 1, animationParams);
}

var isPlaying = false;

var playCard = function(context) {
  if (isPlaying) {
    console.log("Card is playing, ignore card click");
    return
  }
  isPlaying = true;

  // Start slideshow
  var slideshow = window.setInterval(() => {
    if (context.currentImageIndex == context.card.images.length - 1) {
      context.currentImageIndex = 0;
    } else {
      context.currentImageIndex ++;
    }
  }, 500);

  // Play audio
  var aud = new Audio();
  // TODO: chain audios if necessary
  aud.src=context.card.audios[0];
  aud.onended = function(){
    console.log("audio end");
  };
  aud.play();
  console.log(aud);

  var animation;

  // Animation to center and revese
  // TODO: disable touch if there is an active animation
  var win = {width: window.innerWidth, height: window.innerHeight};
  var animationParams = calcToCenterAnimParams(win, context.$el.getBoundingClientRect());
  var onComplete = function() {
    window.setTimeout(function () {
      animation.reverse();
    }, 3000);
  }
  var onReverseComplete = function () {
    animation = null;
    window.clearInterval(slideshow);
    context.currentImageIndex = 0;
    isPlaying = false;
  };
  animation = buildTweenAnimation(animationParams, context.$el, onComplete, onReverseComplete);
  if( animation && ! animation.isActive()) {
    animation.play();
  }
}

export default {
  props: ['editMode', 'classware'],
  data() {
    return {
      currentImageIndex: 0,
      card: {}
    }
  },
  methods: {
    onCardClick: _.throttle(function() {
      if (this.isStack) {
        EventBus.$emit('StackClicked', this.card.uuid);
      } else {
        playCard(this);
      }
    }, 500, {trailing: false}),
    onCardEditClick: function() {
      console.log("Card Edit clicked: " + this.card.uuid);
    }
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
        return this.card.images[0];
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
  content: url("../static/img/edit.png");
  position: absolute;
  top: -5%;
  right: 0%;
  bottom: 80%;
}
</style>

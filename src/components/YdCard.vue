<template>
<div class="yd-card" :class="{'on-top': onTop}" @click="onCardClick()">
  <template v-if="!classware.empty">
    <div class="card-frame" >
      <img :src="card_bg_image">
    </div>
    <div class="card-content">
      <img :src="content_image">
    </div>
    <div class="card-text"><div>{{card.name}}</div></div>
    <div class="card-edit-button" v-if="editMode && from !== 'resource'" @click.stop="onCardEditClick"></div>
    <div :class="picked ? 'card-box-checked' : 'card-box-unchecked'" v-if="editMode && from === 'resource'" @click.stop="onCardPicked"></div>
  </template>
  <template v-else>
    <div class="card-frame with-margin" @click="selectFromResource">
      <img src="static/img/blank_card.png">
    </div>
  </template>
</div>
</template>

<script>
import { EventBus, Events } from '../EventBus.js'
import { TweenLite } from "gsap"
import _ from 'lodash'
import db from '../db.js'
import Utils from '../utils'
import PickedCards from '../PickedCards'

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
    var p = Utils.playAudioChain(context.card.audios[0]);
    var numOfAudios = context.card.audios.length;
    if (numOfAudios > 1) {
      for (var i = 1; i < numOfAudios; i++) {
        p = p.then(function(){
          return Utils.playAudioChain(context.card.audios[i]);
        });
      }
    }

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
  // TODO: classware is the passed in variable. not card.. need to come up with better naming.
  props: ['editMode', 'classware', 'from'],
  data() {
    return {
      currentImageIndex: 0,
      card: {},
      onTop: false,
      picked: false
    }
  },
  methods: {
    onCardClick: _.throttle(function() {
      if (this.classware.empty) {
        return
      }
      if (this.isStack) {
        if (this.from == "resource") {
          if (this.editMode && PickedCards.hasItem()) {
            Utils.getF7().alert("Please add chosen items before navigating to another folder", "Forbidden")
          } else {
            EventBus.$emit(Events.RESOURCE_CATEGORY, this.card.uuid);
          }
        } else {
          EventBus.$emit(Events.DISPLAY_CATEGORY, this.card.uuid);
        }
      } else {
        if (this.editMode || this.from == "resource") {
          return
        }
        playAnimation(this);
      }
    }, 500, {trailing: false}),
    onCardEditClick: function() {
      EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_OPEN, this.classware);
    },
    selectFromResource: function() {
      console.log(this.$el)
      this.$router.push('resource/pick?request=' + this.classware.tempId);
    },
    onCardPicked: function() {
      // this.picked = !this.picked
      console.log('picked clicked')
      if (this.picked) {
        PickedCards.removeCard(this.card.uuid)
        this.picked = false
      } else {
        PickedCards.addCard(this.card.uuid)
        this.picked = true
      }
    }
  },
  computed: {
    isStack: function() {
      return this.card.type == 'folder' || this.card.isCategory
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
    // console.log(`card !!!! from: ${this.from} editMode: ${this.editMode}`)
    console.log(new Error().stack)
    if (this.classware.type == 'folder') {
      this.card = this.classware;
    } else if (this.from == 'resource') {
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

.card-frame.with-margin {
  margin: 7%;
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

.yd-card .card-box-unchecked {
  max-width: 30%;
  content: url("../../static/img/box.png");
  position: absolute;
  top: -5%;
  right: 0%;
  bottom: 80%;
}

.yd-card .card-box-checked {
  max-width: 30%;
  content: url("../../static/img/checkedbox.png");
  position: absolute;
  top: -5%;
  right: 0%;
  bottom: 80%;
}

.on-top {
  z-index: 9999;
}
</style>

<template>
<div class="yd-card" :class="{'on-top': onTop}" @click="onCardClick()">
  <template v-if="classware.type !== 'placeholder'">
    <div class="card-frame" >
      <img :src="card_bg_image">
    </div>
    <div class="card-content">
      <img :src="content_image">
    </div>
    <div :class="$t('message.card_text_class')"><div>{{card.name}}</div></div>
    <div class="card-edit-button" v-if="editMode && from !== 'resource'" @click.stop="onCardEditClick"></div>
    <div class="card-edit-button" v-if="from === 'resource' && !card.isOffcial" @click.stop="editResCard"></div>
    <div :class="picked ? 'card-box-checked' : 'card-box-unchecked'" v-if="editMode && from === 'resource'" @click.stop="onCardPicked"></div>
  </template>
  <template v-else>
    <div class="card-frame with-margin" :class="{'hidden': !editMode}" @click="selectFromResource">
      <img src="static/img/blank_card.png">
    </div>
  </template>
</div>
</template>

<script>
import { EventBus, Events } from '../EventBus.js'
import _ from 'lodash'
import db from '../db.js'
import Utils from '../utils'
import PickedCards from '../PickedCards'
import Q from 'q'
// import YdEditCardDialog from './YdEditCardDialog'

/*
 * Calculate the parameters to animate a card to the center of screen.
 * win: window obj contains current windows's width and height
 * rect: element's rect from vm.$el.getBoundingClientRect()
 */
var calcToCenterAnimParams = function(win, rect) {
  var scale = win.width * 0.85 / rect.width
  var winCenterLeft = win.width / 2
  var winCenterTop = win.height / 2
  var cardCenterLeft = rect.left + rect.width / 2
  var cardCenterTop = rect.top + rect.height / 2
  var xTrans = winCenterLeft - cardCenterLeft
  var yTrans = winCenterTop - cardCenterTop

  return {
    scaleX: scale,
    scaleY: scale,
    x: xTrans,
    y: yTrans
  }
}

var playAnimation = function(context) {
  if (context.$store.state.isCardPlaying) {
    return
  }

  if (context.classware.mute && context.classware.animation === 'none') {
    console.log('no audio and no animation, skip playing')
    return
  }

  var el = context.$el
  var oldStyle = {
    scaleX: 1,
    scaleY: 1,
    x: 0,
    y: 0
  }
  var win = {width: window.innerWidth, height: window.innerHeight}
  var animationParams = calcToCenterAnimParams(win, el.getBoundingClientRect())

  // Start Playing
  context.$store.commit('cardPlayStart')
  context.onTop = true
  /* eslint-disable no-unused-vars */
  var playPromise = Utils.emptyPromise()

  if (context.classware.animation !== 'none') {
    playPromise = playPromise.then(() => {
      return Utils.animationChain(el, 1, animationParams)
    })
  }

  playPromise = playPromise.then(() => {
    // Start slideshow
    context.slideshow = window.setInterval(() => {
      if (context.currentImageIndex === context.card.images.length - 1) {
        context.currentImageIndex = 0
      } else {
        context.currentImageIndex++
      }
    }, 500)

    // Start playing sound
    let audioPromise = Utils.emptyPromise()
    if (!context.classware.mute) {
      let playAudioFn = Utils.mediaPluginPlayAudio
      let numOfAudios = context.card.audios.length
      if (numOfAudios > 0) {
        audioPromise = audioPromise.then(() => {
          if (context.card.audios[0]) {
            return playAudioFn(context.card.audios[0])
          } else {
            throw new Error('audio not defined')
          }
        })
      }
      if (numOfAudios > 1) {
        for (let i = 1; i < numOfAudios; i++) {
          audioPromise = audioPromise.then(() => {
            return playAudioFn(context.card.audios[i])
          })
        }
      }
    }

    // Swing if set to or wait
    let animationPromise = Utils.emptyPromise()
    if (context.classware.animation === 'rotate') {
      animationPromise = animationPromise.then(() => {
        return Utils.animationChain(el, 0.5, {rotation: 20})
      }).then(function() {
        return Utils.animationChain(el, 1, {rotation: -20})
      }).then(function() {
        return Utils.animationChain(el, 1, {rotation: 20})
      }).then(function() {
        return Utils.animationChain(el, 1, {rotation: -20})
      }).then(function() {
        return Utils.animationChain(el, 0.5, {rotation: 0})
      })
    }

    return Q.all([audioPromise, animationPromise])
  })

  if (context.classware.animation !== 'none') {
    playPromise = playPromise.then(() => {
      return Utils.animationChain(el, 1, oldStyle)
    })
  }

  let cleanup = function() {
    window.clearInterval(context.slideshow)
    context.$store.commit('cardPlayStop')
    context.onTop = false
    context.slideshow = null
    context.currentImageIndex = 0
  }

  playPromise = playPromise.then(() => {
    cleanup()
    window.ga.trackEvent('USER_EVENT', 'DISPLAY', 'CARD_PLAY')
  })

  playPromise.catch((error) => {
    if (error === 'AUDIO KILLED APP IN BACKGROUND') {
      window.ga.trackEvent('USER_EVENT', 'DISPLAY', 'CARD_PLAY_INTERRUPTED')
    }
    Utils.animationChain(el, 0, oldStyle)
    cleanup()
  })
}

export default {
  // TODO: classware is the passed in variable. not card.. need to come up with better naming.
  props: ['editMode', 'classware', 'from'],
  // components: { YdEditCardDialog },
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
      if (this.classware.type === 'placeholder') {
        return
      }
      if (this.isStack) {
        if (this.from === 'resource') {
          if (this.editMode && PickedCards.hasItem()) {
            EventBus.$emit(Events.RESOURCE_CATEGORY, this.card.uuid)
          } else {
            EventBus.$emit(Events.RESOURCE_CATEGORY, this.card.uuid)
          }
        } else {
          EventBus.$emit(Events.DISPLAY_CATEGORY, this.card.uuid)
        }
      } else {
        if (this.editMode || this.from === 'resource') {
          return
        }
        playAnimation(this)
      }
    }, 500, {trailing: false}),
    editResCard: _.throttle(function() {
      if (this.card.isCategory) {
        EventBus.$emit(Events.EDIT_RESOURCE_CATEGORY, this.card)
      } else {
        EventBus.$emit(Events.EDIT_RESOURCE_CARD, this.card)
      }
    }, 500, {trailing: false}),
    onCardEditClick: function() {
      EventBus.$emit(Events.DISPLAY_CARD_SETTINGS_OPEN, this.classware)
    },
    selectFromResource: function() {
      this.$emit('pick', {
        placeholderId: this.classware.uuid,
        placeholderOrder: this.classware.order
      })
    },
    onCardPicked: function() {
      if (this.picked) {
        PickedCards.removeCard(this.card.uuid)
        this.picked = false
      } else {
        PickedCards.addCard(this.card.uuid)
        this.picked = true
      }
    },
    initContent: function() {
      if (this.classware.type === 'folder') {
        this.card = this.classware
      } else if (this.from === 'resource') {
        this.card = this.classware
      } else {
        var content = db.getCardByUuid(this.classware.content)
        this.card = content
      }
    }
  },
  computed: {
    isStack: function() {
      return this.card.type === 'folder' || this.card.isCategory
    },
    card_bg_image: function() {
      if (this.isStack) {
        return 'static/img/cat_bg.png'
      } else {
        return 'static/img/card_bg.png'
      }
    },
    content_image: function() {
      if (this.isStack) {
        if (!this.card.cover) {
          return 'static/img/dummy_content.jpg'
        }
        return this.card.cover
      } else {
        return this.card.images[this.currentImageIndex]
      }
    }
  },
  created() {
    this.initContent()
    EventBus.$on(Events.RESOURCE_CARD_UPDATED, (doc) => {
      if (doc.uuid === this.classware.uuid) {
        window.setTimeout(() => {
          this.classware = doc
          this.card = doc
        }, 200)
      } else if (doc.uuid === this.classware.content) {
        this.card = doc
      }
    })
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
  top: 7.0%;
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

.yd-card .card-text-small {
  max-width: 100%;
  text-align: center;
  position: absolute;
  top: 69%;
  left: 12.18%;
  right: 12.82%;
  height: 20%;
  font-size: 0.8em;
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

.hidden {
  visibility: hidden
}
</style>

<template>
<div class="yd-card" @click="onCardClick()">
  <div class="card-frame">
    <img :src="card_bg_image">
  </div>
  <div class="card-content">
    <img :src="content_image">
  </div>
  <div class="card-text"><div>{{card.name}}</div></div>
  <div class="card-edit-button"></div>
</div>
</template>

<script>
export default {
  props: ['card', 'isEditMode'],
  data() {
    return {
    };
  },
  methods: {
    onCardClick: function() {
      console.log("card clicked: " + this.card);
    }
  },
  computed: {
    isStack: function() {
      if (this.card.children) {
        // It has children field, then it is a stack.
        return true;
      } else {
        return false;
      }
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
        return 'static/card-assets/' + this.card.cover;
      } else {
        return 'static/card-assets/' + this.card.path + '/images/' + this.card.images[0];
      }
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

.yd-card .card-frame {
  z-index: 999;
}

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
  z-index: 10;
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

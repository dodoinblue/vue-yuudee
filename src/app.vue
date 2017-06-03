<template>
<!-- App -->
<div id="app">

  <!-- Statusbar -->
  <!--<f7-statusbar></f7-statusbar>-->

  <div class="row">
    <!-- Yuudee's logo' -->
    <div class="col-33">
    </div>
    <div class="col-33">
      <img class="app-logo" src="../static/img/yuudee_logo.svg">
    </div>
    <div class="col-33">
    </div>
  </div>

  <yd-drawer></yd-drawer>
</div>
</template>

<script>
import YdCard from './YdCard.vue'
import YdDrawer from './YdDrawer.vue'

export default {
  components: { YdCard, YdDrawer }
}
</script>

<style scoped>
#app {
  background-image: url("../static/img/background.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  margin: 0px;
}
.app-logo {
  height: 18%;
  padding: 5% 0 0 0;
  text-align: center;
  width: 80%;
}
.grid-display {
  height: 100%;
  margin-top: 5%;
  border: 1px solid #ddd;
}
.card-img {
  width: 95%;
}
</style>
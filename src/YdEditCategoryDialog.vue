<template>
<div>
  <div class="settings-container"></div>
  <div class="settings-dialog">
    <div class="settings-frame">
      <img src="../static/img/edit-dialog-with-text-field.png">
    </div>
    <div class="settings-dialog-title">Edit Category</div>
    <div class="classware-title">
      <input type=text placeholder="Category title"></input>
    </div>

    <div class="classware-delete">Delete this courseware</div>
    <div class="classware-confirm row">
      <div class="col col-50"><a href='#' class="button button-fill color-gray button-raised" @click="cancel">Cancel</a></div>
      <div class="col col-50"><a href='#' class="button button-fill color-blue button-raised">Confirm</a></div>
    </div>
  </div>
</div>

</template>

<script>
import { EventBus } from './EventBus'
export default {
  props: ['uuid'],
  data() {
    return {
    }
  },
  methods: {

  }
}
</script>

<style scoped>
.settings-container {
  position:fixed;
  width: 100%;
  height: 100%;
  padding: 0px;
  margin: 0px;
  top:0;
  left:0;
  background: darkgrey;
  opacity: 0.5;
  z-index: 900;
}
.settings-dialog {
    position: relative;
    top: 30%;
    left: 10%;
    width:80%;
    height:60%;
    z-index: 1000;
}

.settings-dialog img {
  width: 100%;
}

.settings-dialog .settings-dialog-title {
  position: absolute;
  top: 8%;
  width: 70%;
  margin-left: 15%;
  margin-right: 15%;
  text-align: center;
  font-size: 15px;
  color: lightgrey;
}

.settings-dialog .classware-title {
  position: absolute;
  top: 30%;
  width: 70%;
  margin-left: 15%;
  margin-right: 15%;
}

.classware-title input {
  border: none;
}

.settings-dialog .classware-delete {
  position: absolute;
  top: 45%;
  width: 70%;
  margin-left: 15%;
  margin-right: 15%;
  color: red;
}

.settings-dialog .classware-confirm {
  position: absolute;
  top: 68%;
  width: 80%;
  margin-left: 10%;
  margin-right: 10%;
}
</style>

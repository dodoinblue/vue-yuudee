<template>
<div>
  <div class="settings-container"></div>
  <div class="settings-dialog">
    <div class="settings-frame">
      <img src="../static/img/parent_settingspop_bg.png">
    </div>
    <div class="classware-title">classware title</div>
    <div class="classware-layout">
      <div class="row">Choose layout</div>
      <div class="row">
        <div class="col col-33 selected">
          <img class="layout selected" src="../static/img/parent_settingspop_layout1_1.png">
          <small>no animation</small>
        </div>
        <div class="col col-33">
          <img class="layout"src="../static/img/parent_settingspop_layout2_2.png">
          <small>enlarge</small>
        </div>
        <div class="col col-33">
          <img class="layout"src="../static/img/parent_settingspop_layout2_2.png">
          <small>enlarge and shake</small>
        </div>
      </div>
    </div>
    <div class="classware-delete row">
      <div class="col col-50">Delete this card</div>
      <div class="col col-50">
        <div class="item-input">
          <label class="label-switch">
            <input type="checkbox">
            <div class="checkbox"></div>
          </label>
        </div>
      </div>
    </div>
    <div class="classware-confirm row">
      <div class="col col-50"><a href='#' class="button button-fill color-gray button-raised">Cancel</a></div>
      <div class="col col-50"><a href='#' class="button button-fill color-blue button-raised">Confirm</a></div>
    </div>
  </div>
</div>

</template>

<script>
export default {

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
  background: #aaaaaa;
  opacity: 0.5;
  z-index: 900;
}
.settings-dialog {
    position: relative;
    top: 20%;
    left: 10%;
    width:80%;
    height:60%;
    z-index: 1000;
}

.settings-dialog img {
  width: 100%;
}

.settings-dialog .classware-title {
  position: absolute;
  top: 19%;
  width: 70%;
  margin-left: 15%;
  margin-right: 15%;
}

.settings-dialog .classware-layout {
  position: absolute;
  top: 27%;
  width: 70%;
  margin-left: 15%;
  margin-right: 15%;
}

.settings-dialog .classware-delete {
  position: absolute;
  top: 69%;
  width: 74%;
  margin-left: 13%;
  margin-right: 13%;
  color: red;
}

.settings-dialog .classware-confirm {
  position: absolute;
  top: 81.5%;
  width: 80%;
  margin-left: 10%;
  margin-right: 10%;
}

img.layout {
  border-width: 3px;
  border-color: transparent;
  border-radius: 7px;
  border-style: solid;
  border-spacing: 3px;
}

img.selected {
  border-color: lightskyblue;
}
</style>

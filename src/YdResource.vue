<template>
<div id="resource">
  <div class="row">
    <div class="col col-33">
      <div class="yd-button" @click="back()">Back</div>
    </div>
    <div class="col col-33 col-offset-33">
      <div class="yd-button">New</div>
    </div>
  </div>
</div>  
</template>

<style>
#resource {
  background-color: red;
}
</style>

<script>
export default {
  methods: {
    back: function() {
      this.$router.back();
    }
  }
}
</script>
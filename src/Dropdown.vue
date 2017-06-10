<template>
<ul>
  <li @click="onDefaultClick"><div>{{ selected }}</div></li>
  <li v-if="open" v-for='op in options' @click="onItemClick(op)"><div class="dd-item"> {{ op }} </div></li>
</ul>
</template>

<script>
export default {
  props: [],
  data() {
    return {
      selected: 'Lesson 1',
      options: ['Lesson 1', 'Lesson 2'],
      open: false,
    }
  },
  methods: {
    onDefaultClick: function() {
      console.log('default clicked!');
      this.open = ! this.open;
    },
    onItemClick: function(item) {
      console.log(item + ' clicked!');
      this.selected = item;
      this.open = false;
    }
  },
  computed: {

  },
  created() {
    // console.log("creating dropdown");
  }
}
</script>

<style scoped>
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.dd-item {
  margin-top: 15px;
}
</style>

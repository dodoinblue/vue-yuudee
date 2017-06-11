// Import Vue
import Vue from 'vue'

// Import F7 iOS Theme Styles
import 'framework7/dist/css/framework7.ios.min.css'

// Import App Component
import App from './app'

// Init App
window.app = new Vue({
  el: '#app',
  template: '<app/>',
  components: {
    App
  }
});

// Import Vue
import Vue from 'vue'

// Import F7, F7-Vue
import 'framework7'
import Framework7Vue from 'framework7-vue'

// Import F7 iOS Theme Styles
import 'framework7/dist/css/framework7.ios.min.css'

// Import Routes
import Routes from './routes.js'
Vue.use(Framework7Vue)

// Import App Component
import App from './app'
import {EventBus} from 'EventBus.js'

// Stop native context menu
window.oncontextmenu = function(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
};

document.addEventListener("deviceready", function(){
  console.log("device ready");
  // Init App after device is ready. This is generally fast so no loading modal is needed.
  var app = new Vue({
    el: '#app',
    template: '<app/>',
    framework7: {
      root: '#app',
      routes: Routes,
    },
    components: {
      app: App
    },
    mounted() {
      EventBus.$emit('ROOT_MOUNTED');
    }
  });
  window.app = app;
}, false);

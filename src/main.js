// Import Vue
import Vue from 'vue'

// Import F7, F7-Vue
import 'framework7'
import Framework7Vue from 'framework7-vue'

// Import F7 iOS Theme Styles
import 'framework7/dist/css/framework7.ios.min.css'
import 'framework7/dist/css/framework7.ios.colors.min.css'

// Import Routes
import Routes from './routes.js'
Vue.use(Framework7Vue)

// Import App Component
import App from './app'
import { EventBus } from './EventBus.js'
import Utils from './utils.js'
import db from './db.js'

// Stop native context menu
window.oncontextmenu = function(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
};

var initApp = function() {
  // Init App after device is ready. This is generally fast so no loading modal is needed.
  var app = new Vue({
    el: '#app',
    template: '<app/>',
    framework7: {
      root: '#app',
      routes: Routes,
    },
    components: {
      app: App // TODO: can I use promise here to load components?
    },
    mounted() {
      // It appears that components can be mounted/created earlier than root app.
      EventBus.$emit('ROOT_MOUNTED');
    }
  });
  window.app = app;
}

// if (Utils.isCordova()) {
  document.addEventListener("deviceready", function(){
    console.log("device ready");
    db.initDB().then(function(){
      initApp();
    });
  }, false);
// } else {
//   // Make sure the app works in browsers
//   console.log("not cordova env")
//   initApp();
// }

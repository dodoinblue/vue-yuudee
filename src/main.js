// Import Vue
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

// Import F7 iOS Theme Styles
import 'framework7/dist/css/framework7.ios.min.css'
import 'framework7/dist/css/framework7.ios.colors.min.css'

import './font-awesome/css/font-awesome.min.css'

// Import App Component
import App from './app'
import { EventBus } from './EventBus.js'
import Utils from './utils.js'
import db from './db.js'

import YdDisplay from './pages/YdDisplay'
import YdResource from './pages/YdResource'

import VueTouch from 'vue-touch'
Vue.use(VueTouch, {name: 'v-touch'})

// Stop native context menu
window.oncontextmenu = function(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
};

var routes = [
  { path: '/display',
    name: 'YdDisplay',
    component: (resolve) => {
      EventBus.$on("RESOURCE_LOADED", function(){
        resolve(YdDisplay);
      })
    }
  },
  {
    path: '/resource',
    name: 'YdResource',
    component: YdResource,
    props: { mode: 'show' }
  },
  {
    path: '/resource/pick',
    name: 'YdResource',
    component: YdResource,
    props: { mode: 'pick' }
  },
  {
    path: '/',
    redirect: '/display'
  }
]

var router = new Router({ routes })

var initApp = function() {
  // Init App after device is ready. This is generally fast so no loading modal is needed.
  var app = new Vue({
    el: '#app',
    router,
    render: h => h(App),
    mounted() {
      // It appears that components can be mounted/created earlier than root app.
      EventBus.$emit('ROOT_MOUNTED');
    }
  })
  window.app = app;
}

document.addEventListener("deviceready", function(){
  console.log("device ready");
  db.initDB().then(function(){
    initApp();
  });
  StatusBar.hide();
}, false);


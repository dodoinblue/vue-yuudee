// Import Vue
import Vue from 'vue'
import Router from 'vue-router'
import store from './store'

Vue.use(Router)

/* eslint-disable import/first */
// Import F7 iOS Theme Styles
import 'framework7/dist/css/framework7.ios.min.css'
import 'framework7/dist/css/framework7.ios.colors.min.css'

import 'font-awesome/css/font-awesome.min.css'

// Import App Component
import App from './app'
import { EventBus } from './EventBus.js'
import db from './db.js'

import VueTouch from 'vue-touch'
Vue.use(VueTouch, {name: 'v-touch'})

import VueI18n from 'vue-i18n'
Vue.use(VueI18n)

import messages from './strings'
import routes from './routes'

// Create VueI18n instance with options
const i18n = new VueI18n({
  locale: 'zh', // set locale
  messages // set locale messages
})

// Stop native context menu
window.oncontextmenu = function(event) {
  event.preventDefault()
  event.stopPropagation()
  return false
}

var router = new Router({ routes })

var initApp = function() {
  // Init App after device is ready. This is generally fast so no loading modal is needed.
  var app = new Vue({
    el: '#app',
    router,
    store,
    i18n,
    render: h => h(App),
    mounted() {
      // It appears that components can be mounted/created earlier than root app.
      EventBus.$emit('ROOT_MOUNTED')
    }
  })
  window.app = app
}

document.addEventListener('deviceready', /* eslint-disable no-undef */ function() {
  console.log('device ready')
  window.ga.startTrackerWithId('UA-104921838-2', 30)
  window.ga.setAppVersion('1.3.1')
  window.ga.enableUncaughtExceptionReporting(true)
  db.initDB().then(function() {
    initApp()
  })
  StatusBar.hide()
}, false)

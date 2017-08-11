// Import Vue
import Vue from 'vue'
import Router from 'vue-router'
import store from './store'

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

import VueI18n from 'vue-i18n'
Vue.use(VueI18n)

const messages = {
  en: {
    message: {
      // Display
      done: 'Done',
      library: 'Library',
      new: 'New',
      settings: 'Settings',
      downloading: 'Downloading...',

      // Dialogs
      edit_card: 'Edit Card',
      choose_animation: 'Choose animation',
      none: 'None',
      enlarge: 'Enlarge',
      swing: 'Swing',
      delete_card: 'Delete this card',
      mute: 'Mute',
      edit_category: 'Edit Category',
      delete_courseware: 'Delete this courseware',
      edit_courseware_title: 'Edit courseware',
      choose_layout: 'Choose layout',
      // Resource
      back: 'Back',
      new_card: 'New Card',
      new_category: 'New Category',
      camera: 'Camera',
      album: 'Album',
      record: 'Record',
      play: 'Play',
      delete: 'Delete',
      cancel: 'Cancel',
      confirm: 'Confirm',
      choose_cover: 'Choose cover',
      category_name: 'Category name',

      // Alerts
      // Courseware settings
      cannot_delete_all: "Cannot delete 'All'",
      forbidden: "Forbidden",
      are_you_sure: "Are you sure?",
      delete_whole_category: "Delete whole category",
      // Pick item
      cannot_navi_chosen_items: "Please add chosen items before navigating to another folder",
      // Edit card
      missing_info_body: "Please choose name, category and image before save",
      missing_info_title: "Missing infomation",
      // Edit category
      require_category_title: "Category title is required",
      cannot_edit_in_all: "Cannot edit in 'All' category",
      modify_card_in_library: "Can be modified in Asset library",
      cannot_delete_in_all: "Cannot delete items in 'All' category",
      // New category
      must_choose_name: "Please choose a name before save",
      alert_delete_card: "Delete card",
      notice: "Notice",
      press_again_to_exit: "Press back button again to exit app",
      // Other category
      other: "Other"
    }
  },
  zh: {
    message: {
      // Display
      done: '结束编辑',
      library: '素材库',
      new: '新建',
      settings: '设置',
      downloading: '正在下载小雨滴卡片资源，请稍候...',

      // Dialogs
      edit_card: '编辑卡片',
      choose_animation: '选择动画',
      none: '无',
      enlarge: '放大',
      swing: '旋转',
      delete_card: '删除卡片',
      mute: '静音',
      edit_category: '编辑分类',
      delete_courseware: '删除课件',
      edit_courseware_title: '编辑课件',
      choose_layout: '选择布局',

      // Resource
      back: '后退',
      new_card: '新卡片',
      new_category: '新分类',
      camera: '相机',
      album: '相册',
      record: '录音',
      play: '播放',
      delete: '删除',
      cancel: '取消',
      confirm: '确认',
      choose_cover: '选择封面',
      category_name: '分类名称',

      // Alerts
      // Courseware settings
      cannot_delete_all: '不能删除“全部”课件',
      forbidden: "禁止",
      are_you_sure: "是否确定？",
      delete_whole_category: "删除整个课件",
      // Pick item
      cannot_navi_chosen_items: "已有选择的卡片，不能切换到其他分类，请先保存已选择的卡片",
      // Edit card
      missing_info_body: "请选择名称、分类和图片，然后保存",
      missing_info_title: "缺少信息",
      // Edit category
      require_category_title: "必须输入一个名称",
      cannot_edit_in_all: "不能在”全部“中编辑",
      modify_card_in_library: "可以在素材库中编辑",
      cannot_delete_in_all: "不能在”全部“中删除分类或课件",
      // New category
      must_choose_name: "请输入一个名称，然后保存",
      alert_delete_card: "删除卡片",
      notice: "提示",
      press_again_to_exit: "再按一次后退键退出应用",
      // Other category
      other: "其他"
    }
  }
}

// Create VueI18n instance with options
const i18n = new VueI18n({
  locale: 'zh', // set locale
  messages, // set locale messages
})

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
    store,
    i18n,
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


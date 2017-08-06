import Vue from 'vue'
import Vuex from 'vuex'


Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  state: {
    isCardPlaying: false
  },
  mutations: {
    cardPlayStart: state => state.isCardPlaying = true,
    cardPlayStop: state => state.isCardPlaying = false
  },
  strict: debug
})
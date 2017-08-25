import Vue from 'vue'
import Router from 'vue-router'
import YdDisplay from '@/screens/YdDisplay'
import YdResource from '@/screens/YdResource'

Vue.use(Router)

export default new Router({
  routes: [
    { path: '/display',
      name: 'YdDisplay',
      component: (resolve) => {
        resolve(YdDisplay)
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
})

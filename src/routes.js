import YdDisplay from './pages/YdDisplay'
import YdResource from './pages/YdResource'
import { EventBus } from './EventBus.js'

export default [
  { path: '/display',
    name: 'YdDisplay',
    component: (resolve) => {
      EventBus.$on('RESOURCE_LOADED', function() {
        resolve(YdDisplay)
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

import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import VueAMap from "vue-amap";

Vue.config.productionTip = false
Vue.use(ElementUI);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
Vue.use(VueAMap);

VueAMap.initAMapApiLoader({
  key: 'b45d59c7d49f2c8d460c55f6e90f2d22',
  plugin: ['AMap.Autocomplete', 'AMap.PlaceSearch', 'AMap.Scale', 'AMap.OverView', 'AMap.ToolBar', 'AMap.MapType', 'AMap.PolyEditor', 'AMap.CircleEditor', 'AMap.DistrictLayer', 'AMap.DistrictSearch', 'AMap.Lights',"AMap.Heatmap","AMap.Polygon"],
  v: '1.4.4' // 默认高德 sdk 版本为 1.4.4
});

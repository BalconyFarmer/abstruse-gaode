import * as THREE from "three";

/**
 *    1. 高德地图
 *    const domId = "idForG";
 *    self.mapApp = new MapFromGaode(domId);
 *    self.mapApp.updateCity(cityName);
 *    self.mapApp.setZoom(9);
 *    self.mapApp.eventBus.addEventListener("cameraClick", function() {
 *       self.firstShow = true;
 *    });
 */
class MapFromGaode {
    constructor(domId) {
        this.mMap = null;
        this.domId = domId;
        this.mapOption = {
            amap: {
                zoom: 8,
                expandZoomRange: true,
                mapStyle: "amap://styles/a17b839372bc6169f83714be86358b50",
                center: null,
                rotation: 0,
                resizeEnable: true,
                disableSocket: true,
                viewMode: "3D",
                labelzIndex: 30,
                pitch: 20,
                layers: [] // 地图图层
            },
            animation: false,
            tooltip: {
                trigger: "item",
                backgroundColor: "transparent",
                position: function (point) {
                    return [point[0] - 418, point[1] - 167];
                },
                formatter: null
            },
            series: []
        };
        this.bounds = null;
        this.eventBus = new THREE.EventDispatcher(); // 3D事件中心
        this.markList = []; // 暂时存放marks
    }

    /**
     * 设置地图缩放比例
     * @param data (越大,地图越大)
     */
    setZoom(data) {
        this.mapOption.amap.zoom = data;
    }

    /**
     * 根据城市名更新地图
     * @param cityName '昆明市'
     */
    async updateCity(cityName) {
        const self = this;
        this.AMap = await this.MapLoader()

        let district = new window.AMap.DistrictSearch({
            subdistrict: 1, //返回下一级行政区
            extensions: "all", //返回行政区边界坐标组等具体信息
            level: "city" //  country国家 province 省/直辖市 city 市 district 区/县 biz_area 商圈
        });

        district.search(cityName, function (status, result) {
            const code = result.districtList[0].adcode;
            let bounds = result.districtList[0].boundaries;
            self.bounds = bounds;
            let mask = [];
            for (let i = 0; i < bounds.length; i += 1) {
                mask.push([bounds[i]]);
            }
            self.mapOption.amap.mask = mask;
            // 获取center
            let centerData = [result.districtList[0].center.lng, result.districtList[0].center.lat];

            self.mapOption.amap.center = centerData;

            self.adjustZoom(result)
            // 初始化地图
            self.mMap = new AMap.Map(self.domId, self.mapOption.amap);
            self.startGetLngLat();
            self.addFaceCover(code);

            self.addHeight();
            // self.addCustomToolTip();

        });
    }

    addCustomToolTip() {
        //覆盖默认的dom结构
        AMapUI.defineTpl("ui/overlay/SimpleInfoWindow/tpl/container.html", [], function () {
            return document.getElementById('my-infowin-tpl').innerHTML;
        });

        AMapUI.loadUI(['overlay/SimpleInfoWindow'], function (SimpleInfoWindow) {

            let marker = new AMap.Marker({
                map: map,
                zIndex: 9999999,
                position: map.getCenter()
            });

            let infoWindow = new SimpleInfoWindow({
                myCustomHeader: '我的header',
                myCustomFooter: '我的footer',
                infoTitle: '<strong>这里是标题</strong>',
                infoBody: '<p class="my-desc"><strong>这里是内容。</strong></p>',

                //基点指向marker的头部位置
                offset: new AMap.Pixel(0, -31)
            });

            function openInfoWin() {
                infoWindow.open(map, marker.getPosition());
            }

            //marker 点击时打开
            marker.on('click', function () {
                openInfoWin();
            });

            openInfoWin();
        });
    }

    /**
     * 开启拾取坐标点
     */
    startGetLngLat() {
        const self = this
        this.mMap.on('click', function (e) {
            const Lng = e.lnglat.getLng()
            const Lat = e.lnglat.getLat()
            // console.log(Lng, Lat, 'startGetLngLat')
            self.eventBus.dispatchEvent({type: "clickPosition", message: {position: [Lng, Lat]}})
        });
    }

    /**
     * 自动调整缩放比例
     */
    adjustZoom(result) {
        if (result.info == "OK") {
            switch (result.districtList[0].level) {
                case "province":
                    this.setZoom(7)
                    break;
                case "city":
                    this.setZoom(10)
                    break;
                case "district":
                    this.setZoom(11)
                    break;
            }
        }
    }

    /*
    * 添加3D高度地面
    * todo 暂时所有项目接口失效 -> 什么都没做,又好了
    * */
    addHeight(height = -2000) {
        // 添加高度面
        let object3Dlayer = new AMap.Object3DLayer({zIndex: 1});
        this.mMap.add(object3Dlayer);
        let color = "rgba(255,255,255,0.8)";// rgba
        let wall = new AMap.Object3D.Wall({
            path: this.bounds,
            height: height,
            color: color
        });
        wall.transparent = true;
        object3Dlayer.add(wall);
    }

    /*
    * 添加颜色面积覆盖
    * 县级及以下无法分割
    * */
    addFaceCover(code) {
        // 添加 县级 区域覆盖
        let disProvince = new AMap.DistrictLayer.Province({
            zIndex: 6,
            adcode: [code],
            depth: 3,
            styles: {
                "fill": "rgba(255,255,255,0.1)",
                "province-stroke": "#1cf605",
                "city-stroke": "#a9b150",
                "county-stroke": "#ffffff",
                "county-stroke-weight": 5
            }
        });
        disProvince.setMap(this.mMap);
    }

    /**
     * 根据点自适应可视区域
     */
    setFitView() {
        this.mMap.setFitView();
    }

    /**
     * const tootipMsg = {name: '俄罗斯',value: 16};
     * this.mapApp.addPoint(item.lng, item.lat, "为民服务站",tootipMsg);
     */
    addPoint(longitude, latitude, iconShape, tootipMsg) {
        let icon = null;
        if (iconShape == "为民服务站") {
            icon = new AMap.Icon({
                image: require("./imgs/为民服务站.png"),
                size: new AMap.Size(50, 50)
            });
        } else if (iconShape == "云岭先锋APP") {
            icon = new AMap.Icon({
                image: require("./imgs/云岭先锋APP.png"),
                size: new AMap.Size(50, 50)
            });
        } else if (iconShape == "党建TV") {
            icon = new AMap.Icon({
                image: require("./imgs/党建TV.png"),
                size: new AMap.Size(50, 50)
            });
        } else if (iconShape == "党建盒子") {
            icon = new AMap.Icon({
                image: require("./imgs/党建盒子.png"),
                size: new AMap.Size(50, 50)
            });
        } else {
            icon = new AMap.Icon({
                image: require("./imgs/11-raunruo.png"),
                // image: require("./imgs/摄像头.png"),
                size: new AMap.Size(40, 40)
            });
        }

        if (longitude && latitude) {
            const marker = new AMap.Marker({
                // title: "组织名称:" + tootipMsg.name + "   " + "数量:" + tootipMsg.value,
                title: tootipMsg,
                icon: icon, // 路径
                position: [longitude, latitude], // 位置
                // imageOffset: new AMap.Pixel(-9, -3), // 图标取图偏移量
                clickable: true,
                map: this.mMap
            });

            const self = this;
            marker.on("click", function (eee) {
                self.eventBus.dispatchEvent({type: "cameraClick", message: {id: tootipMsg}});
            });

            marker.on("mouseover", function (event) {
                function fun1() {
                    self.eventBus.dispatchEvent({
                        type: "cameraMouseover",
                        message: {name: tootipMsg, data: event}
                    });
                }

                self.debounce(fun1.bind(self)(), 500, true)

            });

            marker.on("mouseout", function (event) {
                function fun1() {
                    self.eventBus.dispatchEvent({
                        type: "cameraMouseout",
                        message: {name: tootipMsg.name, data: event}
                    });
                }
                self.debounce(fun1.bind(self)(), 500, true)


            });

            this.markList.push(marker);
            this.mMap.add(marker); //  添加到地图
            // self.markerList.push(marker);
        }
    }

    /**
     * 清除所有点
     */
    removeAllPoint() {
        if (this.mMap) {
            this.mMap.remove(this.markList);
            this.markList = [];
        }
    }

    /*
    添加簇群
    */
    addClusterer() {
        // this.cluster = new AMap.MarkerClusterer(this.mMap, this.markerList, { gridSize: 20 });
    }

    /**
     * 销毁对象
     */
    destroy() {
        if (this.mMap) {
            this.mMap.destroy();
        }
    }

    static async findPlace(name) {
        const promise = new Promise(function (resolve, reject) {
            AMap.plugin("AMap.DistrictSearch", function () {
                let districtSearch = new AMap.DistrictSearch({
                    // 关键字对应的行政区级别，country表示国家
                    level: "district",
                    //  显示下级行政区级数，1表示返回下一级行政区
                    subdistrict: 1
                });

                // 搜索所有省/直辖市信息
                districtSearch.search(name, function (status, result) {
                    if (result.info == "OK") {
                        const center = {
                            lng: result.districtList[0].center.lng,
                            lat: result.districtList[0].center.lat
                        };
                        resolve(center);
                    }
                });
            });
        });

        return promise;
    }

    /**
     * 延时函数 等待引入地图
     * @returns {Promise<unknown>}
     * @constructor
     */
    async MapLoader() {
        return new Promise((resolve, reject) => {
            // 初始化引入文件
            if (window.AMap) {
                resolve(window.AMap)
            } else {
                setTimeout(function () {
                    if (window.AMap) {
                        resolve(window.AMap)
                    } else {
                        setTimeout(function () {
                            resolve(window.AMap)
                        }, 1000)
                    }
                }, 1000)
            }
        })
    }

    /**
     * 添加热力图
     */
    addHeat() {

        let heatmapData = [
            {
            "lng": 100.792831,
            "lat": 21.918056,
            "count": 500
        }, {
            "lng": 100.792831,
            "lat": 22,
            "count": 1000
        }]

        //详细的参数,可以查看heatmap.js的文档 http://www.patrick-wied.at/static/heatmapjs/docs.html
        //参数说明如下:
        /* visible 热力图是否显示,默认为true
         * opacity 热力图的透明度,分别对应heatmap.js的minOpacity和maxOpacity
         * radius 势力图的每个点的半径大小
         * gradient  {JSON} 热力图的渐变区间 . gradient如下所示
         *	{
         .2:'rgb(0, 255, 255)',
         .5:'rgb(0, 110, 255)',
         .8:'rgb(100, 0, 255)'
         }
         其中 key 表示插值的位置, 0-1
         value 为颜色值
         */
        const self = this
        this.mMap.plugin(["AMap.Heatmap"], function () {
            //初始化heatmap对象
            let heatmap = new AMap.Heatmap(self.mMap, {
                radius: 45, //给定半径
                opacity: [0.2, 0.8],
                gradient: {
                    0.5: 'rgba(255,0,54,0.3)',
                    0.65: 'rgba(255,0,54,0.5)',
                    0.7: 'rgba(255,0,54,0.6)',
                    0.9: 'rgba(255,0,54,0.8)',
                    1.0: 'rgb(255,0,54,0.9)'
                }
            });
            //设置数据集：该数据为北京部分“公园”数据
            heatmap.setDataSet({
                data: heatmapData,
                max: 1000
            });
        });

    }

    /**
     * 节流函数
     * @param func
     * @param wait 100
     * @param immediate fale
     * @returns {function(): void}
     */
    debounce(func, wait, immediate) {
        let timer;
        return function () {
            let context = this; // 这边的 this 指向谁?
            let args = arguments; // arguments中存着e

            if (timer) clearTimeout(timer);

            let callNow = !timer;

            timer = setTimeout(() => {
                timer = null;
            }, wait)

            if (callNow) func.apply(context, args);
        }
    }

    /**
     * 图片叠加到地图上面
     */
    addImgLayer() {
        let mapImg = require("./imgs/map-bg1.png");
        let imageLayer = new AMap.ImageLayer({
            url: mapImg,  //图片地址
            bounds: new AMap.Bounds(  //图片的四角左边
                [99.8,20.9], // 左下角
                [102.0,22.9]  // 右上角
            ),
            zooms: [0, 20]  //允许缩放的比例
        });

        this.mMap.add(imageLayer);
    }
}

export {MapFromGaode};

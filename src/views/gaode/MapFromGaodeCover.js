import {MapFromGaode} from "./MapFromGaode";
import bannaJson from "./mapDataForEcahrt/banna.json";

class MapFromGaodeCover extends MapFromGaode {
    constructor(domId) {
        super(domId);
    }

    /**
     * 添加子区域模块化效果
     * 模拟echart地图
     */
    addCover() {
        const self = this
        const draw = (geoJson) => {
            geoJson["features"].map((e, i) => {
                let path = e.geometry.coordinates[0][0];
                let defConfig = {
                    path,
                    strokeWeight: 3,
                    bubble: true,
                    fillColor: 'rgba(255,255,255, 0.12)',
                    strokeColor: 'rgb(69,112,245)',
                    fillOpacity: 0.1,
                    zIndex: 50
                };
                // 添加悬浮面
                let polygon = new AMap.Polygon(defConfig)
                self.mMap.add(polygon)
                // 鼠标悬浮效果
                polygon.on('mouseover', (e) => {
                    polygon.setOptions({
                        strokeColor: 'rgba(255,255,255, 1)',
                        fillColor: 'rgba(255,255,255, 0.32)',
                        fillOpacity: 0.32
                    })
                });
                polygon.on('mouseout', () => {
                    polygon.setOptions(defConfig);
                });

                polygon.on('click', (event) => {
                    // self.drawCounty(i);
                    console.log("点击区域!")
                });

            })
        }
        draw(bannaJson);
    }


}

export {MapFromGaodeCover}

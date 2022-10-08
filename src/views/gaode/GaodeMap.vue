<template>

    <div class="all">
        <div id="forGMap" style="width: 100%;height: 100%"></div>

        <div class="menu">
            <div class="menu1">
                <el-select
                    @change="makeGmap"
                    v-model="value"
                    allow-create
                    multiple
                    filterable
                    placeholder="请选择文章标签">
                    <el-option
                        v-for="item in options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value">
                    </el-option>
                </el-select>
            </div>

            <div class="menu2">
                <div>添加图标</div>
                <el-switch
                    @change='addIcon'
                    v-model="switchValue"
                    active-color="#13ce66"
                    inactive-color="grey">
                </el-switch>
                <el-button size="mini" @click="removePoint">清除所有图标</el-button>

            </div>

            <div class="menu3">
                <el-button size="mini" @click="addImgLayer">添加图片层</el-button>
                <el-button size="mini" @click="addCover">添加类Echart层</el-button>
                <el-button size="mini" @click="addHeat">添加热力图</el-button>
            </div>

        </div>

        <div class="menuRightBottom ">
            <div :class="{ disapprear : xcjxShow == false }" class="menuItem finger "
                 @click="changeIconType('现场教学基地')">
                <div class="img1"></div>
                <div>现场教学基地</div>
            </div>
            <div :class="{ disapprear : djsfdShow == false }" class="menuItem finger"
                 @click="changeIconType('党建示范点')">
                <div class="img2"></div>
                <div>党建示范点</div>
            </div>
        </div>

        <div class="tooltipS" style="" v-show="toolTipShow" id="toolTip">
            <div class="tooltipS1">{{ toolTipName }}</div>
            <div class="tooltipS2">地址:{{ address }}</div>
        </div>
    </div>
</template>

<script>
import {MapFromGaode} from "./MapFromGaode";
import {MapFromGaodeCover} from "./MapFromGaodeCover";

export default {
    name: "GaodeMap.vue",
    data() {
        return {
            toolTipName: "暂无数据",
            address: "暂无数据",
            toolTipShow: false,
            xcjxShow: true,
            djsfdShow: true,
            value: '',
            options: [{
                value: '云南省',
                label: '云南省'
            }, {
                value: '昆明市',
                label: '昆明市'
            }, {
                value: '五华区',
                label: '五华区'
            }],
            switchValue: false

        }
    },
    methods: {
        addHeat() {
            this.objGmap.addHeat()

        },
        addImgLayer() {
            this.objGmap.addImgLayer()
        },
        addCover() {
            this.objGmap.addCover()
        },

        changeIconType(params) {
            if (params == "现场教学基地") {
                if (this.xcjxShow) {
                    this.xcjxShow = !this.xcjxShow
                    this.mMap.remove(this.type1MarkList);

                } else {
                    this.xcjxShow = !this.xcjxShow
                    this.mMap.add(this.type1MarkList)
                }
            } else if (params == "党建示范点") {
                if (this.djsfdShow) {
                    this.djsfdShow = !this.djsfdShow
                    this.mMap.remove(this.type2MarkList);

                } else {
                    this.djsfdShow = !this.djsfdShow
                    this.mMap.add(this.type2MarkList)

                }
            }
        },
        async initGMap(name) {
            if (name) {
                this.objGmap = new MapFromGaode("forGMap")
                await this.objGmap.updateCity(name)
            } else {
                this.objGmap = new MapFromGaodeCover("forGMap")
                await this.objGmap.updateCity('西双版纳傣族自治州')
            }
        },
        makeGmap() {
            this.initGMap(this.value[0])
        },
        addIcon() {
            if (this.switchValue) {
                // 开启添加icon
                this.objGmap.eventBus.addEventListener("clickPosition", this._recivedPosition)
            } else {
                // 停止添加icon
                this.objGmap.eventBus.removeEventListener("clickPosition", this._recivedPosition)
            }
        },
        _recivedPosition(data) {
            const see = data.message.position
            const tooTip = {
                sex: '男',
                age: 100
            }
            this.objGmap.addPoint(see[0], see[1], "为民服务站", tooTip)

        },
        removePoint() {
            this.objGmap.removeAllPoint();
        },
        addEvent() {
            // 添加 toolTip hover事件
            const self = this
            this.objGmap.eventBus.addEventListener('cameraMouseover', function (data) {
                const see = data
                console.log(data, 'ss======')
                // debugger

                let event = data.message.data
                self.toolTipShow = true;
                const left = event.pixel.x + 20;
                const top = event.pixel.y + 20;
                const dom = document.getElementById("toolTip");
                dom.style.left = left + "px";
                dom.style.top = top + "px";
                self.toolTipName = 11;
                self.address = 11;
            })

            this.objGmap.eventBus.addEventListener('cameraMouseout', function (data) {
                self.toolTipShow = false;
            })

            this.objGmap.eventBus.addEventListener('cameraClick', function (data) {
                const see = data
                console.log(data, 'ss======')
                // debugger
            })
        }
    },
    mounted() {
        this.initGMap();
        this.addEvent();

    }
}
</script>

<style scoped lang="scss">
.all {
    width: 100%;
    height: 100%;
    position: relative;

    .menu {
        position: absolute;
        left: 0px;
        top: 0px;
        color: white;

        .menu1 {
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            margin-top: 20px;
        }

        .menu2 {
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            margin-top: 20px;

        }

        .menu3 {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            margin-top: 20px;

        }

    }


    .disapprear {
        color: gray;
    }

    .menuRightBottom {
        color: white;
        font-size: 30px;
        position: absolute;
        right: 0px;
        bottom: 0px;

        .menuItem {
            display: flex;
            flex-direction: row;
            justify-content: left;
            align-items: center;
            margin: 10px;

            .img1 {
                width: 40px;
                height: 40px;
                background-image: url("./imgs/dzlh.png");
                background-size: 100% 100%;
                margin-right: 35px;
            }

            .img2 {
                width: 40px;
                height: 40px;
                background-image: url("./imgs/党建.png");
                background-size: 100% 100%;
                margin-right: 35px;
            }
        }

    }

    .tooltipS {
        width: calc(534px / 1.5);
        height: calc(285px / 1.5);
        z-index: 99;
        color: white;
        position: absolute;
        left: 0px;
        top: 100px;
        background-image: url("./imgs/popup.png");
        background-size: 100% 100%;
        padding: 20px;

        .tooltipS1 {
            font-size: 20px;
            margin-left: 28px;
            margin-top: 30px;
        }

        .tooltipS2 {
            font-size: 15px;
            margin-left: 28px;
            margin-top: 30px;
        }
    }
}
</style>

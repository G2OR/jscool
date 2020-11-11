/**
 * 根据自己的习惯整合各个开发者而形成的工具包
 * 并且加入一些好用的方法
 * 方法如下：
 *      isEmpty： 判断字符串是否是空（undefined，null，空串）
 *      randomString： 生成随机字符串
 *      autoComplete： 自动补齐字符串
 *      customReplace： 自定义替换
 *      formatDate： 日期格式化
 *
 * 基于Scriptable的api封装的方法（用法可以参考该目录下/example中的demo）：
 *      require({scriptName, url = '', reload = false})： 引入第三方js库
 *      generateInputAlert： 生成带文本框的弹窗
 *      generateAlert： 生成弹窗
 *      widgetCutBg： 设置widget背景
 *
 * ⚠请在执行失败的地方执行execFail()
 *
 * @param scriptName 脚本名，用于通知时候的标题
 * @param scriptId 每个脚本唯一的id，用于存储持久化的时候加入key
 * @param options 传入一些参数，目前参数如下；
 *                                      lkIsSaveLog{scriptId} boolean : 保存日志到iCloud（目录：scriptable/lklogs/{scriptId}/）
 *                                      lkIsEnableLog{scriptId} boolean
 * @constructor
 */
function ScriptableToolKit(scriptName, scriptId, options) {
    return new (class {
        constructor(scriptName, scriptId, options) {
            //scriptable公共组件
            this.local = FileManager.local()
            this.icloud = FileManager.iCloud()
            this.curDateCache = this.local.joinPath(this.local.documentsDirectory(), "curDateCache")

            //一些扩展参数
            this.options = options

            this.tgEscapeCharMapping = {'&': '＆'}
            this.userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`
            this.prefix = `lk`
            this.name = scriptName
            this.id = scriptId
            this.data = null
            this.dataFile = `${this.prefix}${this.id}.json`
            this.bgImgPath = `${this.prefix}${this.id}Bg.jpg`
            this.bgImgPath = this.local.joinPath(this.local.documentsDirectory(), this.bgImgPath)

            //i18n
            this.lang = Device.language()
            this.msg = {
                "zh": [
                    "在开始之前，先进入主屏幕，进入图标排列模式。滑到最右边的空白页，并进行截图。",
                    "看起来你选择的图片不是iPhone的截图，或者你的iPhone不支持。请换一张图片再试一次。",
                    "你想创建什么尺寸的widget？",
                    "你想把widget放在哪里？",
                    " (请注意，您的设备只支持两行小部件，所以中间和底部的选项是一样的)。",
                    "widget的背景图已裁切完成，想在Scriptable内部使用还是导出到相册？",
                    "已经截图，继续",
                    "退出去截图",
                    "小","中","大",
                    "顶部左边","顶部右边","中间左边","中间右边","底部左边","底部右边",
                    "顶部","中间","底部",
                    "在Scriptable内部使用","导出到相册",
                    "填写遮罩层颜色。（格式：#000000）","颜色（格式：#000000）",
                    "填写遮罩层不透明度（0-1之间）","0-1之间",
                    "确定","取消","预览widget","设置widget背景","入口"
                ],
                "en": [
                    "Before you start, go to your home screen and enter wiggle mode. Scroll to the empty page on the far right and take a screenshot.",
                    "It looks like you selected an image that isn't an iPhone screenshot, or your iPhone is not supported. Try again with a different image.",
                    "What size of widget are you creating?",
                    "What position will it be in?",
                    " (Note that your device only supports two rows of widgets, so the middle and bottom options are the same.)",
                    "Your widget background is ready. Would you like to use it in a Scriptable widget or export the image?",
                    "Continue",
                    "Exit to Take Screenshot",
                    "Small","Medium","Large",
                    "Top left","Top right","Middle left","Middle right","Bottom left","Bottom right",
                    "Top","Middle","Bottom",
                    "Use in Scriptable","Export to Photos",
                    "Fill in the mask layer color. (Format: #000000)","Color.(Format: #000000)",
                    "Fill in the mask layer opacity (between 0-1)","between 0-1",
                    "Confirm","Cancel","Preview widget","Setting widget background","ENTER"
                ]
            }
            this.curLang = this.msg[this.lang] || this.msg.en

            //默认脚本开关
            this.isSaveLog = this.getResultByKey(`${this.prefix}IsSaveLog${this.id}`, false)
            this.isEnableLog = this.getResultByKey(`${this.prefix}IsEnableLog${this.id}`, true)

            this.logDir = this.icloud.documentsDirectory() + '/lklogs/' + this.id
            this.logSeparator = '\n██'
            this.now = new Date()
            this.execStatus = true
            this.notifyInfo = []
        }

        getResultByKey(key, defaultValue) {
            if (!this.options) {
                return defaultValue
            }
            const val = this.options[key]
            if (this.isEmpty(val)) {
                return defaultValue
            } else {
                return val
            }
        }

        appendNotifyInfo(info, type) {
            if (type == 1) {
                this.notifyInfo = info
            } else {
                this.notifyInfo.push(`${this.logSeparator}${this.formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S')}█${info}`)
            }
        }

        saveLog() {
            if (this.isSaveLog) {
                let message
                if (Array.isArray(this.notifyInfo)) {
                    message = this.notifyInfo.join("")
                } else {
                    message = this.notifyInfo
                }
                // 校验lklog目录是否存在
                if (this.icloud.isDirectory(this.logDir)) {
                    // write log
                    this.icloud.writeString(`${this.logDir}/${this.formatDate(this.now, 'yyyyMMddHHmmss')}.log`, message)
                } else {
                    // create dir
                    this.icloud.createDirectory(this.logDir, true)
                    this.icloud.writeString(`${this.logDir}/${this.formatDate(this.now, 'yyyyMMddHHmmss')}.log`, message)
                }
            }
        }

        prependNotifyInfo(info) {
            this.notifyInfo.splice(0, 0, info)
        }

        execFail() {
            this.execStatus = false
        }

        sleep(time) {
            return new Promise((resolve) => setTimeout(resolve, time))
        }

        log(message) {
            if (this.isEnableLog) console.log(`${this.logSeparator}${message}`)
            this.appendNotifyInfo(message)
        }

        logErr(message) {
            this.execStatus = false
            if (this.isEnableLog) {
                console.log(`${this.logSeparator}${this.name}执行异常:`)
                console.log(message)
                console.log(`\n${message.message}`)
            }
        }

        getContainer(key) {
            return key == 'local' ? this.local : this.icloud
        }

        /**
         * get value from container
         * @param key
         * @param container this.local or this.icloud
         */
        async getVal(key, container, defaultValue) {
            let containerInstance = this.getContainer(container)
            let data = ''
            try {
                let realDataFile = containerInstance.joinPath(containerInstance.documentsDirectory(), this.dataFile)
                if (!containerInstance.fileExists(realDataFile)) {
                    return Promise.resolve(defaultValue)
                }
                data = await containerInstance.readString(realDataFile)
                data = JSON.parse(data)
            } catch (e) {
                throw e
            }
            return Promise.resolve(data.hasOwnProperty(key) ? data[key] : defaultValue)
        }

        /**
         * get dataFile content
         * @param container
         */
        async getDataFile(container) {
            let containerInstance = this.getContainer(container)
            let data = ''
            try {
                let realDataFile = containerInstance.joinPath(containerInstance.documentsDirectory(), this.dataFile)
                if (!containerInstance.fileExists(realDataFile)) {
                    return Promise.resolve('')
                }
                data = await containerInstance.readString(realDataFile)
            } catch (e) {
                throw e
            }
            return Promise.resolve(data)
        }

        /**
         * set value in container
         * @param key
         * @param val
         * @param container this.local or this.icloud
         */
        async setVal(key, val, container) {
            let containerInstance = this.getContainer(container)
            let data
            let realDataFile = containerInstance.joinPath(containerInstance.documentsDirectory(), this.dataFile)
            try {
                if (!containerInstance.fileExists(realDataFile)) {
                    data = {}
                } else {
                    data = await containerInstance.readString(realDataFile)
                    data = JSON.parse(data)
                }
            } catch (e) {
                data = {}
            }
            data[key] = val
            containerInstance.writeString(realDataFile, JSON.stringify(data))
        }

        async get(options, callback = () => {}) {
            let request = new Request('')
            request.url = options.url
            request.method = 'GET'
            request.headers = options.headers
            const result = await request.loadString()
            callback(request.response, result)

            return result
        }

        async post(options, callback = () => {}) {
            let request = new Request('')
            request.url = options.url
            request.body = options.body
            request.method = 'POST'
            request.headers = options.headers
            const result = await request.loadString()
            callback(request.response, result)

            return result
        }

        async loadScript ({scriptName, url}) {
            this.log(`获取脚本【${scriptName}】`)
            const content = await this.get({url})
            this.icloud.writeString(`${this.icloud.documentsDirectory()}/${scriptName}.js`, content)
            this.log(`获取脚本【${scriptName}】完成🎉`)
        }

        require({scriptName, url = '', reload = false}) {
            if (this.icloud.fileExists(this.icloud.joinPath(this.icloud.documentsDirectory(), `${scriptName}.js`)) && !reload) {
                this.log(`引用脚本【${scriptName}】`)
                return importModule(scriptName)
            } else {
                this.loadScript({ scriptName, url })
                this.log(`引用脚本【${scriptName}】`)
                return importModule(scriptName)
            }
        }

        async generateInputAlert(message, field, defaultValue) {
            let result = []
            let alert = new Alert()
            alert.message = message
            alert.addTextField(field, defaultValue);

            alert.addCancelAction(this.curLang[27])
            alert.addAction(this.curLang[26])

            result[0] = await alert.presentAlert()
            result[1] = alert.textFieldValue(0)
            return result
        }

        async generateAlert(message, options) {
            let alert = new Alert()
            alert.message = message

            for (const option of options) {
                alert.addAction(option)
            }

            return await alert.presentAlert()
        }

        isEmpty(obj) {
            return typeof obj == "undefined" || obj == null || obj == "" || obj == "null"
        }

        isWorkingDays(now){
            return new Promise(async (resolve, reject) => {
                const mon = (now.getMonth() + 1) > 9 ? (now.getMonth() + 1) : ('0' + (now.getMonth() + 1))
                const day = now.getDate() > 9 ? now.getDate() : ('0' + now.getDate())
                const d = `${now.getFullYear()}${mon}${day}`
                // 0工作日 1休息日 2节假日
                let result = 0
                try {
                    let curDate = await this.getVal('curDateCache', 'local', 'fff')
                    if (d == curDate.split("-")[0]) {
                        //日期相同说明当天请求过，直接使用上次请求的值
                        result = curDate.split("-")[1]
                        this.log('already request')
                    } else {
                        this.log('send request')
                        const url = {
                            url: 'http://tool.bitefu.net/jiari/?d=' + d
                        }
                        await this.post(url, (resp, data) => {
                            result = data
                            // 写入文件系统
                            this.setVal('curDateCache', `${d + "-" + result}`, 'local')
                        })
                    }
                } catch (e) {
                    this.logErr(e)
                } finally {
                    resolve(result == 0 ? workingDaysFlag : holidayFlag)
                }

            })
        }

        randomString(len) {
            len = len || 32
            var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'
            var maxPos = $chars.length
            var pwd = ''
            for (let i = 0; i < len; i++) {
                pwd += $chars.charAt(Math.floor(Math.random() * maxPos))
            }
            return pwd
        }

        /**
         *
         * 示例:$.time('yyyy-MM-dd qq HH:mm:ss.S')
         *    :$.time('yyyyMMddHHmmssS')
         *    y:年 M:月 d:日 q:季 H:时 m:分 s:秒 S:毫秒
         *    其中y可选0-4位占位符、S可选0-1位占位符，其余可选0-2位占位符
         * @param {*} format 格式化参数
         *
         */
        formatDate(date, format) {
            let o = {
                'M+': date.getMonth() + 1,
                'd+': date.getDate(),
                'H+': date.getHours(),
                'm+': date.getMinutes(),
                's+': date.getSeconds(),
                'q+': Math.floor((date.getMonth() + 3) / 3),
                'S': date.getMilliseconds()
            }
            if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
            for (let k in o)
                if (new RegExp('(' + k + ')').test(format))
                    format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
            return format
        }

        /**
         * 自动补齐字符串
         * @param str 原始字符串
         * @param prefix 前缀
         * @param suffix 后缀
         * @param fill 补齐用字符
         * @param len 目标补齐长度，不包含前后缀
         * @param direction 方向：0往后补齐
         * @param ifCode 是否打码
         * @param clen 打码长度
         * @param startIndex 起始坐标
         * @param cstr 打码字符
         * @returns {*}
         */
        autoComplete(str, prefix, suffix, fill, len, direction, ifCode, clen, startIndex, cstr) {
            str += ``
            if (str.length < len) {
                while (str.length < len) {
                    if (direction == 0) {
                        str += fill
                    } else {
                        str = fill + str
                    }
                }
            }
            if (ifCode) {
                let temp = ``
                for (var i = 0; i < clen; i++) {
                    temp += cstr
                }
                str = str.substring(0, startIndex) + temp + str.substring(clen + startIndex)
            }
            str = prefix + str + suffix
            return this.toDBC(str)
        }

        /**
         * @param str 源字符串 "#{code}, #{value}"
         * @param param 用于替换的数据，结构如下
         * @param prefix 前缀 "#{"
         * @param suffix 后缀 "}"
         * {
         *     "code": 1,
         *     "value": 2
         * }
         * 按上面的传入，输出为"1, 2"
         * 对应的#{code}用param里面code的值替换，#{value}也是
         * @returns {*|void|string}
         */
        customReplace(str, param, prefix, suffix) {
            try {
                if (this.isEmpty(prefix)) {
                    prefix = "#{"
                }
                if (this.isEmpty(suffix)) {
                    suffix = "}"
                }

                for (let i in param) {
                    str = str.replace(`${prefix}${i}${suffix}`, param[i])
                }
            } catch (e) {
                this.logErr(e)
            }

            return str
        }

        toDBC(txtstring) {
            var tmp = ""
            for (var i = 0; i < txtstring.length; i++) {
                if (txtstring.charCodeAt(i) == 32) {
                    tmp = tmp + String.fromCharCode(12288)
                } else if (txtstring.charCodeAt(i) < 127) {
                    tmp = tmp + String.fromCharCode(txtstring.charCodeAt(i) + 65248)
                }
            }
            return tmp
        }

        getWidgetBg() {
            return this.local.readImage(this.bgImgPath)
        }

        phoneSizes() {
            return {
                "2688": {
                    "small": 507,
                    "medium": 1080,
                    "large": 1137,
                    "left": 81,
                    "right": 654,
                    "top": 228,
                    "middle": 858,
                    "bottom": 1488
                },

                "1792": {
                    "small": 338,
                    "medium": 720,
                    "large": 758,
                    "left": 54,
                    "right": 436,
                    "top": 160,
                    "middle": 580,
                    "bottom": 1000
                },

                "2436": {
                    "small": 465,
                    "medium": 987,
                    "large": 1035,
                    "left": 69,
                    "right": 591,
                    "top": 213,
                    "middle": 783,
                    "bottom": 1353
                },

                "2532": {
                    "small": 474,
                    "medium": 1014,
                    "large": 1062,
                    "left": 78,
                    "right": 618,
                    "top": 231,
                    "middle": 819,
                    "bottom": 1407
                },

                "2208": {
                    "small": 471,
                    "medium": 1044,
                    "large": 1071,
                    "left": 99,
                    "right": 672,
                    "top": 114,
                    "middle": 696,
                    "bottom": 1278
                },

                "1334": {
                    "small": 296,
                    "medium": 642,
                    "large": 648,
                    "left": 54,
                    "right": 400,
                    "top": 60,
                    "middle": 412,
                    "bottom": 764
                },

                "1136": {
                    "small": 282,
                    "medium": 584,
                    "large": 622,
                    "left": 30,
                    "right": 332,
                    "top": 59,
                    "middle": 399,
                    "bottom": 399
                },
                "1624": {
                    "small": 310,
                    "medium": 658,
                    "large": 690,
                    "left": 46,
                    "right": 394,
                    "top": 142,
                    "middle": 522,
                    "bottom": 902
                }
            }
        }

        remove(path) {
            this.local.remove(path)
        }

        cropImage(img, rect, color, opacity) {

            let draw = new DrawContext()
            draw.size = new Size(rect.width, rect.height)

            draw.drawImageAtPoint(img, new Point(-rect.x, -rect.y))
            draw.setFillColor(new Color(color, Number(opacity)))
            draw.fillRect(new Rect(0, 0, img.size["width"], img.size["height"]))
            return draw.getImage()
        }

        async widgetCutBg() {
            // Determine if user has taken the screenshot.
            var message
            message = this.curLang[0]
            let exitOptions = [this.curLang[6], this.curLang[7]]
            let shouldExit = await this.generateAlert(message, exitOptions)
            if (shouldExit) return

            // Get screenshot and determine phone size.
            let img = await Photos.fromLibrary()
            let height = img.size.height
            let phone = this.phoneSizes()[height]
            if (!phone) {
                message = this.curLang[1]
                await this.generateAlert(message, ["OK"])
                return
            }

            // Prompt for widget size and position.
            message = this.curLang[2]
            let sizes = [this.curLang[8], this.curLang[9], this.curLang[10]]
            let size = await this.generateAlert(message, sizes)

            message = this.curLang[3]
            message += (height == 1136 ? this.curLang[4] : "")

            // Determine image crop based on phone size.
            let crop = {w: "", h: "", x: "", y: ""}
            if (size == 0) {
                crop.w = phone.small
                crop.h = phone.small
                let positions = ["Top left", "Top right", "Middle left", "Middle right", "Bottom left", "Bottom right"]
                let positionsString = [this.curLang[11], this.curLang[12], this.curLang[13], this.curLang[14], this.curLang[15], this.curLang[16]]
                let position = await this.generateAlert(message, positionsString)

                // Convert the two words into two keys for the phone size dictionary.
                let keys = positions[position].toLowerCase().split(' ')
                crop.y = phone[keys[0]]
                crop.x = phone[keys[1]]

            } else if (size == 1) {
                crop.w = phone.medium
                crop.h = phone.small

                // Medium and large widgets have a fixed x-value.
                crop.x = phone.left
                let positions = ["Top", "Middle", "Bottom"]
                let positionsString = [this.curLang[17], this.curLang[18], this.curLang[19]]
                let position = await this.generateAlert(message, positionsString)
                let key = positions[position].toLowerCase()
                crop.y = phone[key]

            } else if (size == 2) {
                crop.w = phone.medium
                crop.h = phone.large
                crop.x = phone.left
                let positionsString = [this.curLang[17], this.curLang[19]]
                let position = await this.generateAlert(message, positionsString)

                // Large widgets at the bottom have the "middle" y-value.
                crop.y = position ? phone.middle : phone.top
            }

            // set mask layer color
            let maskLayerColor = await this.generateInputAlert(this.curLang[22], this.curLang[23], '#000000')
            if(maskLayerColor[0] == -1) return
            let opacity = await this.generateInputAlert(this.curLang[24], this.curLang[25], '0.1')
            if(opacity[0] == -1) return

            // Crop image and finalize the widget.
            let imgCrop = this.cropImage(img, new Rect(crop.x, crop.y, crop.w, crop.h), maskLayerColor[1], opacity[1])

            message = this.curLang[5]
            const exportPhotoOptions = [this.curLang[20], this.curLang[21]]
            const exportPhoto = await this.generateAlert(message, exportPhotoOptions)

            if (exportPhoto) {
                Photos.save(imgCrop)
            } else {
                this.local.writeImage(this.bgImgPath, imgCrop)
            }

            Script.complete()
        }

        async widgetEnter(callbacks) {
            return await this.generateAlert(this.curLang[30], [this.curLang[28], this.curLang[29]])
        }
    })(scriptName, scriptId, options)
}
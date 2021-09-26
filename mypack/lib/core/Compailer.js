const fs = require('fs');
const path = require('path');
const { startServer } = require("./createServer");
const { CustomEventListener } = require("./helpers/CustomEventListener");
const { parseFiles, generateCode } = require("./parseFileUtils");

class Compailer {
    constructor(config) {
        this.config = config;
        this.relationGraph = null;
        this.lifeCycleNames = {
            emit: {},
            // ...
        };
        this.customEventListener = new CustomEventListener()
    }
    async start() {
        // 初始化插件
        this.initPlugins();

        // 解析modules，包括解析模块依赖关系和loader处理
        const modules = await parseFiles(this.config.entry, this.config.loaders);

        // 通过模板生成最后的code
        const codes = generateCode(modules, this.config.entry);

        // 触发生命周期-emit
        this.dispatchLifeCycle("emit")

        // 输出
        await this.outputFile(codes);

        // 启动服务
        await startServer();
    }

    listenLifeCycle(lifeCycleName, fn) {
        if (!this.lifeCycleNames[lifeCycleName]) {
            console.log("生命周期不存在");
            return;
        }

        this.customEventListener.on(lifeCycleName, fn)
    }

    dispatchLifeCycle(lifeCycleName) {
        this.customEventListener.dispatchEvent(lifeCycleName)
    }

    outputFile(codes) {
        const { output } = this.config;
        fs.writeFileSync(path.join(output.path, output.filename), codes);
    }

    initPlugins() {
        const { plugins } = this.config;
        plugins.forEach(pluginItem => {
            if (pluginItem.apply && typeof pluginItem.apply === "function") {
                pluginItem.apply(this)
            }

        });
    }
}

module.exports = {
    Compailer
}
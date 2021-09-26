const { resolve } = require("path");
const { Compailer } = require("./core/Compailer");

const goMyPack = function (path, mode) {
    // 拿到编译配置项
    const config = getOptions(path, mode);
    // 初始化compailer
    const compailer = new Compailer(config);
    // 开始构建
    compailer.start();
}

const getConfitPath = function (relativePath) {
    const defaultPath = '../mypack.config.js';
    return resolve(__dirname, "../", relativePath || defaultPath)
}

const readJsonFile = function (path) {
    const jsonData = require(path);

    return jsonData;
}

const getOptions = function (path, mode) {
    const configPath = getConfitPath(path);
    const jsonData = readJsonFile(configPath);

    // 如果是生成环境，预制一些优化配置
    if (mode === "production") {
        return mergeProConfig(jsonData)
    }

    return jsonData;
}

const mergeProConfig = function (cusConfig) {
    return cusConfig;
}

module.exports = {
    goMyPack
}
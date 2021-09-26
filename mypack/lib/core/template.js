(() => {
    var __webpack_modules__ = ({
        <% __TO_REPLACE_WEBPACK_MODULES__.map(item => { %>
            '<%- item.file %>' : 
            ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {
                <%- item.code %>
            }),
        <% }) %>
    });
    // 定义__webpack_require__函数
    var __webpack_module_cache__ = {};
    function __webpack_require__(moduleId) {
        var cachedModule = __webpack_module_cache__[moduleId];
        if (cachedModule !== undefined) {
            return cachedModule.exports;
        }
        var module = __webpack_module_cache__[moduleId] = {
            exports: {}
        };

        __webpack_modules__[moduleId](module, module.exports, __webpack_require__);

        return module.exports;
    }

    // 扩展__webpack_require__.d函数
    // 针对definition中的自有属性，如果exports中没有的话，那定义此属性在exports取值逻辑为definition[key]
    (() => {
        __webpack_require__.d = (exports, definition) => {
            for (var key in definition) {
                if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
                    Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
                }
            }
        };
    })();

    // 扩展__webpack_require__.o函数
    // 一个对象和属性值，判断是否是自有属性
    (() => {
        __webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
    })();

    // 扩展__webpack_require__.r函数
    // 打标记表明exports是一个module
    (() => {
        __webpack_require__.r = (exports) => {
            if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
                Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
            }
            Object.defineProperty(exports, '__esModule', { value: true });
        };
    })();

    // 执行入口文件
    __webpack_require__('<%- __TO_REPLACE_WEBPACK_ENTRY__ %>');
})()
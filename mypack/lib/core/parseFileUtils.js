const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generate = require("@babel/generator").default;
const ejs = require("ejs");

const EXPORT_DEFAULT_FUN = `
__webpack_require__.d(__webpack_exports__, {
   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
});\n`;

const ESMODULE_TAG_FUN = ` __webpack_require__.r(__webpack_exports__);\n`;

const isThirdPartPackage = (pathName) => {
    return !(/.\/|..\//g.test(pathName))
}
// 使用loader处理源码
async function transformByLoader(loaders, fileName, code) {
    if (!code) return code;

    for (let i = 0; i < loaders.length; i++) {
        const loaderItem = loaders[i];
        const { test, handler } = loaderItem;
        if (test.test(fileName)) {
            return await handler(code)
        }
    }

    return code;
}

// 解析单个文件
async function parseFile(file, loaders) {
    // 读取入口文件
    const fileContent = fs.readFileSync(file, "utf-8");

    // const fileContent = await transformByLoader(loaders, file, codeReadStr);

    // 使用babel parser解析AST
    const ast = parser.parse(fileContent, { sourceType: "module" });

    let importFilePath = "";
    let importVarName = "";
    let importCovertVarName = "";
    let hasExport = false;

    //例如: import a from "./a"
    //@importVarName ./a
    const importVarMapping = {}

    // 使用babel traverse来遍历ast上的节点
    traverse(ast, {
        ImportDeclaration(p) {
            // import from 的名字，如 ./a
            const importFile = p.node.source.value;

            // import的变量名字，如 aStr
            importVarName = p.node.specifiers[0].local.name;

            // 获取文件路径
            if (isThirdPartPackage(importFile)) {
                importFilePath = require.resolve(importFile);
            } else {
                importFilePath = `./${path.join(path.dirname(file), importFile)}.js`;
            }

            // 替换后的变量名字
            importCovertVarName = `__${path.basename(
                importFile
            )}__WEBPACK_IMPORTED_MODULE_0__`;

            // 构建一个目标变量定义的AST节点
            const variableDeclaration = t.variableDeclaration("var", [
                t.variableDeclarator(
                    t.identifier(importCovertVarName),
                    t.callExpression(t.identifier("__webpack_require__"), [
                        t.stringLiteral(importFilePath),
                    ])
                ),
            ]);

            // 将当前节点替换为变量定义节点
            p.replaceWith(variableDeclaration);
            importVarMapping[importVarName] = {
                importFilePath: importFilePath,
                importCovertVarName: importCovertVarName
            }
        },
        CallExpression(p) {
            // 如果调用的是import进来的函数
            const callName = p.node.callee.name;
            if (importVarMapping[callName]) {
                p.node.callee.name = `${importVarMapping[callName].importCovertVarName}.default`;
            }
        },
        Identifier(p) {
            // 如果调用的是import进来的变量
            const identifierName = p.node.name;
            if (importVarMapping[identifierName]) {
                p.node.name = `${importVarMapping[identifierName].importCovertVarName}.default`;
            }
        },
        ExportDefaultDeclaration(p) {
            hasExport = true; // 先标记是否有export

            // 跟前面import类似的，创建一个变量定义节点
            const variableDeclaration = t.variableDeclaration("const", [
                t.variableDeclarator(
                    t.identifier("__WEBPACK_DEFAULT_EXPORT__"),
                    t.identifier(p.node.declaration.name)
                ),
            ]);

            // 将当前节点替换为变量定义节点
            p.replaceWith(variableDeclaration);
        },
    });

    let newCode = generate(ast).code;

    if (hasExport) {
        newCode = `${EXPORT_DEFAULT_FUN} ${newCode}`;
    }

    // 下面添加模块标记代码
    newCode = `${ESMODULE_TAG_FUN} ${newCode}`;

    return {
        file,
        dependencies: Object.values(importVarMapping).map((item) => item.importFilePath),
        code: newCode,
    };
}

// 递归解析多个文件
async function parseFiles(entryFile, loaders) {
    const entryRes = await parseFile(entryFile, loaders); // 解析入口文件
    const results = [entryRes]; // 将解析结果放入一个数组
    // 循环结果数组，将它的依赖全部拿出来解析
    for (const res of results) {
        const dependencies = res.dependencies;
        dependencies.map(async (dependency) => {
            if (dependency) {
                const ast = await parseFile(dependency, loaders);
                results.push(ast);
            }
        });
    }

    return results;
}

function generateCode(allAst, entry) {
    const temlateFile = fs.readFileSync(
        path.join(__dirname, "./template.js"),
        "utf-8"
    );

    const codes = ejs.render(temlateFile, {
        __TO_REPLACE_WEBPACK_MODULES__: allAst,
        __TO_REPLACE_WEBPACK_ENTRY__: entry,
    });

    return codes;
}

module.exports = {
    parseFiles,
    generateCode
}

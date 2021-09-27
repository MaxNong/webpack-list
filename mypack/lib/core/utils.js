const fs = require('fs')
const path = require('path');
const parser = require("@babel/parser");
const traverse = require('@babel/traverse').default
const { resolve } = require('path');

let ID = 0;
let resultModules = {}
const __mypack__require__ = {}

// 使用loader处理源码
async function transformByLoader(loaders, fileName, code) {
  if (!code) return code;

  let extName = path.extname(fileName)
  extName = extName ? extName.slice(1) : 'unknown'

  for (let i = 0; i < loaders.length; i++) {
    const loaderItem = loaders[i];
    const { test, handler } = loaderItem;
    if (test.test(fileName)) {
      return await handler(code)
    }
  }

  return code;
}

// 获取文件依赖
function getDependencies(loaderedCode) {
  if (loaderedCode.indexOf("@mypackModule/") > -1) {
    return loaderedCode
  }

  const ast = parser.parse(loaderedCode, { sourceType: "module" });
  const modules = [];

  traverse(ast, {
    ImportDeclaration(path) {
      const importModuleName = path.node.source.value;
      if (/.\/|..\//g.test(importModuleName)) {
        modules.push(importModuleName);
      } else {
        // 使用@mypackModule标记第三方模块
        const fullPath = `@mypackModule/${importModuleName}`;
        modules.push(fullPath);
      }
    },
  });

  return modules;
}

// 通过当前模块路径读取文件，返回该文件模块的描述数据
// @params: entryPath, loaders
const createAsset = async function (entryPath, loaders) {
  let loaderedCode = ""
  const isPackage = entryPath.indexOf("@mypackModule/") > -1;

  // 如果是第三方包
  if (isPackage) {
    const packageName = entryPath.split("/").pop();
    const aPath = resolve(__dirname, "../../node_modules");
    const moduleCacheCode = require(`${aPath}/${packageName}`);

    __mypack__require__[packageName] = moduleCacheCode;

    loaderedCode = entryPath
  } else {
    // 读取源代码
    const path = resolve(__dirname, "../../", entryPath);
    let fileStr = fs.readFileSync(path, 'utf8');

    // 使用loader转义获取源代码
    loaderedCode = await transformByLoader(loaders, entryPath, fileStr);
  }

  const dependencies = await getDependencies(loaderedCode);

  console.log(dependencies)
  console.log("-------------")

  return {
    id: ++ID,
    filename: entryPath,
    dependencies: dependencies,
    code: loaderedCode
  }
}

// 通过入口模块描述数据得到所有的模块数据
const getAllChunks = async function (entryModule, loaders) {
  return new Promise(() => {
    let dirname = path.dirname(entryModule.filename);
    entryModule.dependencies.forEach(async (relativePath) => {
      let absolutePath = relativePath.indexOf("@mypackModule") > -1 ? relativePath : path.join(dirname, relativePath)
      let childAsset = await createAsset(absolutePath, loaders);
      const moudleData = {
        code: entryModule.code,
        dependencies: {
          [childAsset.filename]: childAsset.id
        }
      }
      resultModules[entryModule.id] = moudleData

      if (Array.isArray(childAsset.dependencies) && childAsset.dependencies.length > 0) {
        getAllChunks(childAsset, loaders)
      }
    })
  })
}

// 获取包的相互依赖结构
const createAssetArr = async function (entryPath, buildConfig) {
  const { loaders } = buildConfig;

  // 获取入口module
  let entryModule = await createAsset(entryPath, loaders);
  console.log(entryModule);
  console.log("entryModule===================");

  // 通过入口获取所有的modules
  await getAllChunks(entryModule, loaders);
}

function createBundleJs(moduleArr, outputConfig) {
  let moduleStr = ''
  moduleArr.forEach((m, i) => { // 拼接 modules 里面的内容
    moduleStr += `${m.id}: [${m.code}, ${JSON.stringify(m.mapping)} ],`
  })
  const { path, filename } = outputConfig;
  let output = `let modules = { ${moduleStr} }
    function handle(id) {
      let [fn, mapping] = modules[id]
      let exports = {}
      function require(path) {
        return handle(mapping[path])
      }
      fn(require, exports)
      return exports
    }
    handle(0)`
  fs.writeFileSync(`${path}/${filename}`, output)
}

const errorTip = function (text) {
  console.error(chalk.red(text))
}

module.exports = {
  createAssetArr,
  errorTip,
  createBundleJs
}
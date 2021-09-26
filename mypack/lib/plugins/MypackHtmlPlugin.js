const fs = require("fs");
const path = require("path");

class MypackHtmlPlugin {
    constructor(htmlPath) {
        this.htmlPath = htmlPath
    }
    apply(compailer) {
        compailer.listenLifeCycle("emit", () => {
            const htmlCode = fs.readFileSync(
                this.htmlPath,
                "utf-8"
            );

            const { output } = compailer.config;
            const outputPath = `./${output.filename}`;
            const scriptStr = `<script src=${outputPath}></script>`

            const transformHtmlCode = htmlCode.replace("</body>", `${scriptStr}\n</body>`);

            fs.writeFileSync(path.join(output.path, "index.html"), transformHtmlCode);
        })
    }
}

module.exports = {
    MypackHtmlPlugin
}

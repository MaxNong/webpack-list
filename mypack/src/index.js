import aStr from "./a";
import bStr from "./b";

console.log(aStr)
console.log(bStr)

const htmlStr = `<div>${aStr} ${bStr}</div>`
document.getElementById("root").innerHTML = htmlStr
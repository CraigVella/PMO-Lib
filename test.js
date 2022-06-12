import PMOLib from "./PMOLib.js";
let lib = new PMOLib.PMO(false);

getUserObject();

function getUserObject() {
    lib.getUserObject().then(r => {
        console.log(r.data);
    })
}
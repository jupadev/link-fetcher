import fs from "node:fs";
import pdfParse from "pdf-parse";

const filePath = "./destFolder/xxxxxxx.pdf";

let dataBuffer = fs.readFileSync(filePath);

pdfParse(dataBuffer).then(function (data) {
  // PDF text
  console.log(data.text);
});

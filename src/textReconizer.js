import { readFile, readdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import pdfParse from "pdf-parse";

class PdfExtractor {
  constructor(srcFolder, batchSize = 10) {
    this.srcFolder = srcFolder;
    this.batchSize = batchSize > 50 ? 50 : batchSize;
    this.allFiles = [];
    this.stream = createWriteStream("data.json");
    this.stream.on("data", (chunk) => console.log(chunk));
  }

  setAllFiles(files) {
    this.allFiles = files;
  }

  dataCleaner(text) {
    const arrayTerms = text.split("\n").filter((t) => Boolean(t));
    const dataObject = {
      neighborhood: arrayTerms[0],
      address: arrayTerms[2],
      city: arrayTerms[4],
      owner: arrayTerms[5],
      data: text,
      arrayTerms,
    };

    return dataObject;
  }

  async processPdf(fileName) {
    const dataBuffer = await readFile(`${this.srcFolder}/${fileName}`);

    const fileData = await pdfParse(dataBuffer).then((data) => {
      return data.text;
    });
    const key = fileName.replace(".pdf", "");
    const data = {
      [key]: {
        ...this.dataCleaner(fileData),
      },
    };
    this.stream.write(JSON.stringify(data, null, 2));
  }

  async extractBatch(starIndex) {
    return new Promise(async (resolve, reject) => {
      const maxItemsIndex =
        starIndex + this.batchSize > this.allFiles.length
          ? this.allFiles.length - 1
          : starIndex + this.batchSize;

      const filesToProcess = this.allFiles.slice(starIndex, maxItemsIndex);

      const promises = [];
      filesToProcess.forEach((fileName) => {
        promises.push(this.processPdf(fileName));
      });

      await Promise.all(promises);

      console.log("batch", filesToProcess);
      if (maxItemsIndex === this.allFiles.length - 1) {
        return resolve();
      }
      this.extractBatch(maxItemsIndex);
    });
  }

  async start() {
    const allFiles = await readdir(this.srcFolder);
    this.setAllFiles(allFiles);
    this.extractBatch(0);
  }
}

const myExtractor = new PdfExtractor("./destFolder");

myExtractor.start();

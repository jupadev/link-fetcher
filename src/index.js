import { writeFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import axios from "axios";
import chalk from "chalk";
import * as dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Fetcher {
  constructor(endpoint, startRange, endRange, destFolder = "/destFolder") {
    this.endpoint = endpoint;
    this.startRange = startRange;
    this.endRange = endRange;
    this.destFolder = path.join(__dirname, "..", destFolder);

    if (!existsSync(this.destFolder)) {
      mkdirSync(this.destFolder);
    }
  }

  async getFile(fileName) {
    try {
      const resp = await axios.get(`${this.endpoint}/${fileName}`, {
        responseType: "blob",
        Accept: "application/json",
        "Content-Type": "application/json",
        responseType: "stream",
      });

      const savedFile = await writeFile(
        path.join(this.destFolder, fileName),
        resp.data
      );
      console.log(chalk.bgGreen(`File saved ${fileName}`));
    } catch (error) {
      console.log(chalk.red(`File not found ${fileName}`));
    }
  }

  async batch(startRange) {
    return new Promise(async (resolve, reject) => {
      const batchSize =
        startRange + 10 > this.endRange ? this.endRange : startRange + 10;
      const promises = [];
      for (let i = startRange; i < batchSize; i++) {
        promises.push(this.getFile(`${i}.pdf`));
      }
      await Promise.all(promises);
      if (batchSize < this.endRange) {
        await this.batch(batchSize);
      }
    });
  }

  async start() {
    console.log(chalk.bgCyanBright("Start proccessing"));
    await this.batch(this.startRange);
  }
}

const linkFetcher = new Fetcher(
  process.env.BASE_URL,
  parseInt(process.env.START_RANGE, 10),
  parseInt(process.env.END_RANGE, 10)
);

await linkFetcher.start();

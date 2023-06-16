import { promises as fs } from "fs";
import client from "@sendgrid/client";
import { genOne, genAll } from "./index";

const writeDefinitionFile = async (name: string, content: string) => {
  await fs.writeFile(name, content);
};

const parseArgs = (argv: string[]) => {
  let apiKey = undefined;
  let templateId = undefined;
  let directoryPath = undefined;
  let fileName = undefined;
  let interfaceName = undefined;
  for (let i = 0; i < argv.length; i++) {
    const elm = argv[i];
    if (elm.startsWith("--api-key")) {
      apiKey = elm.split("=")[1];
      continue;
    }
    if (elm.startsWith("--template-id")) {
      templateId = elm.split("=")[1];
      continue;
    }
    if (elm.startsWith("--fname")) {
      fileName = elm.split("=")[1];
      continue;
    }
    if (elm.startsWith("--iname")) {
      interfaceName = elm.split("=")[1];
      continue;
    }
  }
  return {
    apiKey,
    templateId,
    directoryPath,
    fileName,
    interfaceName,
  };
};

export const cli = async () => {
  const args = parseArgs(process.argv);

  if (!args.apiKey) {
    console.error("Use --api-key for input sendgrid api key");
    return;
  }

  client.setApiKey(args.apiKey);

  if (args.templateId) {
    const { name, def } = await genOne({
      templateId: args.templateId,
      interfaceName: args.interfaceName,
    });
    await writeDefinitionFile(
      args.fileName ? `${args.fileName}.ts` : name,
      def
    );
    return;
  }

  const contents = await genAll({});
  await Promise.all(
    contents.map((c) => {
      return writeDefinitionFile(`${c.name}.ts`, c.def);
    })
  );
};
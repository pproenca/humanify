import OpenAI from "openai";
import { splitCode } from "./split-file.js";
import {
  Rename,
  renameVariablesAndFunctions,
} from "./rename-variables-and-functions.js";
import { mapPromisesParallel } from "./run-promises-in-parallel.js";
import { HttpsProxyAgent } from "https-proxy-agent";

type Options = {
  apiKey: string;
  use4k: boolean;
  proxyURL?: string;
};

export default ({ apiKey, use4k, proxyURL }: Options) => {
  const client = new OpenAI({
    apiKey,
    httpAgent: proxyURL ? new HttpsProxyAgent(proxyURL) : undefined,
  });

  return async (code: string): Promise<string> => {
    const codeBlocks = await splitCode(code, use4k);
    let variablesAndFunctionsToRename: Rename[] = [];
    await mapPromisesParallel(10, codeBlocks, async (codeBlock) => {
      const renames = await codeToVariableRenames(codeBlock);
      variablesAndFunctionsToRename =
        variablesAndFunctionsToRename.concat(renames);
    });
    return renameVariablesAndFunctions(code, variablesAndFunctionsToRename);
  };

  async function codeToVariableRenames(code: string) {
    const chatCompletion = await client.chat.completions.create({
      model: "gpt-4-turbo-preview",
      functions: [
        {
          name: "rename_variables_and_functions",
          description: "Rename variables and function names in Javascript code",
          parameters: {
            type: "object",
            properties: {
              variablesAndFunctionsToRename: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description:
                        "The name of the variable or function name to rename",
                    },
                    newName: {
                      type: "string",
                      description:
                        "The new name of the variable or function name",
                    },
                  },
                  required: ["name", "newName"],
                },
              },
            },
            required: ["variablesAndFunctionsToRename"],
          },
        },
      ],
      messages: [
        {
          role: "assistant",
          content:
            "Rename all Javascript variables and functions to have descriptive names based on their usage in the code.",
        },
        { role: "user", content: code },
      ],
    });
    const data = chatCompletion.choices[0];
    if (data.finish_reason !== "function_call") return [];

    const {
      variablesAndFunctionsToRename,
    }: { variablesAndFunctionsToRename: Rename[] } = JSON.parse(
      fixPerhapsBrokenResponse(data.message?.function_call?.arguments!),
    );

    return variablesAndFunctionsToRename;
  }
};

function fixPerhapsBrokenResponse(jsonResponse: string) {
  return jsonResponse.replace(/},\s*]/im, "}]");
}

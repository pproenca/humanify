import { transform, PluginItem } from "@babel/core";

export const transformWithPlugins = async (
  code: string,
  plugins: PluginItem[]
): Promise<string> => {
  return await new Promise((resolve, reject) =>
    transform(
      code,
      {
        plugins,
        parserOpts: {
          plugins: ["decorators-legacy", "typescript", "jsx"]
        },
        compact: false,
        minified: false,
        comments: false,
        sourceMaps: false,
        retainLines: false
      },
      (err, result) => {
        if (err || !result) {
          reject(err);
        } else {
          resolve(result.code as string);
        }
      }
    )
  );
};

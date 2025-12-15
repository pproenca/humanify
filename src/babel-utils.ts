import { transform, PluginItem } from "@babel/core";

export const transformWithPlugins = async (
  code: string,
  plugins: PluginItem[]
): Promise<string> => {
  return await new Promise((resolve) =>
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
          // If parsing fails (e.g., non-JS content), return original code
          const errorMessage = (err as Error)?.message?.split("\n")[0] ?? "Unknown error";
          console.warn(`Babel transform skipped: ${errorMessage}`);
          resolve(code);
        } else {
          resolve(result.code as string);
        }
      }
    )
  );
};

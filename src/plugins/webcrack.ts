import { webcrack as wc } from "webcrack";
import fs from "fs/promises";
import path from "path";

type File = {
  path: string;
};

export async function webcrack(
  code: string,
  outputDir: string
): Promise<File[]> {
  try {
    const cracked = await wc(code);
    await cracked.save(outputDir);

    const output = await fs.readdir(outputDir);
    return output
      .filter((file) => file.endsWith(".js"))
      .map((file) => ({ path: path.join(outputDir, file) }));
  } catch (error) {
    // Fallback for files with syntax webcrack can't parse (e.g., decorators)
    // Just save the original file and let other plugins process it
    if (
      error instanceof SyntaxError ||
      (error as { code?: string })?.code === "BABEL_PARSER_SYNTAX_ERROR"
    ) {
      console.warn(
        "webcrack parsing failed, falling back to direct processing:",
        (error as Error).message?.split("\n")[0]
      );
      await fs.mkdir(outputDir, { recursive: true });
      const outputPath = path.join(outputDir, "deobfuscated.js");
      await fs.writeFile(outputPath, code);
      return [{ path: outputPath }];
    }
    throw error;
  }
}

import prettier from "prettier";

export default async (code: string): Promise<string> => {
  try {
    return await prettier.format(code, { parser: "babel" });
  } catch (error) {
    // If formatting fails (e.g., non-JS content), return original code
    const errorMessage = (error as Error)?.message?.split("\n")[0] ?? "Unknown error";
    console.warn(`Prettier formatting skipped: ${errorMessage}`);
    return code;
  }
};

import { defineConfig, type RolldownOptions } from "rolldown";
import { dts } from "rolldown-plugin-dts";
import packageJson from "./package.json";
import { writeFileSync } from "node:fs";

const external = [...Object.keys(packageJson.dependencies || {}), /node:.*/];

function getConfigs(): RolldownOptions[] {
  const buildConfig = {
    main: "./dist/index.js",
    module: "./dist/index.mjs",
    types: "./dist/index.d.ts",
    exports: {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.mjs",
        require: "./dist/index.cjs",
      },
    },
  };
  
  writeFileSync(
    "package.json",
    JSON.stringify(
      {
        ...packageJson,
        ...buildConfig,
      },
      null,
      2
    )
  );

  return [
    {
      input: "index.ts",
      external,
      plugins: [dts()],
      output: {
        dir: "dist",
        format: "es",
      },
    },
    {
      input: "index.ts",
      external,
      output: [
        {
          dir: "dist",
          format: "cjs",
          entryFileNames: "index.cjs",
        },
        {
          dir: "dist",
          format: "esm",
          entryFileNames: "index.mjs",
        },
      ],
    },
  ];
}

export default defineConfig(getConfigs());

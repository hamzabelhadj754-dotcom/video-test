import { Config } from "@remotion/cli/config";
import { BROWSER_EXECUTABLE } from "./scripts/browser";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
if (BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(BROWSER_EXECUTABLE);
}

import { loadFont } from "@remotion/fonts";
import { ROMAN, SANS, SERIF } from "./constants";
import {
  ROMAN_500,
  SANS_300,
  SERIF_500,
  SERIF_500_ITALIC,
  SERIF_600,
} from "./fontData";

loadFont({ family: SERIF, url: SERIF_500, format: "woff2", weight: "500" });
loadFont({
  family: SERIF,
  url: SERIF_500_ITALIC,
  format: "woff2",
  weight: "500",
  style: "italic",
});
loadFont({ family: SERIF, url: SERIF_600, format: "woff2", weight: "600" });
loadFont({ family: SANS, url: SANS_300, format: "woff2", weight: "300" });
loadFont({ family: ROMAN, url: ROMAN_500, format: "woff2", weight: "500" });

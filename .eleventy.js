import * as sass from "sass"
import fs from "node:fs"

export default function (eleventyConfig) {
  // Compile SCSS -> CSS before every build (and every --serve rebuild).
  // Only write when the output actually changed, so --serve doesn't loop.
  eleventyConfig.on("eleventy.before", () => {
    const out = "assets/css/style.css"
    const css = sass.compile("assets/scss/style.scss", { style: "compressed" }).css
    let prev = ""
    try {
      prev = fs.readFileSync(out, "utf8")
    } catch {}
    if (css !== prev) {
      fs.mkdirSync("assets/css", { recursive: true })
      fs.writeFileSync(out, css)
    }
  })
  // Rebuild when a .scss file changes (during `eleventy --serve`).
  eleventyConfig.addWatchTarget("./assets/scss/")

  // Copy static assets to _site — but NOT the scss source folder.
  eleventyConfig.addPassthroughCopy("assets/css")
  eleventyConfig.addPassthroughCopy("assets/js")
  eleventyConfig.addPassthroughCopy("assets/img")
  eleventyConfig.addPassthroughCopy("assets/fonts")

  eleventyConfig.ignores.add("assets/**")

  return {
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site",
    },
    htmlTemplateEngine: "liquid",
    markdownTemplateEngine: "liquid",
    templateFormats: ["html", "md", "njk", "liquid"],
  }
}

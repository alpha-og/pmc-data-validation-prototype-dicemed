const express = require("express");
const cors = require("cors");
const { URL } = require("url");
const cheerio = require("cheerio");

const app = express();
app.use(
  cors({
    origin: [
      "http://34.47.171.137",
      "http://34.47.171.137:80",
      "http://34.47.171.137:8080",
    ],
    credentials: true,
  }),
);

app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("Missing ?url parameter");

  try {
    console.log(`Proxying ${target}`);
    const response = await fetch(target);
    let html = await response.text();

    const baseUrl = new URL(target).origin;

    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Remove <script> tags
    $("script").remove();

    // Remove inline JS event handlers (e.g., onclick, onload, etc.)
    $("*").each((_, el) => {
      const attribs = el.attribs;
      if (!attribs) return;
      for (const attr in attribs) {
        if (attr.toLowerCase().startsWith("on")) {
          $(el).removeAttr(attr);
        }
      }
    });

    // Inject <base> for resolving relative paths
    const head = $("head");
    if (head.length) {
      head.prepend(`<base href="${baseUrl}/">`);
    }

    res.setHeader("Content-Type", "text/html");
    res.send($.html());
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch or rewrite content.");
  }
});

app.listen(process.env.PORT || 8080, () =>
  console.log(
    `Proxy server running on http://localhost:${process.env.PORT || 8080}`,
  ),
);

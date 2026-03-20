const express = require("express");
const cors = require("cors");

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();

app.use(cors());

const SHEET_ID = "1TjlTrxfRPVPV-ygyyt1SCks4rujGkoRV0z46-8zF6tg";
const SHEET_NAME = "Sheet1";

app.get("/check", async (req, res) => {
  const domain = (req.query.d || "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .trim();

  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;
    const response = await fetch(url);
    const text = await response.text();

    const json = JSON.parse(
      text.substring(text.indexOf("setResponse(") + 12, text.lastIndexOf(");"))
    );

    const rows = json.table.rows || [];

    const normalize = s => String(s || "")
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/+$/, "")
      .trim();

    for (const r of rows) {
      const domainCell = r.c?.[0]?.v ? normalize(r.c[0].v) : "";
      const statusCell = r.c?.[1]?.v ? normalize(r.c[1].v) : "";

      if (!domainCell) continue;

      if (
        domain === domainCell ||
        domain === "www." + domainCell ||
        "www." + domain === domainCell ||
        domain.includes(domainCell) ||
        domainCell.includes(domain)
      ) {
        return res.json({ allowed: statusCell !== "no" });
      }
    }

    return res.json({ allowed: false });

  } catch (err) {
    return res.json({ allowed: false });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

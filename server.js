const express = require("express");
const fetch = require("node-fetch");

const app = express();

const SHEET_ID = "1TjlTrxfRPVPV-ygyyt1SCks4rujGkoRV0z46-8zF6tg";
const SHEET_NAME = "Sheet1";

app.get("/check", async (req, res) => {
  const domain = (req.query.d || "").toLowerCase();

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
      .replace(/\/+$/, "")
      .trim();

    let allowed = false;

    for (const r of rows) {
      const cells = (r.c || [])
        .map(c => c && c.v ? String(c.v) : "")
        .map(normalize);

      for (let i = 0; i < cells.length; i++) {
        const v = cells[i];
        if (!v) continue;

        if (v === domain || v.includes(domain) || domain.includes(v)) {
          const left = i > 0 ? cells[i - 1] : "";
          if (left === "no") return res.json({ allowed: false });
          allowed = true;
        }

        if (v === "no" && cells.includes(domain)) {
          return res.json({ allowed: false });
        }
      }
    }

    res.json({ allowed });

  } catch (err) {
    res.json({ allowed: false });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
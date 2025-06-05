export default async function handler(req, res) {
  // ใส่ GAS_URL ของคุณที่นี่
  const GAS_URL = "https://script.google.com/macros/s/AKfycbxaPmzv2t4GNA3CI12oQChPI-CsuIqU2apZS11l1aYjPwa9Frv4gMadOudfLBQoNLSfRA/exec";

  // ปลดล็อก CORS ทุกกรณี
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ตอบ OPTIONS (preflight) ทันที
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // เตรียม fetch options
  const fetchOptions = {
    method: req.method,
    headers: { "Content-Type": "application/json" }
  };
  if (req.method === "POST") {
    fetchOptions.body = JSON.stringify(req.body);
  }

  // ต่อ query string ให้กับ GAS_URL กรณี GET
  let url = GAS_URL;
  if (req.method === "GET" && req.url.includes("?")) {
    url += req.url.substring(req.url.indexOf("?"));
  }

  try {
    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get("content-type");
    const data = contentType && contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (contentType && contentType.includes("application/json")) {
      res.status(200).json(data);
    } else {
      res.status(200).send(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message || "Unknown error" });
  }
}

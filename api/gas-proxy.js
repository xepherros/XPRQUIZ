export default async function handler(req, res) {
  const GAS_URL = "https://script.google.com/macros/s/AKfycbwgoLCQOBRQccg3FrLLg76wERwRHzAD2L4QBSMJGMroWSBHuOz00YPZLOZ8eCK3M2iaQw/exec";
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const fetchOptions = {
    method: req.method,
    headers: { "Content-Type": "application/json" }
  };
  if (req.method === "POST") fetchOptions.body = JSON.stringify(req.body);

  let url = GAS_URL;
  if (req.method === "GET" && req.url.includes("?")) {
    url += req.url.substring(req.url.indexOf("?"));
  }

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
}

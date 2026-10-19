// Proxy kecil untuk Vercel: meneruskan permintaan dari aplikasi ke penyedia AI,
// supaya browser tidak memblokirnya (CORS). Key hanya lewat, tidak disimpan.
// Tambahkan nama server lain di daftar ini kalau mau memakai penyedia lain.
const ALLOWED = ["discovery-api.intern-ai.org.cn"];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "Gunakan metode POST" } });
    return;
  }
  let target;
  try {
    target = new URL(String(req.headers["x-target-url"] || ""));
  } catch (e) {
    res.status(400).json({ error: { message: "x-target-url tidak valid" } });
    return;
  }
  if (target.protocol !== "https:" || !ALLOWED.includes(target.hostname)) {
    res.status(403).json({ error: { message: "Server tujuan tidak diizinkan: " + target.hostname } });
    return;
  }
  const headers = { "Content-Type": "application/json" };
  if (req.headers["authorization"]) headers["Authorization"] = req.headers["authorization"];
  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  try {
    const r = await fetch(target.toString(), { method: "POST", headers, body });
    const text = await r.text();
    res.status(r.status);
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: { message: "Proxy gagal menghubungi penyedia: " + (e && e.message || e) } });
  }
};

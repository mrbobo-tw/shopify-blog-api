export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Use POST" });
    }
  // 🔐 API Key 驗證
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const { title, body_html } = body;

    if (!title || !body_html) {
      return res.status(400).json({
        ok: false,
        error: "Missing title/body_html",
      });
    }

    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;
    const blogId = process.env.SHOPIFY_BLOG_ID;

    const resp = await fetch(
      `https://${shop}/admin/api/2026-01/blogs/${blogId}/articles.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({
  article: {
    title,
    body_html,
    author: "阿標",
    published: false
  }
})
      }
    );

    const data = await resp.json();
    return res.status(resp.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

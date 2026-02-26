export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Missing code");
  }

  const shop = process.env.SHOPIFY_SHOP;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  try {
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
        }),
      }
    );

    const data = await tokenResponse.json();

    if (data.access_token) {
      return res.status(200).send(`
        <h2>OFFLINE ACCESS TOKEN</h2>
        <pre>${data.access_token}</pre>
        <p>請把這串 token 複製起來，存到 Vercel 的環境變數。</p>
      `);
    } else {
      return res.status(400).json(data);
    }
  } catch (error) {
    return res.status(500).send("Token exchange failed");
  }
}

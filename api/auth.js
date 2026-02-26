export default function handler(req, res) {
  const shop = process.env.SHOPIFY_SHOP;
  const clientId = process.env.SHOPIFY_CLIENT_ID;

  const scopes = "read_content,write_content";
  const redirectUri = `${process.env.APP_URL}/api/callback`;
  const state = Math.random().toString(36).slice(2);

  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}` +
    `&response_type=code`;

  res.redirect(302, installUrl);
}

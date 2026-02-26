export default async function handler(req, res) {
  const shop = process.env.SHOPIFY_SHOP;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  const response = await fetch(
    `https://${shop}/admin/api/2026-01/blogs.json`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  return res.status(200).json(data);
}

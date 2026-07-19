export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Use POST",
      });
    }

    const apiKey = req.headers["x-api-key"];

    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized",
      });
    }

    const requestBody =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const {
      title,
      body_html,
      summary_html,
      seo_title,
      seo_description,
      handle,
      cover_image_url,
      cover_image_alt,
    } = requestBody;

    if (
      typeof title !== "string" ||
      typeof body_html !== "string" ||
      !title.trim() ||
      !body_html.trim()
    ) {
      return res.status(400).json({
        ok: false,
        error: "Missing or invalid title/body_html",
      });
    }

    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;
    const blogId = process.env.SHOPIFY_BLOG_ID;
    const apiVersion =
      process.env.SHOPIFY_API_VERSION || "2026-07";

    if (!shop || !token || !blogId) {
      return res.status(500).json({
        ok: false,
        error: "Missing Shopify environment variables",
      });
    }

    const graphqlBlogId = blogId.startsWith("gid://")
      ? blogId
      : `gid://shopify/Blog/${blogId}`;

    const optionalText = (value) =>
      typeof value === "string" ? value.trim() : "";

    const cleanSummary = optionalText(summary_html);
    const cleanSeoTitle = optionalText(seo_title);
    const cleanSeoDescription = optionalText(seo_description);
    const cleanHandle = optionalText(handle);
    const cleanCoverUrl = optionalText(cover_image_url);
    const cleanCoverAlt = optionalText(cover_image_alt);

    const articleInput = {
      blogId: graphqlBlogId,
      title: title.trim(),
      author: {
        name: "阿標",
      },
      body: body_html,
      isPublished: false,
    };

    if (cleanSummary) {
      articleInput.summary = cleanSummary;
    }

    if (cleanHandle) {
      articleInput.handle = cleanHandle;
    }

    if (cleanCoverUrl) {
      articleInput.image = {
        url: cleanCoverUrl,
        altText: cleanCoverAlt || title.trim(),
      };
    }

    const metafields = [];

    if (cleanSeoTitle) {
      metafields.push({
        namespace: "global",
        key: "title_tag",
        type: "single_line_text_field",
        value: cleanSeoTitle,
      });
    }

    if (cleanSeoDescription) {
      metafields.push({
        namespace: "global",
        key: "description_tag",
        type: "single_line_text_field",
        value: cleanSeoDescription,
      });
    }

    if (metafields.length > 0) {
      articleInput.metafields = metafields;
    }

    const query = `
      mutation CreateArticle($article: ArticleCreateInput!) {
        articleCreate(article: $article) {
          article {
            id
            title
            handle
            body
            summary
            isPublished
            image {
              originalSrc
              altText
            }
            metafields(first: 10) {
              nodes {
                namespace
                key
                value
              }
            }
          }
          userErrors {
            code
            field
            message
          }
        }
      }
    `;

    const shopifyResponse = await fetch(
      `https://${shop}/admin/api/${apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({
          query,
          variables: {
            article: articleInput,
          },
        }),
      }
    );

    const result = await shopifyResponse.json();

    if (!shopifyResponse.ok || result.errors?.length) {
      return res.status(502).json({
        ok: false,
        error: "Shopify GraphQL request failed",
        details: result.errors || result,
      });
    }

    const payload = result.data?.articleCreate;
    const userErrors = payload?.userErrors || [];

    if (userErrors.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "Shopify rejected the article",
        details: userErrors,
      });
    }

    const article = payload?.article;

    if (!article?.body?.trim()) {
      return res.status(502).json({
        ok: false,
        error: "Shopify created the draft without content",
      });
    }

    const seoFields = Object.fromEntries(
      (article.metafields?.nodes || [])
        .filter((item) => item.namespace === "global")
        .map((item) => [item.key, item.value])
    );

    return res.status(201).json({
      ok: true,
      article: {
        id: article.id,
        title: article.title,
        handle: article.handle,
        body_html: article.body,
        summary_html: article.summary,
        cover_image: article.image,
        seo_title: seoFields.title_tag || null,
        seo_description: seoFields.description_tag || null,
        published_at: article.isPublished ? true : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
}

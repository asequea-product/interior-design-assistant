// 👉 ENRIQUECER PRODUCTOS CON IMAGEN + LINK REAL
for (const room of parsed.rooms || []) {
  for (const item of room.items_to_improve || []) {
    const lc = item.options?.low_cost;
    const hc = item.options?.high_cost;

    // LOW COST
    if (lc?.search_query) {
      const img = await searchProductImage(lc.search_query, googleKey, googleCx);
      const productUrl = await searchProductPageRobust(lc.search_query, googleKey, googleCx);

      if (img) {
        lc.image_url = img.imageUrl;
      } else {
        console.log("❌ No image found for:", lc.search_query);
      }

      if (productUrl) {
        lc.product_url = productUrl;
      } else {
        console.log("❌ No product link found for:", lc.search_query);
      }
    }

    // HIGH COST
    if (hc?.search_query) {
      const img = await searchProductImage(hc.search_query, googleKey, googleCx);
      const productUrl = await searchProductPageRobust(hc.search_query, googleKey, googleCx);

      if (img) {
        hc.image_url = img.imageUrl;
      } else {
        console.log("❌ No image found for:", hc.search_query);
      }

      if (productUrl) {
        hc.product_url = productUrl;
      } else {
        console.log("❌ No product link found for:", hc.search_query);
      }
    }
  }
}

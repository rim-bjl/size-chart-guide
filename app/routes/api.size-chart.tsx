import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  let productId = url.searchParams.get("productId");

  if (!productId) {
    return new Response(JSON.stringify({ error: "Product ID required" }), { status: 400 });
  }

  if (!productId.startsWith("gid://")) {
    productId = `gid://shopify/Product/${productId}`;
  }

  try {
    const productWithChart = await prisma.product.findUnique({
      where: { id: productId },
      include: { chart: true }
    });

    return new Response(
      JSON.stringify({ chart: productWithChart?.chart || null }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to load size chart" }), 
      { status: 500 }
    );
  }
}
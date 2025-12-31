import { data } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import prisma from "app/db.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  try {
    const chart = await prisma.sizeChart.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return data({ chart }, { headers: CORS_HEADERS });
  } catch (error) {
    return data({ error: "Failed to fetch chart" }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  return data({ success: true }, { headers: CORS_HEADERS });
}
import { type LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  if (!productId) {
    const response = new Response(
      JSON.stringify({ error: "Product ID required" }), 
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
    return cors(request, response);
  }

  try {
    const chart = await prisma.sizeChart.findFirst({
      orderBy: { createdAt: "desc" }
    });

    if (!chart) {
      const response = new Response(
        JSON.stringify({ chart: null }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
      return cors(request, response);
    }

    const response = new Response(
      JSON.stringify({ 
        chart: {
          id: chart.id,
          name: chart.name,
          description: chart.description,
          columns: chart.columns,
          rows: chart.rows
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
    return cors(request, response);
  } catch (error) {
    console.error("Error fetching size chart:", error);
    const response = new Response(
      JSON.stringify({ error: "Failed to load size chart" }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
    return cors(request, response);
  }
}
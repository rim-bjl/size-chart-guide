import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  if (!productId) {
    return new Response(
      JSON.stringify({ error: "Product ID required" }), 
      { 
        status: 400, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        } 
      }
    );
  }

  try {
    const chart = await prisma.sizeChart.findFirst({
      orderBy: { createdAt: "desc" }
    });

    if (!chart) {
      return new Response(
        JSON.stringify({ chart: null }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        chart: {
          id: chart.id,
          name: chart.name,
          description: chart.description,
          columns: chart.columns,
          rows: chart.rows
        }
      }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        } 
      }
    );
  } catch (error) {
    console.error("Error fetching size chart:", error);
    return new Response(
      JSON.stringify({ error: "Failed to load size chart" }), 
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        } 
      }
    );
  }
}
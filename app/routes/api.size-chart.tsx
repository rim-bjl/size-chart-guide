import { LoaderFunctionArgs } from "react-router";
import prisma from "app/db.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  if (!productId) {
    const response = Response.json(
      { error: "Product ID required" }, 
      { status: 400 }
    );
    return cors(request, response);
  }

  try {
    const chart = await prisma.sizeChart.findFirst({
      orderBy: { createdAt: "desc" }
    });

    if (!chart) {
      const response = Response.json({ chart: null });
      return cors(request, response);
    }

    const response = Response.json({ 
      chart: {
        id: chart.id,
        name: chart.name,
        description: chart.description,
        columns: chart.columns,
        rows: chart.rows
      }
    });
    
    return cors(request, response);
  } catch (error) {
    console.error("Error fetching size chart:", error);
    const response = Response.json(
      { error: "Failed to load size chart" }, 
      { status: 500 }
    );
    return cors(request, response);
  }
}
import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import prisma from "app/db.server";
import { authenticate } from "app/shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);

  const body = await request.json();
  const { name, description, columns, rows } = body;

  if (!name || typeof name !== "string") {
    return data({ error: "Name is required" }, { status: 400 });
  }

  if (!Array.isArray(columns) || !Array.isArray(rows)) {
    return data({ error: "Invalid columns or rows format" }, { status: 400 });
  }

  try {
    const sizeChart = await prisma.sizeChart.create({
      data: {
        name,
        description: description || null,
        columns,
        rows,
      },
    });

    return data({ 
      success: true, 
      message: "Size chart created",
      id: sizeChart.id 
    });
  } catch (error) {
    return data({ error: "Failed to create size chart" }, { status: 500 });
  }
}
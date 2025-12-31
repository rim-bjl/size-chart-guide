import { useLoaderData, useNavigate, useFetcher } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { authenticate } from "app/shopify.server";
import prisma from "app/db.server";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Badge,
} from "@shopify/polaris";
import { EditIcon, DeleteIcon } from "@shopify/polaris-icons";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  const sizeChart = await prisma.sizeChart.findUnique({
    where: { id: params.id },
  });
  if (!sizeChart) throw new Response("Not Found", { status: 404 });
  return { sizeChart };
}

export async function action({ request, params }: ActionFunctionArgs) {
  await authenticate.admin(request);
  const formData = await request.formData();
  if (formData.get("intent") === "delete") {
    await prisma.sizeChart.delete({ where: { id: params.id } });
    return { success: true };
  }
  return { error: "Invalid intent" };
}

export default function SizeChartDetail() {
  const { sizeChart } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const isDeleting = fetcher.state !== "idle";

  return (
    <Page
      backAction={{ content: "Size Charts", url: "/app/size-charts" }}
      title={sizeChart.name}
      subtitle={sizeChart.description ?? ''}
      secondaryActions={[
        {
          content: "Edit",
          icon: EditIcon,
          onAction: () => navigate(`/app/size-charts/${sizeChart.id}/edit`),
        },
        {
          content: "Delete",
          icon: DeleteIcon,
          destructive: true,
          loading: isDeleting,
          onAction: () => {
            if (confirm("Are you sure?")) {
              fetcher.submit(
                { intent: "delete" },
                { method: "POST" }
              );
            }
          },
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Size Chart Table</Text>
              <DataTable
                columnContentTypes={sizeChart.columns.map(() => "text")}
                headings={sizeChart.columns as string[]}
                rows={sizeChart.rows as string[][]}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Details</Text>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">Created At</Text>
                <Text as="p" variant="bodyMd">
                  {new Date(sizeChart.createdAt).toLocaleString()}
                </Text>
              </BlockStack>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">System ID</Text>
                <InlineStack align="start">
                  <Badge tone="info">{sizeChart.id}</Badge>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
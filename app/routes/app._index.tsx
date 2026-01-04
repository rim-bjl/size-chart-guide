import { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  InlineStack,
  Box,
  Divider,
} from "@shopify/polaris";
import { PlusIcon, ListBulletedIcon, ClockIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  
  const chartCount = await prisma.sizeChart.count();
  const latestCharts = await prisma.sizeChart.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  return { chartCount, latestCharts };
};

export default function Index() {
  const { chartCount, latestCharts } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <Page title="Size Chart Guide">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">Dashboard Overview</Text>
                  <Text as="p" tone="subdued">Manage your store's size guides from one place.</Text>
                </BlockStack>
                <Button 
                  variant="primary" 
                  icon={PlusIcon} 
                  onClick={() => navigate("/app/size-charts/new")}
                >
                  Create New Chart
                </Button>
              </InlineStack>
              
              <Divider />
              
              <InlineStack gap="1000">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Total Charts</Text>
                  <Text as="p" variant="headingLg">{chartCount}</Text>
                </BlockStack>
                <Button variant="tertiary" icon={ListBulletedIcon} onClick={() => navigate("/app/size-charts")}>
                  View All Charts
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <InlineStack gap="200">
                <Box>
                  <ClockIcon style={{ width: '20px', height: '20px' }} />
                </Box>
                <Text as="h2" variant="headingSm">Recently Created</Text>
              </InlineStack>
              {latestCharts.length > 0 ? (
                latestCharts.map((chart) => (
                  <Box 
                    key={chart.id} 
                    padding="200" 
                    background="bg-surface-secondary" 
                    borderRadius="200"
                  >
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd" fontWeight="bold">{chart.name}</Text>
                      <Button variant="plain" onClick={() => navigate(`/app/size-charts/${chart.id}`)}>
                        View
                      </Button>
                    </InlineStack>
                  </Box>
                ))
              ) : (
                <Text as="p" tone="subdued">No charts created yet.</Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
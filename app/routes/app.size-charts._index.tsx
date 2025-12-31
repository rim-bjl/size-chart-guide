import { useLoaderData, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  EmptyState,
  Text,
  Button,
} from "@shopify/polaris";
import { PlusIcon, ViewIcon, EditIcon } from "@shopify/polaris-icons";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  
  const sizeCharts = await prisma.sizeChart.findMany({
    orderBy: { createdAt: "desc" },
  });
  
  return { sizeCharts };
}

export default function SizeChartsIndex() {
  const { sizeCharts } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const resourceName = {
    singular: 'size chart',
    plural: 'size charts',
  };

  if (sizeCharts.length === 0) {
    return (
      <Page title="Size Charts">
        <EmptyState
          heading="Manage size guides for your products"
          action={{
            content: 'Create Size Chart',
            onAction: () => navigate("/app/size-charts/new"),
            icon: PlusIcon
          }}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Create your first size chart to help customers find the right fit.</p>
        </EmptyState>
      </Page>
    );
  }


  const rowMarkup = sizeCharts.map(
    ({ id, name, description, createdAt }, index) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {name}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{description || "—"}</IndexTable.Cell>
        <IndexTable.Cell>{new Date(createdAt).toLocaleDateString()}</IndexTable.Cell>
        <IndexTable.Cell>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button 
              icon={ViewIcon} 
              onClick={() => navigate(`/app/size-charts/${id}`)} 
              accessibilityLabel="View"
            />
            <Button 
              icon={EditIcon} 
              onClick={() => navigate(`/app/size-charts/${id}/edit`)} 
              accessibilityLabel="Edit"
            />
          </div>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Page 
      title="Size Charts" 
      subtitle="Manage size guides for your products"
      primaryAction={{
        content: 'Create Size Chart',
        onAction: () => navigate("/app/size-charts/new"),
        icon: PlusIcon
      }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <IndexTable
              resourceName={resourceName}
              itemCount={sizeCharts.length}
              headings={[
                { title: 'Name' },
                { title: 'Description' },
                { title: 'Created' },
                { title: 'Actions', alignment: 'end' },
              ]}
              selectable={false}
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
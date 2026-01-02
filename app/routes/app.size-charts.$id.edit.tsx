import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, useFetcher } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { authenticate } from "app/shopify.server";
import prisma from "app/db.server";
import {
  Page,
  Layout,
  Card,
  TextField,
  BlockStack,
  Button,
  InlineStack,
  Box,
  Text,
  Divider,
} from "@shopify/polaris";
import { PlusIcon, DeleteIcon, SaveIcon, ProductIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  const sizeChart = await prisma.sizeChart.findUnique({
    where: { id: params.id },
    include: { products: true }
  });
  if (!sizeChart) throw new Response("Not Found", { status: 404 });
  return { sizeChart };
}

export async function action({ request, params }: ActionFunctionArgs) {
  await authenticate.admin(request);
  const body = await request.json();
  const { name, description, columns, rows, productIds } = body;
  
  try {
    await prisma.sizeChart.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        columns,
        rows,
        products: {
          set: (productIds || []).map((id: string) => ({ id })),
          connectOrCreate: (productIds || []).map((id: string) => ({
            where: { id },
            create: { id },
          })),
        },
      },
    });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}

export default function EditSizeChart() {
  const { sizeChart } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [name, setName] = useState(sizeChart.name);
  const [description, setDescription] = useState(sizeChart.description || "");
  const [columns, setColumns] = useState<string[]>(sizeChart.columns as string[]);
  const [rows, setRows] = useState<string[][]>(sizeChart.rows as string[][]);
  const [newColumnName, setNewColumnName] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    sizeChart.products.map(p => p.id)
  );

  const isSubmitting = fetcher.state !== "idle";

  const addColumn = () => {
    if (newColumnName.trim()) {
      setColumns([...columns, newColumnName]);
      setRows(rows.map((row) => [...row, ""]));
      setNewColumnName("");
    }
  };

  const handleSelectProducts = async () => {
    const selection = await shopify.resourcePicker({
      type: "product",
      multiple: true,
      selectionIds: selectedProductIds.map(id => ({ id }))
    });
    if (selection) setSelectedProductIds(selection.map(p => p.id));
  };

  const handleSubmit = () => {
    fetcher.submit(
      { name, description, columns, rows, productIds: selectedProductIds },
      { method: "POST", encType: "application/json" }
    );
  };

  useEffect(() => {
    if (fetcher.data?.success) navigate(`/app/size-charts/${sizeChart.id}`);
  }, [fetcher.data, navigate, sizeChart.id]);

  return (
    <Page
      backAction={{ content: "Back", url: `/app/size-charts/${sizeChart.id}` }}
      title={`Edit ${sizeChart.name}`}
      primaryAction={{
        content: "Save Changes",
        icon: SaveIcon,
        loading: isSubmitting,
        onAction: handleSubmit,
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <TextField label="Chart Name" value={name} onChange={setName} autoComplete="off" />
                <TextField label="Description" value={description} onChange={setDescription} multiline={3} autoComplete="off" />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingSm">Linked Products</Text>
                <InlineStack gap="300">
                  <Button icon={ProductIcon} onClick={handleSelectProducts}>Change Products</Button>
                  <Text as="span" variant="bodyMd" fontWeight="bold">
                    {selectedProductIds.length} products linked
                  </Text>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingSm">Columns</Text>
                <InlineStack gap="200">
                  {columns.map((col, i) => (
                    <TextField key={i} label="Col" labelHidden value={col} onChange={(v) => {
                      const n = [...columns]; n[i] = v; setColumns(n);
                    }} connectedRight={columns.length > 1 && <Button icon={DeleteIcon} tone="critical" onClick={() => {
                      setColumns(columns.filter((_, idx) => idx !== i));
                      setRows(rows.map(r => r.filter((_, idx) => idx !== i)));
                    }} />} />
                  ))}
                </InlineStack>
                <Divider />
                <InlineStack gap="200">
                  <Box minWidth="240px">
                    <TextField label="New" labelHidden value={newColumnName} onChange={setNewColumnName} placeholder="Add measurement" />
                  </Box>
                  <Button icon={PlusIcon} onClick={addColumn}>Add Column</Button>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card padding="0">
              <Box padding="400"><Text as="h2" variant="headingSm">Data</Text></Box>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--p-color-bg-surface-secondary)" }}>
                      {columns.map((col, i) => <th key={i} style={{ padding: "12px 8px", textAlign: "left" }}>{col}</th>)}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} style={{ borderTop: "1px solid var(--p-color-border-secondary)" }}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} style={{ padding: "8px" }}>
                            <TextField label="c" labelHidden value={cell} onChange={(v) => {
                              const n = [...rows]; n[rIdx][cIdx] = v; setRows(n);
                            }} />
                          </td>
                        ))}
                        <td><Button icon={DeleteIcon} variant="tertiary" tone="critical" onClick={() => setRows(rows.filter((_, i) => i !== rIdx))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Box padding="400"><Button variant="plain" icon={PlusIcon} onClick={() => setRows([...rows, new Array(columns.length).fill("")])}>Add Row</Button></Box>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
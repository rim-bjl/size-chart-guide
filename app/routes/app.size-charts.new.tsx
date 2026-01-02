import { useState, useCallback, useEffect } from "react";
import { useFetcher, useNavigate } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import {
  Page,
  Layout,
  Card,
  TextField,
  BlockStack,
  Tabs,
  DataTable,
  Button,
  InlineStack,
  Box,
  Text,
  Divider,
} from "@shopify/polaris";
import { PlusIcon, DeleteIcon, SaveIcon, ProductIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import prisma from "app/db.server";
import { authenticate } from "app/shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);
  const body = await request.json();
  const { name, description, columns, rows, productIds } = body;

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const sizeChart = await prisma.sizeChart.create({
      data: {
        name,
        description: description || null,
        columns,
        rows,
        products: {
          connectOrCreate: (productIds || []).map((id: string) => ({
            where: { id },
            create: { id },
          })),
        },
      },
    });
    return Response.json({ success: true, id: sizeChart.id });
  } catch (error) {
    return Response.json({ error: "Failed to create size chart" }, { status: 500 });
  }
}

export default function NewSizeChartPage() {
  const shopify = useAppBridge();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [columns, setColumns] = useState<string[]>(["Size", "Chest (in)", "Waist (in)"]);
  const [rows, setRows] = useState<string[][]>([
    ["S", "34-36", "28-30"],
    ["M", "38-40", "32-34"],
  ]);
  const [newColumnName, setNewColumnName] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const isSubmitting = fetcher.state !== "idle";

  const tabs = [
    { id: "chart", content: "Chart Data" },
    { id: "display", content: "Preview" },
  ];

  const handleTabChange = useCallback((index: number) => setSelectedTab(index), []);

  const addColumn = () => {
    if (newColumnName.trim()) {
      setColumns([...columns, newColumnName]);
      setRows(rows.map((row) => [...row, ""]));
      setNewColumnName("");
    }
  };

  const removeColumn = (index: number) => {
    if (columns.length > 1) {
      setColumns(columns.filter((_, i) => i !== index));
      setRows(rows.map((row) => row.filter((_, i) => i !== index)));
    }
  };

  const updateColumnName = (index: number, value: string) => {
    const newCols = [...columns];
    newCols[index] = value;
    setColumns(newCols);
  };

  const addRow = () => setRows([...rows, new Array(columns.length).fill("")]);

  const removeRow = (index: number) => {
    if (rows.length > 1) setRows(rows.filter((_, i) => i !== index));
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex][colIndex] = value;
    setRows(newRows);
  };

  const handleSelectProducts = async () => {
    const selection = await shopify.resourcePicker({
      type: "product",
      multiple: true,
    });
    if (selection) {
      setSelectedProductIds(selection.map((p) => p.id));
    }
  };

  const handleSubmit = () => {
    fetcher.submit(
      { name, description, columns, rows, productIds: selectedProductIds },
      { method: "POST", encType: "application/json" }
    );
  };

  useEffect(() => {
    if (fetcher.data?.success) {
      navigate("/app/size-charts");
    }
  }, [fetcher.data, navigate]);

  return (
    <Page
      backAction={{ content: "Size Charts", url: "/app/size-charts" }}
      title="Create Size Chart"
      primaryAction={{
        content: "Save Chart",
        icon: SaveIcon,
        loading: isSubmitting,
        onAction: handleSubmit,
      }}
    >
      <Layout>
        <Layout.Section>
          <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
            <Box paddingBlockStart="400">
              {selectedTab === 0 ? (
                <BlockStack gap="400">
                  <Card>
                    <BlockStack gap="400">
                      <TextField
                        label="Chart Name"
                        value={name}
                        onChange={setName}
                        autoComplete="off"
                        placeholder="e.g. Men's T-Shirt"
                      />
                      <TextField
                        label="Description"
                        value={description}
                        onChange={setDescription}
                        multiline={3}
                        autoComplete="off"
                      />
                    </BlockStack>
                  </Card>

                  <Card>
                    <BlockStack gap="300">
                      <Text as="h2" variant="headingSm">Linked Products</Text>
                      <Text as="p" tone="subdued">Select which products will display this size chart.</Text>
                      <InlineStack gap="300">
                        <Button icon={ProductIcon} onClick={handleSelectProducts}>
                          Select Products
                        </Button>
                        {selectedProductIds.length > 0 && (
                          <Text as="span" variant="bodyMd" fontWeight="bold">
                            {selectedProductIds.length} products selected
                          </Text>
                        )}
                      </InlineStack>
                    </BlockStack>
                  </Card>

                  <Card>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingSm">Measurements (Columns)</Text>
                      <InlineStack gap="200">
                        {columns.map((col, i) => (
                          <div key={i} style={{ display: "flex", gap: "4px" }}>
                            <TextField
                              label="Column"
                              labelHidden
                              value={col}
                              onChange={(val) => updateColumnName(i, val)}
                              autoComplete="off"
                              connectedRight={
                                columns.length > 1 && (
                                  <Button
                                    icon={DeleteIcon}
                                    tone="critical"
                                    onClick={() => removeColumn(i)}
                                  />
                                )
                              }
                            />
                          </div>
                        ))}
                      </InlineStack>
                      <Divider />
                      <InlineStack gap="200">
                        <Box minWidth="200px">
                          <TextField
                            label="New Column"
                            labelHidden
                            placeholder="Add measurement..."
                            value={newColumnName}
                            onChange={setNewColumnName}
                            autoComplete="off"
                          />
                        </Box>
                        <Button icon={PlusIcon} onClick={addColumn}>Add</Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>

                  <Card padding="0">
                    <Box padding="400">
                      <Text as="h2" variant="headingSm">Size Data</Text>
                    </Box>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--p-color-bg-surface-secondary)" }}>
                          {columns.map((col, i) => (
                            <th key={i} style={{ padding: "8px", textAlign: "left" }}>
                              <Text as="span" variant="bodySm" fontWeight="bold">{col}</Text>
                            </th>
                          ))}
                          <th style={{ width: "50px" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, rowIndex) => (
                          <tr key={rowIndex} style={{ borderTop: "1px solid var(--p-color-border-secondary)" }}>
                            {row.map((cell, colIndex) => (
                              <td key={colIndex} style={{ padding: "4px 8px" }}>
                                <TextField
                                  label="cell"
                                  labelHidden
                                  value={cell}
                                  onChange={(val) => updateCell(rowIndex, colIndex, val)}
                                  autoComplete="off"
                                />
                              </td>
                            ))}
                            <td style={{ textAlign: "center" }}>
                              <Button
                                icon={DeleteIcon}
                                variant="tertiary"
                                tone="critical"
                                onClick={() => removeRow(rowIndex)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <Box padding="400">
                      <Button variant="plain" icon={PlusIcon} onClick={addRow}>Add Row</Button>
                    </Box>
                  </Card>
                </BlockStack>
              ) : (
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingLg">{name || "Chart Preview"}</Text>
                    <Text as="p" tone="subdued">{description}</Text>
                    <DataTable
                      columnContentTypes={columns.map(() => "text")}
                      headings={columns}
                      rows={rows}
                    />
                  </BlockStack>
                </Card>
              )}
            </Box>
          </Tabs>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
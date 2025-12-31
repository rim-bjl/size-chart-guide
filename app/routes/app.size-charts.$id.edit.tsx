import { useState } from "react";
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
import { PlusIcon, DeleteIcon, SaveIcon } from "@shopify/polaris-icons";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  const sizeChart = await prisma.sizeChart.findUnique({
    where: { id: params.id },
  });
  if (!sizeChart) {
    throw new Response("Not Found", { status: 404 });
  }
  return { sizeChart };
}

export async function action({ request, params }: ActionFunctionArgs) {
  await authenticate.admin(request);
  const body = await request.json();
  const { name, description, columns, rows } = body;
  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  try {
    await prisma.sizeChart.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        columns,
        rows,
      },
    });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to update size chart" }, { status: 500 });
  }
}

export default function EditSizeChart() {
  const { sizeChart } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [name, setName] = useState(sizeChart.name);
  const [description, setDescription] = useState(sizeChart.description || "");
  const [columns, setColumns] = useState<string[]>(sizeChart.columns as string[]);
  const [rows, setRows] = useState<string[][]>(sizeChart.rows as string[][]);
  const [newColumnName, setNewColumnName] = useState("");

  const isSubmitting = fetcher.state !== "idle";

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

  const addRow = () => {
    setRows([...rows, new Array(columns.length).fill("")]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex][colIndex] = value;
    setRows(newRows);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    fetcher.submit(
      { name, description, columns, rows },
      { method: "POST", encType: "application/json" }
    );
  };

  if (fetcher.data?.success) {
    navigate(`/app/size-charts/${sizeChart.id}`);
  }

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
              <BlockStack gap="400">
                <Text as="h2" variant="headingSm">Measurements (Columns)</Text>
                <InlineStack gap="200">
                  {columns.map((col, i) => (
                    <TextField
                      key={i}
                      label="Column name"
                      labelHidden
                      value={col}
                      onChange={(val) => updateColumnName(i, val)}
                      autoComplete="off"
                      connectedRight={
                        columns.length > 1 && (
                          <Button
                            icon={DeleteIcon}
                            tone="destructive"
                            onClick={() => removeColumn(i)}
                          />
                        )
                      }
                    />
                  ))}
                </InlineStack>
                <Divider />
                <InlineStack gap="200">
                  <Box minWidth="240px">
                    <TextField
                      label="New Column"
                      labelHidden
                      placeholder="Add measurement (e.g. Length)"
                      value={newColumnName}
                      onChange={setNewColumnName}
                      autoComplete="off"
                    />
                  </Box>
                  <Button icon={PlusIcon} onClick={addColumn}>Add Column</Button>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card padding="0">
              <Box padding="400">
                <Text as="h2" variant="headingSm">Size Data</Text>
              </Box>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--p-color-bg-surface-secondary)" }}>
                      {columns.map((col, i) => (
                        <th key={i} style={{ padding: "12px 8px", textAlign: "left" }}>
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
                          <td key={colIndex} style={{ padding: "8px" }}>
                            <TextField
                              label="Cell data"
                              labelHidden
                              value={cell}
                              onChange={(val) => updateCell(rowIndex, colIndex, val)}
                              autoComplete="off"
                            />
                          </td>
                        ))}
                        <td style={{ textAlign: "center", padding: "8px" }}>
                          <Button
                            icon={DeleteIcon}
                            variant="tertiary"
                            tone="destructive"
                            onClick={() => removeRow(rowIndex)}
                            disabled={rows.length <= 1}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Box padding="400">
                <Button variant="plain" icon={PlusIcon} onClick={addRow}>Add Row</Button>
              </Box>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
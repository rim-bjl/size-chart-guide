-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "chartId" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "SizeChart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

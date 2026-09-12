-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN "hourlyRate" DECIMAL;

-- CreateTable
CREATE TABLE "Tally" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "signedTrips" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tally_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "seq" INTEGER NOT NULL,
    "paperSerial" TEXT NOT NULL,
    "issuerSupplierId" TEXT,
    "date" DATETIME NOT NULL,
    "materialId" TEXT,
    "materialName" TEXT NOT NULL,
    "truckId" TEXT,
    "truckPlate" TEXT NOT NULL,
    "trips" INTEGER NOT NULL DEFAULT 1,
    "qtyM3" DECIMAL NOT NULL,
    "deductionM3" DECIMAL NOT NULL DEFAULT 0,
    "netM3" DECIMAL NOT NULL,
    "materialPrice" DECIMAL NOT NULL DEFAULT 0,
    "haulagePrice" DECIMAL NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'LYD',
    "fxRate" DECIMAL NOT NULL DEFAULT 1,
    "photoPath" TEXT,
    "tallyId" TEXT,
    "overTallyReason" TEXT,
    "cancelReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bon_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Bon_issuerSupplierId_fkey" FOREIGN KEY ("issuerSupplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bon_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bon_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bon_tallyId_fkey" FOREIGN KEY ("tallyId") REFERENCES "Tally" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BonPayableLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bonId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "amountNative" DECIMAL NOT NULL,
    "fxRate" DECIMAL NOT NULL DEFAULT 1,
    "amountLyd" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BonPayableLine_bonId_fkey" FOREIGN KEY ("bonId") REFERENCES "Bon" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BonPayableLine_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'LYD',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "penaltyAmount" DECIMAL NOT NULL DEFAULT 0,
    "penaltyReason" TEXT,
    "walletId" TEXT,
    "paidAmountNative" DECIMAL NOT NULL DEFAULT 0,
    "paidFxRate" DECIMAL NOT NULL DEFAULT 1,
    "paidAmountLyd" DECIMAL NOT NULL DEFAULT 0,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Settlement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Settlement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Settlement_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SettlementBon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settlementId" TEXT NOT NULL,
    "bonId" TEXT NOT NULL,
    "lineType" TEXT NOT NULL,
    "amountNative" DECIMAL NOT NULL,
    "amountLyd" DECIMAL NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SettlementBon_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SettlementBon_bonId_fkey" FOREIGN KEY ("bonId") REFERENCES "Bon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierAdvance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'LYD',
    "amountNative" DECIMAL NOT NULL,
    "amountLyd" DECIMAL NOT NULL,
    "remainingNative" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierAdvance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplierAdvance_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SettlementAdvance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settlementId" TEXT NOT NULL,
    "advanceId" TEXT NOT NULL,
    "amountNative" DECIMAL NOT NULL,
    CONSTRAINT "SettlementAdvance_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SettlementAdvance_advanceId_fkey" FOREIGN KEY ("advanceId") REFERENCES "SupplierAdvance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WalletMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amountNative" DECIMAL NOT NULL,
    "fxRate" DECIMAL NOT NULL DEFAULT 1,
    "amountLyd" DECIMAL NOT NULL,
    "note" TEXT,
    "refType" TEXT,
    "refId" TEXT,
    "confirmedByMp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletMovement_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Custody" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "balanceNative" DECIMAL NOT NULL DEFAULT 0,
    "balanceLyd" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Custody_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Custody_personId_fkey" FOREIGN KEY ("personId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Custody_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "amountNative" DECIMAL NOT NULL,
    "fxRate" DECIMAL NOT NULL DEFAULT 1,
    "amountLyd" DECIMAL NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'LYD',
    "walletId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Expense_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquipmentLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "actualHours" DECIMAL NOT NULL,
    "standardHours" DECIMAL NOT NULL,
    "unitRate" DECIMAL NOT NULL,
    "cashCostLyd" DECIMAL NOT NULL,
    "booksChargeLyd" DECIMAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EquipmentLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EquipmentLog_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChartAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "memo" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debitLyd" DECIMAL NOT NULL DEFAULT 0,
    "creditLyd" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "JournalLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "settlementId" TEXT,
    "kind" TEXT NOT NULL,
    "amountLyd" DECIMAL NOT NULL,
    "memo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amountNative" DECIMAL NOT NULL,
    "fxRate" DECIMAL NOT NULL DEFAULT 1,
    "amountLyd" DECIMAL NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Collection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Collection_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PartnerDistribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalSurplusLyd" DECIMAL NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerDistribution_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PartnerDistributionLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "distributionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sharePercent" DECIMAL NOT NULL,
    "grossLyd" DECIMAL NOT NULL,
    "managementLyd" DECIMAL NOT NULL DEFAULT 0,
    "loanRecoveryLyd" DECIMAL NOT NULL DEFAULT 0,
    "netLyd" DECIMAL NOT NULL,
    CONSTRAINT "PartnerDistributionLine_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "PartnerDistribution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CloseoutItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CloseoutItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PartnerShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sharePercent" DECIMAL NOT NULL,
    "managementPercent" DECIMAL NOT NULL DEFAULT 0,
    "capital" DECIMAL NOT NULL DEFAULT 0,
    "loanBalance" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PartnerShare_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PartnerShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PartnerShare" ("createdAt", "id", "projectId", "sharePercent", "updatedAt", "userId") SELECT "createdAt", "id", "projectId", "sharePercent", "updatedAt", "userId" FROM "PartnerShare";
DROP TABLE "PartnerShare";
ALTER TABLE "new_PartnerShare" RENAME TO "PartnerShare";
CREATE UNIQUE INDEX "PartnerShare_projectId_userId_key" ON "PartnerShare"("projectId", "userId");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "logo" TEXT,
    "location" TEXT,
    "contractValue" DECIMAL NOT NULL,
    "retentionPercent" DECIMAL NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Project" ("contractValue", "createdAt", "id", "location", "logo", "name", "status", "taxable", "tradeName", "updatedAt") SELECT "contractValue", "createdAt", "id", "location", "logo", "name", "status", "taxable", "tradeName", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE TABLE "new_RateCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "materialId" TEXT,
    "materialName" TEXT NOT NULL,
    "materialPrice" DECIMAL NOT NULL,
    "haulagePrice" DECIMAL NOT NULL,
    "quarrySupplierId" TEXT,
    "carrierSupplierId" TEXT,
    "effectiveFrom" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RateCard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RateCard_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RateCard_quarrySupplierId_fkey" FOREIGN KEY ("quarrySupplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RateCard_carrierSupplierId_fkey" FOREIGN KEY ("carrierSupplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RateCard" ("createdAt", "effectiveFrom", "haulagePrice", "id", "materialName", "materialPrice", "projectId", "updatedAt") SELECT "createdAt", "effectiveFrom", "haulagePrice", "id", "materialName", "materialPrice", "projectId", "updatedAt" FROM "RateCard";
DROP TABLE "RateCard";
ALTER TABLE "new_RateCard" RENAME TO "RateCard";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Bon_projectId_seq_key" ON "Bon"("projectId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "Bon_issuerSupplierId_paperSerial_key" ON "Bon"("issuerSupplierId", "paperSerial");

-- CreateIndex
CREATE UNIQUE INDEX "BonPayableLine_bonId_type_key" ON "BonPayableLine"("bonId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementBon_settlementId_bonId_lineType_key" ON "SettlementBon"("settlementId", "bonId", "lineType");

-- CreateIndex
CREATE UNIQUE INDEX "Custody_projectId_personId_currencyId_key" ON "Custody"("projectId", "personId", "currencyId");

-- CreateIndex
CREATE UNIQUE INDEX "ChartAccount_code_key" ON "ChartAccount"("code");

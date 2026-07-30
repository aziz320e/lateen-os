/**
 * Scenario 7 — inventory flowing into the general ledger, composed only
 * through each engine's own real, public runtime API:
 *
 *   Inventory Catalog item -> received into the seeded Warehouse
 *     (stock on-hand increased + a real FIFO cost layer recorded)
 *     -> Sale (stock on-hand decreased + a real FIFO valuation issue)
 *     -> Finance journal entry recognizing Cost of Goods Sold, using the
 *        real cost the valuation engine computed — not a guessed number.
 */
import { describe, expect, it } from 'vitest';
import { createSeededWorld } from './business-fixtures.js';

describe('Scenario 7: Inventory -> Warehouse -> Sale -> Valuation -> Finance', () => {
  it('receives stock, sells it, and posts a real FIFO-costed COGS journal entry', async () => {
    const world = await createSeededWorld();
    const { organizationId, warehouse, accounts, runtimes } = world;
    const { inventory, finance } = runtimes;

    // --- Inventory item ---
    const item = await inventory.catalog.create(organizationId, {
      sku: 'SKU-ALU-COMPOSITE-4X8',
      name: 'Aluminum Composite Panel 4x8',
      unitOfMeasure: 'each',
    });

    // --- Receive stock into the seeded warehouse ---
    await inventory.stock.increaseOnHand(organizationId, item.id, warehouse.id, '50');
    await inventory.valuation.recordReceipt(organizationId, {
      itemId: item.id,
      warehouseId: warehouse.id,
      quantity: '50',
      unitCost: '38.00',
    });
    const afterReceipt = await inventory.stock.getByItemAndWarehouse(
      organizationId,
      item.id,
      warehouse.id,
    );
    expect(Number(afterReceipt?.quantityOnHand)).toBe(50);

    // --- Sale: 20 units leave the warehouse ---
    await inventory.stock.decreaseOnHand(organizationId, item.id, warehouse.id, '20');
    const issue = await inventory.valuation.recordIssue(organizationId, {
      itemId: item.id,
      warehouseId: warehouse.id,
      quantity: '20',
      method: 'fifo',
    });
    expect(issue.method).toBe('fifo');
    expect(Number(issue.totalValue)).toBeCloseTo(20 * 38.0, 2);

    const afterSale = await inventory.stock.getByItemAndWarehouse(
      organizationId,
      item.id,
      warehouse.id,
    );
    expect(Number(afterSale?.quantityOnHand)).toBe(30);

    // --- Finance: recognize the real, computed COGS ---
    const journalEntry = await finance.generalLedger.createJournalEntry(organizationId, {
      entryDate: '2026-02-20',
      memo: `COGS for ${item.sku} issue ${issue.id}`,
      currency: 'USD',
      lines: [
        {
          accountId: accounts.costOfGoodsSold.id,
          debit: issue.totalValue,
          credit: '0.00',
          description: 'COGS',
        },
        {
          accountId: accounts.inventory.id,
          debit: '0.00',
          credit: issue.totalValue,
          description: 'Inventory reduction',
        },
      ],
    });
    const posted = await finance.generalLedger.postJournalEntry(organizationId, journalEntry.id);
    expect(posted.status).toBe('posted');

    const { entries } = await finance.queries.findJournalEntries({ organizationId });
    expect(entries.some((entry) => entry.id === posted.id)).toBe(true);
  });
});

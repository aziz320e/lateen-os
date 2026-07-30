/**
 * Scenario 6 — the full commercial pipeline, composed only through each
 * engine's own real, public runtime API:
 *
 *   CRM Lead -> qualified -> converted to a real Customer
 *     -> Sales Opportunity (won)
 *     -> Sales Quote (referencing the opportunity + customer)
 *     -> Finance AR Invoice (referencing the opportunity as its source)
 *     -> issued -> paid
 *     -> General Ledger journal entry (posted, balanced)
 *     -> Analytics KPI snapshot (real revenue recorded)
 *
 * Every step is a real call into the owning engine's runtime — no
 * repository access, no fabricated entities, no engine modified to
 * accommodate this test.
 */
import { describe, expect, it } from 'vitest';
import { createSeededWorld } from './business-fixtures.js';

describe('Scenario 6: Lead -> Opportunity -> Quote -> Sale -> Invoice -> Payment -> Journal Entry -> Analytics', () => {
  it('runs the full commercial pipeline across CRM, Sales, Finance, and Analytics', async () => {
    const world = await createSeededWorld();
    const { organizationId, runtimes, accounts } = world;
    const { crm, sales, finance, analytics } = runtimes;

    // --- Lead ---
    const lead = await crm.leads.create(organizationId, {
      name: 'Marina Cole',
      email: 'marina.cole@harborview-hotels.example',
      company: 'Harborview Hotels',
      source: 'referral',
    });
    expect(lead.status).toBe('new');

    const qualified = await crm.leads.qualify(organizationId, lead.id);
    expect(qualified.status).toBe('qualified');

    const { lead: convertedLead, customer } = await crm.leads.convert(organizationId, lead.id, {
      company: 'Harborview Hotels',
    });
    expect(convertedLead.status).toBe('converted');
    expect(customer.name).toBe('Marina Cole');
    expect(customer.sourceLeadId).toBe(lead.id);

    // --- Opportunity ---
    const opportunity = await sales.opportunities.create(organizationId, {
      name: 'Harborview Hotels — Lobby & Exterior Signage',
      customerId: customer.id,
      amount: '4200.00',
      currency: 'USD',
      source: 'referral',
    });
    await sales.opportunities.qualify(organizationId, opportunity.id);
    await sales.opportunities.propose(organizationId, opportunity.id);
    await sales.opportunities.negotiate(organizationId, opportunity.id);
    const won = await sales.opportunities.closeWon(organizationId, opportunity.id, '4200.00');
    expect(won.stage).toBe('won');

    // --- Quote ---
    const quote = await sales.quotes.createQuote(organizationId, {
      title: 'Harborview Hotels — Signage Quote',
      opportunityId: opportunity.id,
      customerId: customer.id,
      currency: 'USD',
      lineItems: [
        { description: 'Illuminated lobby sign', quantity: '1', unitPrice: '2800.00' },
        { description: 'Exterior directional signage set', quantity: '1', unitPrice: '1400.00' },
      ],
    });
    expect(Number(quote.totals.total)).toBe(4200);

    // --- Sale / Invoice ---
    const arCustomer = await finance.accountsReceivable.createCustomer(organizationId, {
      displayName: customer.name,
      externalCustomerId: customer.id,
      currency: 'USD',
    });
    const invoice = await finance.accountsReceivable.createInvoice(organizationId, {
      customerId: arCustomer.id,
      currency: 'USD',
      sourceOpportunityId: opportunity.id,
      lines: [
        { description: 'Illuminated lobby sign', quantity: '1', unitPrice: '2800.00' },
        { description: 'Exterior directional signage set', quantity: '1', unitPrice: '1400.00' },
      ],
    });
    expect(Number(invoice.total)).toBe(4200);
    expect(invoice.sourceOpportunityId).toBe(opportunity.id);

    const issued = await finance.accountsReceivable.issueInvoice(
      organizationId,
      invoice.id,
      '2026-02-10',
    );
    expect(issued.status).toBe('issued');

    // --- Payment ---
    const payment = await finance.accountsReceivable.recordPayment(organizationId, invoice.id, {
      amount: '4200.00',
      paidAt: '2026-02-18T00:00:00.000Z',
      method: 'bank_transfer',
    });
    expect(payment.amount).toBe('4200.00');
    const paidInvoice = await finance.accountsReceivable.getInvoice(organizationId, invoice.id);
    expect(paidInvoice?.status).toBe('paid');
    expect(Number(paidInvoice?.balanceDue)).toBe(0);

    // --- Journal Entry ---
    const journalEntry = await finance.generalLedger.createJournalEntry(organizationId, {
      entryDate: '2026-02-18',
      memo: `Revenue recognition — invoice ${invoice.id}`,
      currency: 'USD',
      lines: [
        {
          accountId: accounts.cash.id,
          debit: '4200.00',
          credit: '0.00',
          description: 'Cash received',
        },
        {
          accountId: accounts.revenue.id,
          debit: '0.00',
          credit: '4200.00',
          description: 'Signage revenue',
        },
      ],
    });
    const posted = await finance.generalLedger.postJournalEntry(organizationId, journalEntry.id);
    expect(posted.status).toBe('posted');

    // --- Analytics ---
    const kpi = await analytics.kpis.recordRevenue(organizationId, {
      value: 4200,
      context: { source: 'scenario-6', invoiceId: invoice.id },
    });
    expect(kpi.value).toBe(4200);

    const { kpis, total } = await analytics.queries.findKPIs({ organizationId });
    expect(total).toBeGreaterThan(0);
    expect(kpis.some((snapshot) => snapshot.id === kpi.id)).toBe(true);
  });
});

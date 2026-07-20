'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, CheckCircle2, ChevronRight, Globe, Loader2, Sparkles, Users } from 'lucide-react';
import { fetchProfiles, startProvisioning } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const STEPS = ['Organization', 'Industry', 'Locale', 'Employees', 'Extensions', 'AI Workers', 'Finish'] as const;

export default function SetupWizardPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    organizationName: '',
    profile: 'printing',
    industry: 'printing',
    country: 'SA',
    timezone: 'Asia/Riyadh',
    currency: 'SAR',
    language: 'en',
    employeeCount: 10,
    extensions: ['stripe-connector', 'printing-industry'],
    aiWorkers: ['printing-planner', 'production-planner'],
  });
  const [result, setResult] = useState<{ id: string; status: string; report?: { summary: string } } | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: profiles } = useQuery({ queryKey: ['profiles'], queryFn: fetchProfiles });

  async function handleFinish() {
    setLoading(true);
    try {
      const job = await startProvisioning(form);
      setResult(job as typeof result);
      setStep(6);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
      <header className="border-b bg-card/50 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">Lateen OS Setup Wizard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8 flex gap-2 overflow-x-auto">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={cn(
                'flex items-center gap-1 rounded-full px-3 py-1 text-xs',
                i <= step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              {i < step ? <CheckCircle2 className="h-3 w-3" /> : null}
              {label}
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Organization</h2></div>
              <input
                className="w-full rounded-md border bg-background px-3 py-2"
                placeholder="Organization name"
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Industry Profile</h2>
              <div className="grid gap-2">
                {profiles?.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setForm({ ...form, profile: p.id, industry: p.id === 'printing' ? 'printing' : form.industry })}
                    className={cn(
                      'rounded-md border p-3 text-left transition',
                      form.profile === p.id ? 'border-primary bg-primary/10' : 'hover:border-primary/50',
                    )}
                  >
                    <div className="font-medium">{p.displayName}</div>
                    <div className="text-sm text-muted-foreground">{p.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Locale</h2></div>
              <div className="grid gap-3 md:grid-cols-2">
                <input className="rounded-md border bg-background px-3 py-2" placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                <input className="rounded-md border bg-background px-3 py-2" placeholder="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
                <input className="rounded-md border bg-background px-3 py-2" placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                <input className="rounded-md border bg-background px-3 py-2" placeholder="Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Employees</h2></div>
              <input
                type="number"
                min={1}
                className="w-full rounded-md border bg-background px-3 py-2"
                value={form.employeeCount}
                onChange={(e) => setForm({ ...form, employeeCount: Number(e.target.value) })}
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Marketplace Extensions</h2>
              <p className="text-sm text-muted-foreground">Selected: {form.extensions.join(', ')}</p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">AI Workers</h2>
              <p className="text-sm text-muted-foreground">Selected: {form.aiWorkers.join(', ')}</p>
            </div>
          )}

          {step === 6 && result && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
              <h2 className="text-xl font-semibold">Provisioning Complete</h2>
              <p className="text-muted-foreground">{result.report?.summary ?? 'Organization provisioned successfully'}</p>
              <p className="text-xs text-muted-foreground">Job ID: {result.id}</p>
            </div>
          )}
        </div>

        {step < 6 && (
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
              className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
            >
              Back
            </button>
            {step < 5 ? (
              <button
                type="button"
                disabled={step === 0 && !form.organizationName}
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleFinish}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Provision Organization
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

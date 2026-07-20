'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  analyzeImpact,
  createEntity,
  deleteEntity,
  listEntities,
  updateEntity,
  validateEntity,
} from '@/lib/api/client';
import type { EntityDefinition } from '@/lib/entities';
import { cn, displayName, displayStatus } from '@/lib/utils';

export function EntityPage({ definition }: { definition: EntityDefinition }) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['entities', definition.path],
    queryFn: () => listEntities(definition.path),
    enabled: definition.listable,
  });

  const impactQuery = useQuery({
    queryKey: ['impact', definition.path, selectedId],
    queryFn: () => analyzeImpact(definition.path, selectedId!),
    enabled: !!selectedId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      const validation = await validateEntity(definition.path, payload);
      setValidationMessages([...validation.errors, ...validation.warnings]);
      if (!validation.valid) throw new Error(validation.errors.join(', ') || 'Validation failed');

      if (editing?.id) {
        return updateEntity(definition.path, String(editing.id), payload);
      }
      return createEntity(definition.path, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', definition.path] });
      queryClient.invalidateQueries({ queryKey: ['studio-dashboard'] });
      setFormOpen(false);
      setEditing(null);
      setForm({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity(definition.path, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', definition.path] });
      setSelectedId(null);
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(Object.fromEntries(definition.createFields.map((f) => [f.key, ''])));
    setValidationMessages([]);
    setFormOpen(true);
  }

  function openEdit(item: Record<string, unknown>) {
    setEditing(item);
    setForm(
      Object.fromEntries(
        definition.createFields.map((f) => [f.key, String(item[f.key] ?? '')]),
      ),
    );
    setValidationMessages([]);
    setFormOpen(true);
  }

  return (
    <div>
      <PageHeader title={definition.label} description={definition.description} />

      <div className="space-y-6 p-8">
        {!definition.listable ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>{definition.label} records are managed through Business DNA Service.</p>
              <p className="mt-2 text-sm">Use Create to register new {definition.label.toLowerCase()} entries when the API supports writes.</p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Create {definition.label}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Tabs defaultValue="list">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="impact" disabled={!selectedId}>Impact Analysis</TabsTrigger>
            </TabsList>
            {definition.listable ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add {definition.label.slice(0, -1)}
              </Button>
            ) : null}
          </div>

          <TabsContent value="list">
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : error ? (
              <p className="text-destructive">{(error as Error).message}</p>
            ) : definition.listable ? (
              <EntityTable
                items={items}
                definition={definition}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onEdit={openEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="impact">
            {impactQuery.data ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Impact — risk: {impactQuery.data.risk}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {impactQuery.data.dependents.map((d) => (
                    <div key={d.type} className="flex justify-between text-sm">
                      <span>{d.label}</span>
                      <Badge>{d.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">Select an entity to analyze downstream impact.</p>
            )}
          </TabsContent>
        </Tabs>

        {formOpen ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{editing ? 'Edit' : 'Create'} {definition.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {definition.createFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    value={form[field.key] ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    required={field.required}
                  />
                </div>
              ))}
              {validationMessages.length > 0 ? (
                <ul className="text-sm text-amber-500 space-y-1">
                  {validationMessages.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              ) : null}
              {saveMutation.error ? (
                <p className="text-sm text-destructive">{(saveMutation.error as Error).message}</p>
              ) : null}
              <div className="flex gap-2">
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving…' : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function EntityTable({
  items,
  definition,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
}: {
  items: Record<string, unknown>[];
  definition: EntityDefinition;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (item: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No {definition.label.toLowerCase()} found.</p>;
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Code</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const id = String(item.id);
            const status = displayStatus(item);
            return (
              <tr
                key={id}
                className={cn('border-t cursor-pointer hover:bg-muted/30', selectedId === id && 'bg-primary/5')}
                onClick={() => onSelect(selectedId === id ? null : id)}
              >
                <td className="px-4 py-3">{displayName(item)}</td>
                <td className="px-4 py-3 text-muted-foreground">{String(item.code ?? '—')}</td>
                <td className="px-4 py-3">
                  {status ? <Badge className="capitalize">{status}</Badge> : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" onClick={() => onEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

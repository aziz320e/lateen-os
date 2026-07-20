'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import type { Layout } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { RotateCcw, Save } from 'lucide-react';

const GridLayout = dynamic(() => import('react-grid-layout').then((m) => m.default), { ssr: false });

const STORAGE_KEY = 'ceo-cockpit-dashboard-layout';

export interface DashboardWidget {
  id: string;
  title: string;
  content: React.ReactNode;
  defaultLayout: { w: number; h: number; x: number; y: number; minW?: number; minH?: number };
}

export function DashboardGrid({ widgets }: { widgets: DashboardWidget[] }) {
  const [mounted, setMounted] = useState(false);
  const [width, setWidth] = useState(1200);
  const [layout, setLayout] = useState<Layout[]>(() =>
    widgets.map((w) => ({ i: w.id, ...w.defaultLayout })),
  );

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLayout(JSON.parse(saved) as Layout[]);
      } catch {
        /* use defaults */
      }
    }
    const onResize = () => {
      const el = document.getElementById('ceo-dashboard-grid');
      if (el) setWidth(el.clientWidth);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const saveLayout = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const resetLayout = useCallback(() => {
    const defaults = widgets.map((w) => ({ i: w.id, ...w.defaultLayout }));
    setLayout(defaults);
    localStorage.removeItem(STORAGE_KEY);
  }, [widgets]);

  if (!mounted) return <div className="h-96 animate-pulse rounded-lg bg-muted/30" />;

  return (
    <div id="ceo-dashboard-grid">
      <div className="flex gap-2 mb-4">
        <Button size="sm" variant="outline" onClick={saveLayout}>
          <Save className="h-3.5 w-3.5 mr-1" /> Save Layout
        </Button>
        <Button size="sm" variant="ghost" onClick={resetLayout}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
        </Button>
      </div>
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={80}
        width={width}
        onLayoutChange={setLayout}
        draggableHandle=".drag-handle"
        compactType="vertical"
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="rounded-lg border bg-card overflow-hidden flex flex-col">
            <div className="drag-handle cursor-move border-b px-4 py-2 text-sm font-medium bg-muted/30">
              {widget.title}
            </div>
            <div className="flex-1 p-4 overflow-auto">{widget.content}</div>
          </div>
        ))}
      </GridLayout>
    </div>
  );
}

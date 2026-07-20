'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export function ConditionEditor({ value }: { value: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>Condition Expression</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <MonacoEditor
            height="200px"
            language="javascript"
            theme="vs-dark"
            value={value}
            options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

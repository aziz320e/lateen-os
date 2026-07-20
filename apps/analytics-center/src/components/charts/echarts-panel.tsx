'use client';

import dynamic from 'next/dynamic';
import type { ChartData } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export function EChartsPanel({ chart }: { chart: ChartData }) {
  const data = chart.series[0]?.data ?? [];

  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: data.map((d) => d.x), axisLabel: { color: '#94a3b8' } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#334155' } } },
    series: [{
      type: chart.type === 'pie' ? 'pie' : chart.type === 'bar' ? 'bar' : 'line',
      data: chart.type === 'pie' ? data.map((d) => ({ name: d.x, value: d.y })) : data.map((d) => d.y),
      smooth: true,
      itemStyle: { color: '#22c55e' },
      areaStyle: chart.type === 'area' ? { opacity: 0.15 } : undefined,
    }],
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{chart.title} (ECharts)</CardTitle></CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: 240 }} />
      </CardContent>
    </Card>
  );
}

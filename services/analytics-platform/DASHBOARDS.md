# Dashboards

Dashboard data is available via `GET /api/dashboard/:id`.

## Available Dashboards

| ID | Domain | Primary KPIs |
| -- | ------ | ------------ |
| ceo | executive | Revenue, Profit, Gross Margin, Pipeline |
| finance | finance | Revenue, Profit, Gross Margin |
| operations | operations | Machine Utilization, Production Time, Downtime |
| sales | sales | Pipeline, Conversion, Revenue |
| production | production | Machine Utilization, Quality Score, Production Time |
| warehouse | operations | Machine Utilization, Downtime |
| customer-success | customers | Customer Satisfaction, Conversion |
| ai-operations | ai-runtime | AI Cost, AI Tokens, Worker Productivity |
| platform-health | infrastructure | Connector Health, Downtime |
| marketplace | marketplace | Marketplace Downloads, Revenue |

## Visualizations

Each dashboard includes:
- KPI cards with trend indicators
- Line chart (Recharts)
- Bar chart
- Pie chart

Analytics Center also renders Apache ECharts panels for alternate visualization.

## UI

View dashboards at `http://localhost:3011/dashboards/:id` in Analytics Center.

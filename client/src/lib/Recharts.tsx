// Re-export recharts with proper handling for production builds
// Import specific exports to avoid circular dependency issues
export {
  // Core components
  ResponsiveContainer,
  // Chart types
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  RadarChart,
  ScatterChart,
  ComposedChart,
  Sankey,
  Treemap,
  RadialBarChart,
  FunnelChart,
  // Chart elements
  Line,
  Bar,
  Area,
  Pie,
  Radar,
  Scatter,
  Funnel,
  RadialBar,
  // Axes
  XAxis,
  YAxis,
  ZAxis,
  // Other components
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LabelList,
  Label,
  ReferenceLine,
  ReferenceDot,
  ReferenceArea,
  Brush,
  ErrorBar,
} from 'recharts'

// Export types if needed
export type {
  TooltipProps,
  LegendProps,
} from 'recharts'

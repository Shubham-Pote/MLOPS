import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface MetricsChartProps {
  metrics: Record<string, number>;
}

const PERCENT_METRICS = ['accuracy', 'precision', 'recall', 'f1'];

export default function MetricsChart({ metrics }: MetricsChartProps) {
  const data = Object.entries(metrics).map(([name, value]) => {
    const isPercent = PERCENT_METRICS.includes(name.toLowerCase());
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: isPercent ? +(value * 100).toFixed(2) : +value.toFixed(4),
      isPercent
    };
  });

  if (data.length === 0) return null;

  return (
    <div style={{ width: '100%', height: 340 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 30, right: 30, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
          
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            dy={12}
          />
          
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            dx={-10}
            tickFormatter={(v) => {
               if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
               return v;
            }}
          />
          
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              color: '#f1f5f9',
              fontSize: '13px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              fontWeight: 500,
              padding: '12px 16px'
            }}
            formatter={(val: number, name: string, props: any) => {
                const isPct = props.payload.isPercent;
                return [isPct ? `${val}%` : val, 'Score'];
            }}
          />
          
          <Bar 
             dataKey="value" 
             radius={[8, 8, 0, 0]} 
             maxBarSize={55}
             fill="url(#barGradient)"
             animationDuration={1500}
             animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

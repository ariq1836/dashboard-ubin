import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import type { TileData } from '../types';

interface ChartsProps {
  data: TileData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Helper to process data for charts
const processDataForCharts = (data: TileData[]) => {
  const gradeCounts = data.reduce((acc, tile) => {
    acc[tile.grade] = (acc[tile.grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const gradeChartData = Object.entries(gradeCounts)
    .map(([name, count]) => ({ name, jumlah: count }))
    .sort((a, b) => b.jumlah - a.jumlah);

  const statusCounts = data.reduce((acc, tile) => {
    acc[tile.status] = (acc[tile.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  
  return { gradeChartData, statusChartData };
};


const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`Jumlah ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


export const DashboardCharts: React.FC<ChartsProps> = ({ data }) => {
  const { gradeChartData, statusChartData } = React.useMemo(() => processDataForCharts(data), [data]);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const onPieEnter = React.useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">Tidak ada data untuk ditampilkan di chart.</div>;
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Jumlah Ubin Berdasarkan Grade</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={gradeChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="jumlah" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Distribusi Status Uji Ubin</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              // FIX: The 'activeIndex' prop is valid on recharts' Pie component, but the installed type definitions may be outdated, causing a type error.
              // @ts-ignore
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={statusChartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
            >
              {statusChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
             <Legend formatter={(value) => <span className="text-gray-600">{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
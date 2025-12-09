import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { ThemedText } from './themed-text'; // Assuming themed-text is in components

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
}

const HistoryPieChart = ({ data }: PieChartProps) => {
  const size = 120;
  const radius = size / 2;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  let startAngle = 0;

  const slices = data.map(slice => {
    const angle = (slice.value / total) * 360;
    const endAngle = startAngle + angle;

    const x1 = radius + radius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = radius + radius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = radius + radius * Math.cos((endAngle * Math.PI) / 180);
    const y2 = radius + radius * Math.sin((endAngle * Math.PI) / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const d = `M ${radius},${radius} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
    startAngle = endAngle;

    return <Path key={slice.label} d={d} fill={slice.color} />;
  });

  return (
    <View style={pieChartStyles.chartContainer}>
      <Svg width={size} height={size}>
        {slices}
      </Svg>
      <View style={pieChartStyles.legendContainer}>
        {data.map(item => (
          <View key={item.label} style={pieChartStyles.legendItem}>
            <View style={[pieChartStyles.legendDot, { backgroundColor: item.color }]} />
            <ThemedText style={pieChartStyles.legendText}>{item.label} ({item.value})</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
};

const pieChartStyles = StyleSheet.create({
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  legendContainer: {
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#475569',
  },
});

export default HistoryPieChart;
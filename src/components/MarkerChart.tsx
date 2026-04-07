import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

interface DataPoint {
  date: string;   // 'DD/MM/AAAA'
  value: number;
}

interface Props {
  data: DataPoint[];
  label: string;
  color: string;
  unit: string;
}

const W = 300;
const H = 120;
const PAD_LEFT = 36;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 40;

const CHART_W = W - PAD_LEFT - PAD_RIGHT;
const CHART_H = H - PAD_TOP - PAD_BOTTOM;

export default function MarkerChart({ data, label, color, unit }: Props) {
  if (data.length < 2) return null;

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  function toX(i: number) {
    return PAD_LEFT + (i / (data.length - 1)) * CHART_W;
  }

  function toY(v: number) {
    return PAD_TOP + CHART_H - ((v - minVal) / range) * CHART_H;
  }

  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color }]}>{label}</Text>
      <Svg width={W} height={H} style={styles.svg}>
        {/* Axis lines */}
        <Line
          x1={PAD_LEFT} y1={PAD_TOP}
          x2={PAD_LEFT} y2={PAD_TOP + CHART_H}
          stroke="#ccc" strokeWidth={1}
        />
        <Line
          x1={PAD_LEFT} y1={PAD_TOP + CHART_H}
          x2={PAD_LEFT + CHART_W} y2={PAD_TOP + CHART_H}
          stroke="#ccc" strokeWidth={1}
        />

        {/* Y axis labels */}
        <SvgText x={PAD_LEFT - 4} y={PAD_TOP + 4} textAnchor="end" fontSize={9} fill="#999">
          {maxVal.toFixed(1)}
        </SvgText>
        <SvgText x={PAD_LEFT - 4} y={PAD_TOP + CHART_H + 4} textAnchor="end" fontSize={9} fill="#999">
          {minVal.toFixed(1)}
        </SvgText>

        {/* Line */}
        <Polyline points={points} fill="none" stroke={color} strokeWidth={2} />

        {/* Dots and X labels */}
        {data.map((d, i) => (
          <React.Fragment key={i}>
            <Circle cx={toX(i)} cy={toY(d.value)} r={4} fill={color} />
            <SvgText
              x={toX(i)}
              y={PAD_TOP + CHART_H + 14}
              textAnchor="middle"
              fontSize={8}
              fill="#888"
              rotation={-30}
              originX={toX(i)}
              originY={PAD_TOP + CHART_H + 14}
            >
              {d.date.slice(0, 5)}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 8,
  },
  svg: { overflow: 'visible' },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  unit: { fontSize: 10, color: '#aaa', marginTop: 4 },
});

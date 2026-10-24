import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AvailableSeat } from '../types/studentTrips';
import { colors } from '../theme/colors';

interface Props {
  seats: AvailableSeat[];
  selectedId: number | null;
  disabled: boolean;
  palette: { border: string; surface: string; text: string; muted: string };
  onSelect: (seatId: number) => void;
}

function seatRows(seats: AvailableSeat[]): AvailableSeat[][] {
  if (!seats.length) return [];
  const remainder = seats.length % 4;
  const rearCount = remainder === 1 && seats.length >= 5 ? 5 : remainder || 4;
  const regularCount = seats.length - rearCount;
  const rows: AvailableSeat[][] = [];
  for (let offset = 0; offset < regularCount; offset += 4) rows.push(seats.slice(offset, offset + 4));
  rows.push(seats.slice(regularCount));
  return rows;
}

export function BusSeatMap({ seats, selectedId, disabled, palette, onSelect }: Props) {
  const rows = seatRows(seats);
  return <View style={[styles.bus, { borderColor: palette.border }]}>
    <Text style={[styles.front, { color: palette.muted }]}>Đầu xe</Text>
    {rows.map((row, index) => {
      const bench = index === rows.length - 1 && row.length !== 4;
      const cells: (AvailableSeat | null)[] = bench ? row : [row[0], row[1], null, row[2], row[3]];
      return <View key={row[0].seatId} style={styles.row}>
        {cells.map((seat, column) => {
          if (!seat) return <View key={`aisle-${column}`} style={styles.cell} />;
          const selected = selectedId === seat.seatId;
          const unavailable = seat.status !== 'AVAILABLE';
          return <View key={seat.seatId} style={styles.cell}><TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Ghế ${seat.seatCode}${unavailable ? ', đã đặt' : ', trống'}`}
            accessibilityState={{ selected, disabled: unavailable || disabled }}
            disabled={unavailable || disabled} onPress={() => onSelect(seat.seatId)}
            style={[styles.seat, { borderColor: palette.border, backgroundColor: palette.surface }, selected && styles.selected, unavailable && styles.unavailable]}>
            <Text style={[styles.label, { color: selected ? colors.white : palette.text }]}>{seat.seatCode}</Text>
          </TouchableOpacity></View>;
        })}
      </View>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  bus: { borderWidth: 1, borderRadius: 22, paddingHorizontal: 6, paddingBottom: 12 },
  front: { textAlign: 'center', paddingVertical: 15, fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'center' },
  cell: { width: '20%', padding: 4 },
  seat: { minHeight: 48, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: colors.green, borderColor: colors.green },
  unavailable: { opacity: 0.3 },
  label: { fontSize: 13, fontWeight: '700' },
});

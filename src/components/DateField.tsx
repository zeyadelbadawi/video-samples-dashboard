import DateTimePicker from '@react-native-community/datetimepicker';
import { View } from 'react-native';

import { formatDate, fromISODate, toISODate, weekdayName } from '@/lib/dates';
import { space } from '@/theme';

import { Row, T } from './ui';

export function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ gap: space.xs }}>
      <T size={14} muted weight="500">
        التاريخ
      </T>
      <Row>
        <T size={14} muted>
          {weekdayName(value)} {formatDate(value)}
        </T>
        <DateTimePicker
          value={fromISODate(value)}
          mode="date"
          display="compact"
          locale="ar-EG"
          onChange={(_, d) => {
            if (d) onChange(toISODate(d));
          }}
        />
      </Row>
    </View>
  );
}

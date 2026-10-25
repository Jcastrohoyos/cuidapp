import { Pressable, StyleSheet, View } from 'react-native';
import { forwardRef } from 'react';
import { Text } from '@/components/text';
import { fam, Radius, Spacing, Color } from '@/constants/theme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
  style?: object;
}

export const Switch = forwardRef(({
  value,
  onValueChange,
  disabled = false,
  label,
  style,
}: SwitchProps) => {
  return (
    <View style={style}>
      <Pressable
        onPress={() => !disabled && onValueChange(!value)}
        disabled={disabled}
        style={[
          styles.track,
          value && styles.trackOn,
          disabled && styles.trackDisabled,
        ]}
      >
        <View style={[
          styles.thumb,
          value && styles.thumbOn,
        ]} />
      </Pressable>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    padding: 2,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: '#0F766E',
  },
  trackDisabled: {
    opacity: 0.5,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbOn: {
    marginLeft: 20,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
});

Switch.displayName = 'Switch';
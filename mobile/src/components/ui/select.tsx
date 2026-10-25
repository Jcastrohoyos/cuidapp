import { Pressable, StyleSheet, View, Text as RNText } from 'react-native';
import { forwardRef } from 'react';
import { Text } from '@/components/text';
import { fam, FontSize, Radius, Spacing, Color } from '@/constants/theme';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  style?: object;
}

export const Select = forwardRef(({
  label,
  value,
  options,
  onChange,
  error,
  placeholder = 'Seleccionar',
  disabled = false,
  style,
}: SelectProps) => {
  return (
    <View style={style} >
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: Color.gray700 }]}>{label}</Text>
        </View>
      )}
      <View style={[
        styles.selectWrapper,
        error && styles.selectWrapperError,
        disabled && styles.selectWrapperDisabled,
      ]}>
        <Pressable
          onPress={() => !disabled && alert('Selector - implementar modal de opciones')}
          disabled={disabled}
        >
          <View style={styles.selectContainer}>
            <Text style={[
              styles.selectText,
              value ? { color: '#111827' } : { color: '#9CA3AF' },
            ]}>
              {value ? options.find(o => o.value === value)?.label : placeholder}
            </Text>
            <RNText style={styles.chevron}>▼</RNText>
          </View>
        </Pressable>
      </View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
});

Select.displayName = 'Select';

const styles = StyleSheet.create({
  labelContainer: {
    marginBottom: 4,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#374151',
  },
  selectWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  selectWrapperError: {
    borderColor: '#EF4444',
  },
  selectWrapperDisabled: {
    backgroundColor: '#F3F4F6',
  },
  selectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  selectText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  chevron: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#EF4444',
    fontFamily: 'Inter_400Regular',
  },
});
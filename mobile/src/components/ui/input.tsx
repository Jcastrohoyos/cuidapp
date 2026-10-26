import { StyleSheet, TextInput, View } from 'react-native';
import { forwardRef } from 'react';
import { Text } from '@/components/text';
import { fam, FontSize, Radius, Spacing, Color } from '@/constants/theme';

type InputType = 'text' | 'numeric' | 'date' | 'time' | 'phone-pad' | 'email' | 'decimal-pad' | 'url' | 'default';

function mapKeyboardType(type: InputType): 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'decimal-pad' | 'url' {
  switch (type) {
    case 'numeric':
      return 'numeric';
    case 'email':
      return 'email-address';
    case 'phone-pad':
      return 'phone-pad';
    case 'decimal-pad':
      return 'decimal-pad';
    case 'url':
      return 'url';
    default:
      return 'default';
  }
}

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  type?: InputType;
  multiline?: boolean;
  numberOfLines?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  style?: object;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  type = 'text',
  multiline = false,
  numberOfLines,
  autoFocus = false,
  disabled = false,
  min,
  max,
  style,
}, ref) => {
  const handleChange = (text: string) => {
    if (type === 'numeric' && min !== undefined && max !== undefined) {
      const num = parseFloat(text);
      if (!isNaN(num) && (num < min || num > max)) {
        return;
      }
    }
    onChangeText(text);
  };

  const keyboardType = mapKeyboardType(type);

  return (
    <View style={style} >
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: '#374151' }]}>{label}</Text>
        </View>
      )}
      <View style={[
        styles.inputWrapper,
        error && styles.inputWrapperError,
        disabled && styles.inputWrapperDisabled,
      ]}>
        <TextInput
          ref={ref}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            disabled && styles.inputDisabled,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={handleChange}
          editable={!disabled}
          autoFocus={autoFocus}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          textContentType="none"
        />
      </View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  labelContainer: {
    marginBottom: 4,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#374151',
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  inputWrapperDisabled: {
    backgroundColor: '#F3F4F6',
  },
  input: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Inter_400Regular',
  },
  inputMultiline: {
    textAlignVertical: 'top',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#EF4444',
    fontFamily: 'Inter_400Regular',
  },
});
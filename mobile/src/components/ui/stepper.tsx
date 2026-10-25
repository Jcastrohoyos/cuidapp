import { Pressable, StyleSheet, View } from 'react-native';
import { fam, Radius, Spacing, Color } from '@/constants/theme';
import { Text } from '@/components/text';

interface StepperProps {
  steps: string[];
  activeStep: number;
  onStepPress: (index: number) => void;
  style?: object;
}

export function Stepper({ steps, activeStep, onStepPress, style }: StepperProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.track} />
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <Pressable
            key={index}
            onPress={() => onStepPress(index)}
            hitSlop={12}
          >
            <View style={[
              styles.step,
              index === activeStep && styles.stepActive,
            ]}>
              <View style={[
                styles.circle,
                index <= activeStep && styles.circleActive,
              ]}>
                {index <= activeStep && (
                  <Text style={styles.circleText}>{index === activeStep ? '✓' : index + 1}</Text>
                )}
              </View>
              <Text style={[
                styles.stepLabel,
                index === activeStep && styles.stepLabelActive,
              ]}>
                {step}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#E5E7EB',
    left: 0,
    right: 0,
    top: 14,
    zIndex: 0,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 1,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  stepActive: {
    // active styles handled by circle/label
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  circleActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  circleText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  stepLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#0F766E',
    fontWeight: '700',
  },
});
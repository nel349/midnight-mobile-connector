import { StyleSheet, SafeAreaView } from 'react-native';
import Step2_SeedDerivation from '@/components/Step2_SeedDerivation';

export default function Step2Screen() {
  return (
    <SafeAreaView style={styles.container}>
      <Step2_SeedDerivation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
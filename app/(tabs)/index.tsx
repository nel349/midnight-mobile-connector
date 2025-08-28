import { StyleSheet, SafeAreaView } from 'react-native';
import Step1_BasicCrypto from '@/components/Step1_BasicCrypto';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Step1_BasicCrypto />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

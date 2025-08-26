import { StyleSheet, SafeAreaView } from 'react-native';
import MidnightWasmLoader from '@/components/MidnightWasmLoader';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <MidnightWasmLoader />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

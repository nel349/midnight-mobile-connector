import { StyleSheet, SafeAreaView } from 'react-native';
import WalletBuilder from '@/components/WalletBuilder';

export default function WalletBuilderScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <WalletBuilder />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
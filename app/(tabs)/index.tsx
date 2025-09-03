import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { NativeModules } from 'react-native';

export default function DebugScreen() {
  const moduleNames = Object.keys(NativeModules).sort();
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Native Modules Available ({moduleNames.length}):</Text>
      {moduleNames.map((name) => (
        <Text key={name} style={styles.module}>{name}</Text>
      ))}
      <Text style={styles.title}>Looking for:</Text>
      <Text style={styles.missing}>WamrTurboModule: {NativeModules.WamrTurboModule ? '✅ FOUND' : '❌ NOT FOUND'}</Text>
      <Text style={styles.missing}>TestModule: {NativeModules.TestModule ? '✅ FOUND' : '❌ NOT FOUND'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  module: {
    fontSize: 14,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  missing: {
    fontSize: 16,
    marginTop: 5,
    fontWeight: 'bold',
    color: '#ff0000',
  },
});
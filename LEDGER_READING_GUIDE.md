# Ledger Reading Guide

This guide explains how to read from Midnight contract state without creating transactions, using the indexer GraphQL API.

## Overview

The ledger reading functionality allows you to:
- Query current contract state directly from the indexer
- Access contract collections and fields without transactions
- Read contract history and past states
- Use typed interfaces when you have managed contract files

## Quick Start

### 1. Test Reading from Any Contract

```typescript
import { testContractRead } from '../lib/midnightProviders';

// Test reading from a contract (no managed files needed)
import { DEFAULT_CONTRACT_ADDRESS } from '../lib/constants';
const result = await testContractRead(DEFAULT_CONTRACT_ADDRESS);

if (result.success) {
  console.log('Contract state:', result.rawState);
} else {
  console.log('Error:', result.error);
}
```

### 2. Set Up Contract Reader

```typescript
import { quickContractSetup } from '../lib/midnightProviders';

// Quick setup for reading from a specific contract
const { providers, ledgerReader } = await quickContractSetup(contractAddress);

// Read raw state
const rawState = await ledgerReader.readLedgerState();
console.log('Raw state:', rawState);
```

### 3. With Managed Files (Typed Access)

If you have managed contract files with a `ledger()` function:

```typescript
import { ledger } from './managed/mycontract/contract';
import { quickContractSetup } from '../lib/midnightProviders';

// Setup with typed ledger function
const { providers, ledgerReader } = await quickContractSetup(
  contractAddress,
  ledger  // This provides typed access to your contract state
);

// Now you get typed access to your contract's fields
const typedState = await ledgerReader.readLedgerState();
// typedState will have your contract's structure (e.g., typedState.all_accounts, etc.)
```

## Core Components

### PublicDataProvider

Handles communication with the indexer:

```typescript
import { createIndexerPublicDataProvider } from '../lib/contractStateReader';

const provider = createIndexerPublicDataProvider('https://indexer.testnet-02.midnight.network/api/v1/graphql');

// Query contract state
const state = await provider.queryContractState(contractAddress);
```

### ContractLedgerReader

Provides convenient methods for reading contract state:

```typescript
import { createContractLedgerReader } from '../lib/contractStateReader';

const reader = createContractLedgerReader(contractAddress, provider, ledgerFunction);

// Read entire state
const state = await reader.readLedgerState();

// Read specific field
const field = await reader.readField('fieldName');

// Check if collection has member
const hasMember = await reader.collectionHasMember('collectionName', key);

// Lookup in collection
const item = await reader.collectionLookup('collectionName', key);
```

## Examples

### Reading from Bank Contract

```typescript
// Example: Reading from the default contract
import { DEFAULT_CONTRACT_ADDRESS } from '../lib/constants';
const contractAddress = DEFAULT_CONTRACT_ADDRESS;

const { providers, ledgerReader } = await quickContractSetup(contractAddress);

// If you have the bank's ledger function:
// import { ledger } from './managed/bank/contract';
// const { providers, ledgerReader } = await quickContractSetup(contractAddress, ledger);

const state = await ledgerReader.readLedgerState();

// With managed files, you could do:
// const hasAccount = await reader.collectionHasMember('all_accounts', userIdBytes);
// const account = await reader.collectionLookup('all_accounts', userIdBytes);
```

### Reading Contract History

```typescript
const { providers } = await quickContractSetup(contractAddress);

const history = await providers.queryContractHistory?.(contractAddress, 10);
console.log(`Found ${history?.length || 0} contract actions`);
```

## GraphQL Schema Usage

The implementation uses the indexer's GraphQL schema to query contract state:

- `contractAction(address: HexEncoded!)` - Gets latest contract state
- `contractActions(address: HexEncoded!)` - Gets contract history
- Contract state is returned in the `state` field as hex-encoded data

## Error Handling

Always wrap contract reads in try-catch blocks:

```typescript
try {
  const state = await ledgerReader.readLedgerState();
  // Process state...
} catch (error) {
  console.error('Failed to read contract state:', error);
  // Handle error...
}
```

## Performance Notes

- Contract state queries are read-only and don't create transactions
- The indexer is optimized for fast queries
- State data is cached by the indexer
- No proof generation required for reads

## Next Steps

1. **Test the LedgerReaderTest component** - Use the built-in test component to verify functionality
2. **Add managed files** - When you have compiled contract files, use the typed `ledger()` function
3. **Implement state subscriptions** - Set up real-time updates for contract state changes

## Troubleshooting

### Contract Not Found
- Verify the contract address is correct
- Ensure the contract is deployed on the network you're querying
- Check if the indexer has synced to the block containing your contract

### GraphQL Errors
- Verify indexer URL is correct
- Check network connectivity
- Ensure the contract address format is valid (hex-encoded)

### State Parsing Errors
- Raw state is hex-encoded and needs proper parsing
- Use the contract's `ledger()` function for proper type conversion
- Check if the contract uses the expected state format


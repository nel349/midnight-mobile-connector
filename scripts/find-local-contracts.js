#!/usr/bin/env node

/**
 * Script to find all contracts deployed on the local Midnight network
 */

const fetch = require('node-fetch');

const INDEXER_URL = 'http://localhost:8088/api/v1/graphql';

// Function to make GraphQL requests
async function graphqlQuery(query, variables = {}) {
  try {
    const response = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return null;
    }
    
    return result.data;
  } catch (error) {
    console.error('Request failed:', error.message);
    return null;
  }
}

// Try to find contracts by searching for known contract addresses
async function searchForContracts() {
  console.log('🔍 Searching for contracts on local Midnight network...\n');
  
  // First, let's see what the schema looks like
  const schemaQuery = `
    {
      __schema {
        queryType {
          fields {
            name
            args {
              name
              type {
                name
                kind
              }
            }
          }
        }
      }
    }
  `;
  
  console.log('📋 Checking available GraphQL fields...');
  const schema = await graphqlQuery(schemaQuery);
  
  if (schema) {
    console.log('Available query fields:');
    schema.__schema.queryType.fields.forEach(field => {
      const args = field.args.map(arg => `${arg.name}: ${arg.type.name || arg.type.kind}`).join(', ');
      console.log(`  - ${field.name}(${args})`);
    });
    console.log('');
  }

  // Try to search for transactions that might contain contract deployments
  console.log('🔍 Searching for transactions with contract actions...');
  
  // We need to figure out the correct transaction query format
  const txQuery = `
    {
      transactions(offset: {byHeight: 1}) {
        hash
        contractActions {
          __typename
          address
          ... on ContractDeploy {
            address
          }
          ... on ContractCall {
            address
            entryPoint
          }
          ... on ContractUpdate {
            address
          }
        }
      }
    }
  `;
  
  const transactions = await graphqlQuery(txQuery);
  
  if (transactions && transactions.transactions) {
    const contractAddresses = new Set();
    
    if (Array.isArray(transactions.transactions)) {
      transactions.transactions.forEach(tx => {
        if (tx.contractActions && Array.isArray(tx.contractActions)) {
          tx.contractActions.forEach(action => {
            if (action.address) {
              contractAddresses.add(action.address);
            }
          });
        }
      });
    } else if (transactions.transactions.contractActions) {
      // Single transaction format
      if (Array.isArray(transactions.transactions.contractActions)) {
        transactions.transactions.contractActions.forEach(action => {
          if (action.address) {
            contractAddresses.add(action.address);
          }
        });
      }
    }
    
    if (contractAddresses.size > 0) {
      console.log(`✅ Found ${contractAddresses.size} contract address(es):`);
      Array.from(contractAddresses).forEach((address, index) => {
        console.log(`  ${index + 1}. ${address}`);
      });
      
      // Test each contract to see if we can query its state
      console.log('\n🧪 Testing contract state queries...');
      for (const address of contractAddresses) {
        await testContractState(address);
      }
    } else {
      console.log('❌ No contract addresses found in transactions');
    }
  } else {
    console.log('❌ Could not query transactions or no transactions found');
  }
}

// Test querying a specific contract's state
async function testContractState(contractAddress) {
  const stateQuery = `
    {
      contractAction(address: "${contractAddress}") {
        __typename
        address
        state
        ... on ContractDeploy {
          address
        }
        ... on ContractCall {
          address
          entryPoint
        }
        ... on ContractUpdate {
          address
        }
      }
    }
  `;
  
  const result = await graphqlQuery(stateQuery);
  
  if (result && result.contractAction) {
    console.log(`  ✅ ${contractAddress.substring(0, 20)}... - State available: ${result.contractAction.state ? 'YES' : 'NO'}`);
    if (result.contractAction.state) {
      console.log(`     State length: ${result.contractAction.state.length} characters`);
    }
  } else {
    console.log(`  ❌ ${contractAddress.substring(0, 20)}... - Could not query state`);
  }
}

// Main execution
async function main() {
  console.log('🌐 Local Midnight Contract Explorer\n');
  console.log(`📡 Indexer URL: ${INDEXER_URL}\n`);
  
  // Test basic connectivity
  const pingQuery = `{ __schema { queryType { name } } }`;
  const ping = await graphqlQuery(pingQuery);
  
  if (!ping) {
    console.log('❌ Cannot connect to local indexer');
    console.log('Make sure the indexer is running on http://localhost:8088');
    process.exit(1);
  }
  
  console.log('✅ Connected to local indexer\n');
  
  await searchForContracts();
}

main().catch(console.error);



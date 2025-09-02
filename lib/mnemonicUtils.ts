import { generateMnemonic, mnemonicToSeed, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export interface MnemonicResult {
  mnemonic: string;
  seed: Uint8Array;
}

export const generateMnemonicPhrase = async (strength: 128 | 256 = 256): Promise<MnemonicResult> => {
  console.log(`🎲 Generating ${strength === 128 ? '12' : '24'}-word mnemonic phrase...`);
  
  const mnemonic = generateMnemonic(wordlist, strength);
  const seed = await mnemonicToSeed(mnemonic);
  
  console.log(`   ✅ Generated ${mnemonic.split(' ').length}-word mnemonic`);
  
  return {
    mnemonic,
    seed
  };
};

export const mnemonicToSeedBytes = async (mnemonic: string, passphrase: string = ''): Promise<Uint8Array> => {
  console.log('🌱 Converting mnemonic to seed bytes...');
  
  if (!validateMnemonic(mnemonic, wordlist)) {
    throw new Error('Invalid mnemonic phrase');
  }
  
  const seed = await mnemonicToSeed(mnemonic, passphrase);
  console.log('   ✅ Mnemonic converted to seed');
  
  return seed;
};

export const validateMnemonicPhrase = (mnemonic: string): boolean => {
  return validateMnemonic(mnemonic, wordlist);
};

export const getMnemonicWordCount = (mnemonic: string): number => {
  return mnemonic.trim().split(/\s+/).length;
};

export const isValidMnemonicLength = (wordCount: number): boolean => {
  return wordCount === 12 || wordCount === 24;
};
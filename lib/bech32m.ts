/**
 * Midnight-compatible Bech32m implementation
 * 
 * Extracted from working addressGeneration.ts to ensure consistency
 * across viewing keys and addresses.
 */

const BECH32M_CONST = 0x2bc830a3;
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Polymod(values: number[]): number {
  let chk = 1;
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const top = chk >> 25;
    chk = (chk & 0x1ffffff) << 5 ^ value;
    for (let j = 0; j < 5; j++) {
      chk ^= ((top >> j) & 1) ? [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3][j] : 0;
    }
  }
  return chk;
}

function bech32HrpExpand(hrp: string): number[] {
  const ret: number[] = [];
  for (let p = 0; p < hrp.length; p++) {
    ret.push(hrp.charCodeAt(p) >> 5);
  }
  ret.push(0);
  for (let p = 0; p < hrp.length; p++) {
    ret.push(hrp.charCodeAt(p) & 31);
  }
  return ret;
}

function bech32CreateChecksum(hrp: string, data: number[]): number[] {
  const values = bech32HrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const polymod = bech32Polymod(values) ^ BECH32M_CONST;
  const checksum: number[] = [];
  for (let i = 0; i < 6; i++) {
    checksum.push((polymod >> 5 * (5 - i)) & 31);
  }
  return checksum;
}

function convertBits(data: Uint8Array, fromBits: number, toBits: number, pad: boolean): number[] {
  let acc = 0;
  let bits = 0;
  const ret: number[] = [];
  const maxv = (1 << toBits) - 1;
  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    if (value < 0 || (value >> fromBits)) {
      throw new Error('Invalid data for base conversion');
    }
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) {
      ret.push((acc << (toBits - bits)) & maxv);
    }
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    throw new Error('Invalid padding bits');
  }
  return ret;
}

/**
 * Encode data as Midnight-compatible Bech32m string
 */
export function encodeMidnightBech32m(hrp: string, data: Uint8Array): string {
  const converted = convertBits(data, 8, 5, true);
  const checksum = bech32CreateChecksum(hrp, converted);
  const combined = converted.concat(checksum);
  
  let result = hrp + '1';
  for (let i = 0; i < combined.length; i++) {
    const value = combined[i];
    result += CHARSET[value];
  }
  return result;
}

/**
 * Verify Bech32m checksum
 */
export function verifyMidnightBech32m(bech32String: string): boolean {
  if (bech32String.length < 8 || bech32String.length > 90) {
    return false;
  }
  
  const pos = bech32String.lastIndexOf('1');
  if (pos < 1 || pos + 7 > bech32String.length) {
    return false;
  }
  
  const hrp = bech32String.substring(0, pos);
  const data: number[] = [];
  
  for (let i = pos + 1; i < bech32String.length; i++) {
    const d = CHARSET.indexOf(bech32String[i]);
    if (d === -1) {
      return false;
    }
    data.push(d);
  }
  
  const combined = bech32HrpExpand(hrp).concat(data);
  return bech32Polymod(combined) === BECH32M_CONST;
}
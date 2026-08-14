import { zeroAddress, type Address } from 'viem'

const deployedAddress = ''
const configuredAddress = import.meta.env.VITE_PACE_CONTRACT_ADDRESS
const activeAddress = configuredAddress || deployedAddress

export const isContractConfigured = /^0x[a-fA-F0-9]{40}$/.test(activeAddress) && activeAddress.toLowerCase() !== zeroAddress
export const PACE_ADDRESS = (isContractConfigured ? activeAddress : zeroAddress) as Address

export const paceAbi = [
  { type: 'function', name: 'recordDay', inputs: [{ name: 'steps', type: 'uint32' }, { name: 'waterMl', type: 'uint16' }, { name: 'reps', type: 'uint16' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'dailyCheckIn', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'recordOf', inputs: [{ name: 'user', type: 'address' }, { name: 'day', type: 'uint64' }], outputs: [{ name: '', type: 'tuple', components: [{ name: 'steps', type: 'uint32' }, { name: 'waterMl', type: 'uint16' }, { name: 'reps', type: 'uint16' }, { name: 'recordedAt', type: 'uint64' }] }], stateMutability: 'view' },
  { type: 'function', name: 'profileOf', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'tuple', components: [{ name: 'recordedDays', type: 'uint64' }, { name: 'totalSteps', type: 'uint64' }, { name: 'totalWaterMl', type: 'uint64' }, { name: 'totalReps', type: 'uint64' }, { name: 'checkIns', type: 'uint64' }, { name: 'lastCheckInDay', type: 'uint64' }, { name: 'bestDayScore', type: 'uint64' }, { name: 'streak', type: 'uint16' }] }], stateMutability: 'view' },
  { type: 'function', name: 'globalRecordedDays', inputs: [], outputs: [{ name: '', type: 'uint64' }], stateMutability: 'view' },
] as const

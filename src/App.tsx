import { useEffect, useMemo, useState } from 'react'
import { Activity, Check, Droplets, Footprints, LogOut, Minus, Plus, Radio, Rocket, RotateCcw, Sparkles, Wallet, X, Zap } from 'lucide-react'
import { encodeFunctionData } from 'viem'
import { useAccount, useConnect, useDisconnect, useReadContract, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi'
import { base } from 'wagmi/chains'
import { isContractConfigured, PACE_ADDRESS, paceAbi } from './config/contract'
import { DATA_SUFFIX } from './config/wagmi'

type Action = 'record' | 'checkin' | null
type MeterProps = { tone: 'cyan' | 'lime' | 'coral'; label: string; unit: string; value: number; step: number; max: number; icon: React.ReactNode; onChange: (value: number) => void }

function shortAddress(address?: string) { return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Connect' }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(value, max)) }

function MeterBand({ tone, label, unit, value, step, max, icon, onChange }: MeterProps) {
  const progress = Math.min(value / max, 1)
  return (
    <section className={`meter-band ${tone}`} aria-label={label}>
      <div className="meter-head"><span className="meter-icon">{icon}</span><div><span className="channel">Live channel</span><h2>{label}</h2></div></div>
      <div className="meter-value"><strong>{value.toLocaleString()}</strong><span>{unit}</span></div>
      <div className="meter-scale" aria-hidden="true"><i style={{ width: `${progress * 100}%` }} />{Array.from({ length: 18 }, (_, i) => <span key={i} />)}</div>
      <div className="meter-actions">
        <button type="button" aria-label={`Subtract ${step} ${unit}`} onClick={() => onChange(clamp(value - step, 0, max))}><Minus size={19} /></button>
        <button className="add" type="button" onClick={() => onChange(clamp(value + step, 0, max))}><Plus size={19} /> {step.toLocaleString()}</button>
        <button type="button" aria-label={`Reset ${label}`} onClick={() => onChange(0)}><RotateCcw size={18} /></button>
      </div>
    </section>
  )
}

export default function App() {
  const { address, isConnected, chainId } = useAccount()
  const { connectors, connect, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const { sendTransactionAsync, data: hash, isPending: isSending, reset } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const [steps, setSteps] = useState(0)
  const [water, setWater] = useState(0)
  const [reps, setReps] = useState(0)
  const [action, setAction] = useState<Action>(null)
  const [notice, setNotice] = useState('')
  const [walletOpen, setWalletOpen] = useState(false)

  const today = BigInt(Math.floor(Date.now() / 86_400_000))
  const enabledAddress = isConnected && isContractConfigured ? address : undefined
  const busy = isSending || isConfirming

  const { data: todayRecord, refetch: refetchRecord } = useReadContract({ address: PACE_ADDRESS, abi: paceAbi, functionName: 'recordOf', args: enabledAddress ? [enabledAddress, today] : undefined, query: { enabled: Boolean(enabledAddress) } })
  const { data: profile, refetch: refetchProfile } = useReadContract({ address: PACE_ADDRESS, abi: paceAbi, functionName: 'profileOf', args: enabledAddress ? [enabledAddress] : undefined, query: { enabled: Boolean(enabledAddress) } })
  const { data: globalDays, refetch: refetchGlobal } = useReadContract({ address: PACE_ADDRESS, abi: paceAbi, functionName: 'globalRecordedDays', query: { enabled: isContractConfigured } })

  const recordedToday = Boolean(todayRecord && todayRecord.recordedAt > 0n)
  const checkedToday = Boolean(profile && profile.lastCheckInDay === today)
  const activityReady = steps + water + reps > 0
  const signal = useMemo(() => Math.min(100, Math.round((steps / 10000 + water / 2500 + reps / 100) * 33)), [steps, water, reps])

  useEffect(() => {
    if (!isSuccess || !action) return
    setNotice(action === 'record' ? 'Today is now part of your Base trajectory.' : 'Daily signal confirmed.')
    setAction(null)
    void refetchRecord(); void refetchProfile(); void refetchGlobal()
  }, [isSuccess])

  async function sendAction(next: Exclude<Action, null>) {
    setNotice(''); reset()
    if (!isConnected) { setWalletOpen(true); return }
    if (!isContractConfigured) { setNotice('Contract address required in src/config/contract.ts.'); return }
    try {
      if (chainId !== base.id) await switchChainAsync({ chainId: base.id })
      setAction(next)
      const data = encodeFunctionData({ abi: paceAbi, functionName: next === 'record' ? 'recordDay' : 'dailyCheckIn', args: next === 'record' ? [steps, water, reps] : [] })
      await sendTransactionAsync({ to: PACE_ADDRESS, data, chainId: base.id, ...(DATA_SUFFIX ? { dataSuffix: DATA_SUFFIX } : {}) })
    } catch (error) {
      setNotice((error instanceof Error ? error.message : 'Transaction cancelled.').split('\n')[0]); setAction(null)
    }
  }

  function connectWallet(index: number) { const connector = connectors[index]; if (connector) connect({ connector, chainId: base.id }, { onSuccess: () => setWalletOpen(false) }) }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#log"><span className="brand-symbol"><Radio size={18} /></span><span>PACE</span><small>movement telemetry</small></a>
        <div className="top-actions"><span className="base-status"><i /> BASE MAINNET</span>{isConnected ? <div className="account"><span>{shortAddress(address)}</span><button type="button" onClick={() => disconnect()} aria-label="Disconnect"><LogOut size={16} /></button></div> : <button className="connect" type="button" onClick={() => setWalletOpen(true)}><Wallet size={17} /> Connect</button>}</div>
      </header>

      <main id="log">
        <section className="intro">
          <div><p className="eyebrow">Daily motion / Base orbital log</p><h1>Transmit today’s<br />movement.</h1></div>
          <div className="signal-readout"><span>Composite signal</span><strong>{signal}<small>%</small></strong><i style={{ height: `${Math.max(8, signal)}%` }} /></div>
        </section>

        {recordedToday ? (
          <section className="receipt">
            <span className="receipt-icon"><Check size={26} /></span><p>Day recorded</p><h2>Trajectory locked.</h2>
            <div className="receipt-grid"><div><span>Steps</span><strong>{Number(todayRecord?.steps || 0n).toLocaleString()}</strong></div><div><span>Water</span><strong>{Number(todayRecord?.waterMl || 0n)} ml</strong></div><div><span>Reps</span><strong>{Number(todayRecord?.reps || 0n)}</strong></div></div>
          </section>
        ) : (
          <div className="meters">
            <MeterBand tone="cyan" label="Steps" unit="steps" value={steps} step={1000} max={20000} icon={<Footprints size={23} />} onChange={setSteps} />
            <MeterBand tone="lime" label="Water" unit="ml" value={water} step={250} max={4000} icon={<Droplets size={23} />} onChange={setWater} />
            <MeterBand tone="coral" label="Reps" unit="reps" value={reps} step={10} max={200} icon={<Activity size={23} />} onChange={setReps} />
          </div>
        )}

        <section className="transmit-bar">
          <div><span>Today / UTC orbit {today.toString()}</span><p>{recordedToday ? 'Your daily telemetry is already onchain.' : 'One transaction records all three channels.'}</p></div>
          <button type="button" disabled={busy || recordedToday || !activityReady} onClick={() => sendAction('record')}><Rocket size={20} />{busy && action === 'record' ? 'Transmitting…' : recordedToday ? 'Day recorded' : 'Record today'}</button>
        </section>

        <section className="daily-band">
          <span className="daily-pulse"><Zap size={21} /></span><div><span>Daily signal</span><h2>Ping the constellation.</h2><p>Keep a separate return streak, even on rest days.</p></div>
          <div className="streak"><strong>{Number(profile?.streak || 0n)}</strong><span>orbit streak</span></div>
          <button className={checkedToday ? 'done' : ''} type="button" disabled={busy || checkedToday} onClick={() => sendAction('checkin')}>{checkedToday ? <><Check size={18} /> Signal sent</> : <><Sparkles size={18} /> {busy && action === 'checkin' ? 'Sending…' : 'Daily check-in'}</>}</button>
        </section>

        <section className="stats"><div><span>Recorded days</span><strong>{Number(profile?.recordedDays || 0n)}</strong></div><div><span>Total steps</span><strong>{Number(profile?.totalSteps || 0n).toLocaleString()}</strong></div><div><span>Total water</span><strong>{Number(profile?.totalWaterMl || 0n).toLocaleString()}</strong><small>ml</small></div><div><span>Global signals</span><strong>{Number(globalDays || 0n)}</strong></div></section>
        {notice && <p className="notice" role="status">{notice}</p>}
      </main>

      <footer><span>PACE // BASE</span><span>No token · No app fee · Network gas only</span></footer>

      {walletOpen && <div className="modal-backdrop" onMouseDown={() => setWalletOpen(false)}><div className="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-title" onMouseDown={(e) => e.stopPropagation()}><button className="close" type="button" aria-label="Close" onClick={() => setWalletOpen(false)}><X size={18} /></button><span className="modal-icon"><Radio size={24} /></span><p>BASE MAINNET</p><h2 id="wallet-title">Link your signal.</h2><span>Connect a wallet to transmit movement telemetry.</span><div className="wallet-options"><button type="button" disabled={isConnecting} onClick={() => connectWallet(0)}><i><Wallet size={19} /></i><span><strong>Browser wallet</strong><small>MetaMask, Rabby and more</small></span></button><button type="button" disabled={isConnecting} onClick={() => connectWallet(1)}><i className="base">B</i><span><strong>Base Account</strong><small>Coinbase smart wallet</small></span></button></div></div></div>}
    </div>
  )
}

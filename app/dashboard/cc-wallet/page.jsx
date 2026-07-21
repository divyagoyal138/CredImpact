'use client'

import { useDashboard } from '../layout'

export default function CCWalletPage() {
  const { user, transactions } = useDashboard()

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-card mb-3">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-base font-semibold text-foreground">CC Wallet</h1>
        </div>
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Your Current Balance</p>
          <div className="text-5xl font-bold text-coin">
            {user?.ccBalance || 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Credibility Coins</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Transaction History</h2>
        </div>
        <div className="divide-y divide-border">
          {transactions.map(transaction => (
            <div key={transaction.id} className="px-4 py-3 flex justify-between items-center">
              <div className="min-w-0">
                <p className="text-sm text-foreground font-medium">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">{transaction.date}</p>
              </div>
              <span className={`text-sm font-bold ${
                transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'earned' ? '+' : '-'}{transaction.amount} CC
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

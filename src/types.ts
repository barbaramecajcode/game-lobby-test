export type Category = 'slots' | 'table' | 'live'

export type Tag =
  | 'megaways'
  | 'jackpot'
  | 'bonus'
  | 'classic'
  | 'hold'
  | 'exclusive'
  | 'high-limit'
  | 'new'

export type Game = {
  id: string
  title: string
  provider: string
  providerId: string
  category: Category
  tags: Tag[]
  rtp: number
  minBet: number
  maxBet: number
  heat: number
  released: string
}

export type PayCode = 'EUR' | 'USD' | 'GBP'

export type TxStatus = 'pending' | 'posted'

export type Tx = {
  id: string
  cents: number
  status: TxStatus
  at: number
  code: PayCode
}

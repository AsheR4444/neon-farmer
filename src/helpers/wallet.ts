import { Model, Optional } from "sequelize"
import { WalletModel } from "./database"

enum LastAction {
  NEON_USDT = "neon/usdt",
  USDT_NEON = "usdt/neon",
}

type WalletType = {
  nextActionDate?: Date | null
  evmPk: string
  solPk: string
  evmAddress: string
  name: string
  proxy: string
  bridged: boolean
  lastAction?: LastAction | null
}

export class Wallet extends Model<WalletType> implements WalletType {
  public lastAction?: LastAction | null
  public nextActionDate?: Date | null
  public evmPk!: string
  public solPk!: string
  public evmAddress!: string
  public name!: string
  public proxy!: string
  public bridged!: boolean
}

const getWallet = async (privateKey: string): Promise<Wallet | null> => {
  // if (sqliteQuery) {
  //   const result = await db.execute("SELECT * FROM wallets WHERE evmPk = ?", { replacements: [privateKey] })
  //   return result[0] || null
  // }

  // const wallet = await db.one("Wallet", { evmPk: privateKey })
  const wallet = await WalletModel.findOne({
    where: {
      evmPk: privateKey,
    },
  })
  return wallet ? (wallet as Wallet) : null
}

export { getWallet, WalletType, LastAction }

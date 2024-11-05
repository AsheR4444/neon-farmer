import { DataTypes } from "sequelize"
import { DB_PATH } from "./const"
import { DB } from "../classes/Database"
import { importWallets } from "./importWallets"

const db = new DB(`sqlite:///${DB_PATH}`)

const WalletModel = db.defineModel("Wallet", {
  evmAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  evmPk: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  proxy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  solPk: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  nextActionDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  bridged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastAction: {
    type: DataTypes.STRING,
    allowNull: true,
  },
})

const createDb = async () => {
  await db.createTables()
  await importWallets()
}

export { db, WalletModel }
export default createDb

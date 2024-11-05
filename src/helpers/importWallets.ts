import wallets from "../../data.json"

import { Client } from "../eth-async"
import { Networks } from "../eth-async/data/models"
import { WalletModel } from "../helpers/database"
import { getWallet } from "../helpers/wallet"

const importWallets = async () => {
  let imported = 0
  let edited = 0
  const total = wallets.length

  for (const wallet of wallets) {
    const walletInstance = await getWallet(wallet.evmPk)

    if (
      walletInstance &&
      (walletInstance.proxy !== wallet.proxy ||
        walletInstance.name !== wallet.name ||
        walletInstance.solPk !== wallet.solPk)
    ) {
      walletInstance.proxy = wallet.proxy
      walletInstance.name = wallet.name
      walletInstance.solPk = wallet.solPk

      await WalletModel.update({ proxy: wallet.proxy, name: wallet.name }, { where: { evmPk: wallet.evmPk } })
      ++edited
    }

    if (!walletInstance) {
      const client = new Client(wallet.evmPk, Networks.Ethereum)
      await WalletModel.create({ ...wallet, evmAddress: client.signer.address })

      ++imported
    }
  }

  console.log("----------")
  console.log("Готово!")
  console.log(`Импортированные кошельки: ${imported}/${total}`)
  console.log(`Изменённые кошельки: ${edited}/${total}`)
  console.log(`Всего: ${total}`)
  console.log("----------")
}

export { importWallets }

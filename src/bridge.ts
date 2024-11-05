import { Client, Neon } from "./classes"

import { db } from "./helpers/database"
import { sleep } from "./helpers"

const delayBetweenAccounts = 10000 * 10

const bridge = async () => {
  while (true) {
    try {
      console.log("start")
      const wallet = await db.one("Wallet", {
        // [Op.or]: [{ nextActionDate: { [Op.lte]: new Date() } }, { nextActionDate: null }],
        bridged: false,
      })

      if (!wallet) {
        console.log("Все кошельки совершили bridge")
        break
      }

      const client = new Client({ proxy: wallet.proxy, name: wallet.name, evmPk: wallet.evmPk, solPk: wallet.solPk })

      const neon = new Neon(client)
      const browser = await client.startBrowser()
      const page = (await browser.pages())[0]
      page.setViewport(null)
      await client.wallet.phantomLogin(browser)
      await client.wallet.rabbyLogin(browser)
      await neon.swapSolToNeon(browser)
      await neon.bridgeToNeon(browser)
      await browser.close()

      wallet.bridged = true
      wallet.save()
    } finally {
      await sleep(delayBetweenAccounts)
    }
  }
}

export default bridge

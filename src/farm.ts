import { Op } from "sequelize"

import { Client, Neon } from "./classes"
import { db } from "./helpers/database"
import { sleep } from "./helpers"
import { Tokens } from "./helpers/tokens"
import updateNextActionTime from "./helpers/updateNextActionTime"

const farm = async () => {
  while (true) {
    try {
      console.log("start")
      const wallet = await db.one("Wallet", {
        [Op.or]: [{ nextActionDate: { [Op.lte]: new Date() } }, { nextActionDate: null }],
        bridged: true,
      })

      if (!wallet) {
        await sleep(5000)
        continue
      }

      const client = new Client({ proxy: wallet.proxy, name: wallet.name, evmPk: wallet.evmPk, solPk: wallet.solPk })

      const neon = new Neon(client)
      const browser = await client.startBrowser()
      const page = (await browser.pages())[0]
      page.setViewport(null)
      await client.wallet.phantomLogin(browser)
      await client.wallet.rabbyLogin(browser)

      await neon.swap(browser, { fromToken: Tokens.Neon, toToken: Tokens.SolNeon })
      await browser.close()

      await updateNextActionTime(wallet.evmPk)
    } catch (e) {
      console.log("ОШИБКА: ", e)
    } finally {
      await sleep(10000)
    }
  }
}

export default farm

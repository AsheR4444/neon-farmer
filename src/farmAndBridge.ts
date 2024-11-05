import { Op } from "sequelize"

import { Client, Neon } from "./classes"
import { db } from "./helpers/database"
import { sleep } from "./helpers"
import { Tokens } from "./helpers/tokens"
import updateNextActionTime from "./helpers/updateNextActionTime"
import { randomNumber } from "./helpers"
import { LastAction } from "./helpers/wallet"

const bridgeAndFarm = async () => {
  while (true) {
    try {
      await sleep(10000)

      const wallet = await db.one("Wallet", {
        [Op.or]: [{ nextActionDate: { [Op.lte]: new Date() } }, { nextActionDate: null }],
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

      const phantomLoginSuccess = await client.wallet.phantomLogin(browser)
      if (phantomLoginSuccess === null) {
        console.warn("Не удалось выполнить phantomLogin, перезапуск bridgeAndFarm...")
        continue
      }

      const rabbyLoginSuccess = await client.wallet.rabbyLogin(browser)
      if (rabbyLoginSuccess === null) {
        console.warn("Не удалось выполнить rabbyLogin, перезапуск bridgeAndFarm...")
        continue
      }

      if (!wallet.bridged) {
        const swapSolToNeonSuccess = await neon.swapSolToNeon(browser)
        if (swapSolToNeonSuccess === null) {
          console.warn("Не удалось выполнить swapSolToNeon, перезапуск bridgeAndFarm...")
          continue
        }

        const bridgeToNeonSuccess = await neon.bridgeToNeon(browser)
        if (bridgeToNeonSuccess === null) {
          console.warn("Не удалось выполнить bridgeToNeon, перезапуск bridgeAndFarm...")
          continue
        }

        wallet.bridged = true
        await wallet.save()
        await sleep(randomNumber(10000, 40000))
      }

      const initialLastAction = wallet.lastAction

      if (initialLastAction === null || initialLastAction === LastAction.USDT_NEON) {
        const swapSuccess = await neon.swap(browser, { fromToken: Tokens.Neon, toToken: Tokens.UsdtNeon })
        if (swapSuccess === null) {
          console.warn("Не удалось выполнить swap, перезапуск bridgeAndFarm...")
          continue
        }

        wallet.lastAction = LastAction.NEON_USDT
      }

      if (initialLastAction === LastAction.NEON_USDT) {
        const swapSuccess = await neon.swap(browser, { fromToken: Tokens.UsdtNeon, toToken: Tokens.Neon })
        if (swapSuccess === null) {
          console.warn("Не удалось выполнить swap, перезапуск bridgeAndFarm...")
          continue
        }

        wallet.lastAction = LastAction.USDT_NEON
      }

      await wallet.save()
      await browser.close()

      await updateNextActionTime(wallet.evmPk)
    } finally {
      await sleep(10000)
    }
  }
}

export default bridgeAndFarm

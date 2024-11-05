import { Browser } from "puppeteer"

import { Wallet } from "./Wallet"
import { Client } from "./Client"

import { getPage, sleep } from "../helpers"
import { RetryDecorator } from "../decorators"
import CONFIG from "../helpers/config"
import { Token, Tokens } from "../helpers/tokens"

class Neon {
  client: Client

  constructor(client) {
    this.client = client
  }

  @RetryDecorator()
  async swapSolToNeon(browser: Browser) {
    const url = "https://jup.ag/swap/SOL-NEON"
    const page = (await browser.pages())[0]

    await page.goto(url, { waitUntil: "networkidle0", timeout: 100000 })

    const checkIsWalletConnected = async () => {
      return await page.evaluate(() => {
        console.log(document.querySelector("img[alt='Wallet logo']"))
        return !!document.querySelector("img[alt='Wallet logo']")
      })
    }

    if (!(await checkIsWalletConnected())) {
      await page.evaluate(() => {
        const buttons = document.querySelectorAll("button")
        let buttonIsFound = false

        buttons.forEach((button) => {
          if (button.innerText === "Connect Wallet") {
            button.click()
            buttonIsFound = true
          }
        })

        if (!buttonIsFound) {
          throw new Error(`Connect Wallet not found on Jupiter`)
        }
      })
    }

    await page.waitForSelector("text/Phantom")
    await page.click("text/Phantom")

    await sleep(2000)

    if (!(await checkIsWalletConnected())) {
      await Wallet.connectPhantom(browser)
    }

    await page.type('input[name="fromValue"]', `${CONFIG.solToNeon}`)

    await sleep(2000)

    await page.waitForSelector('button[type="submit"]:not([disabled])')
    await page.click('button[type="submit"]')

    await sleep(5000)

    await Wallet.confirmTransactionPhantom(browser)

    await sleep(5000)

    const checkIsTransactionSend = async () => {
      return await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("a"))
        const el = links.find((link) => link.href.includes("https://solscan.io/tx/"))

        if (el) {
          return true
        }

        return false
      })
    }
    const isTransactionSend = await checkIsTransactionSend()

    if (isTransactionSend) {
      console.log(`Кошелёк ${this.client.name} отправил свап sol -> neon`)
    }

    const checkIsSpinElementExist = async () => {
      return await page.evaluate(() => !!document.querySelector(".animate-spin"))
    }

    while (await checkIsSpinElementExist()) {
      await sleep(1000)
    }

    const checkisTransactionConfirmed = async () => {
      return await page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll("div"))
        const el = divs.find((link) => link.textContent === "Transaction Confirmed")

        if (el) {
          return true
        }

        return false
      })
    }

    if (await checkisTransactionConfirmed()) {
      const link = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("a"))
        const solScanLink = links.find((link) => link.href.includes("https://solscan.io/tx/"))?.href

        return solScanLink
      })
      console.log(`Кошелёк ${this.client.name} совершил свап sol -> neon. Ссылка: ${link}`)
    } else {
      throw new Error(`Во время свапа sol -> neon на кошельке ${this.client.name} произошла ошибка`)
    }
  }

  @RetryDecorator()
  async bridgeToNeon(browser: Browser) {
    const url = "https://neonpass.live/"
    const page = (await browser.pages())[0]

    await page.goto(url, { waitUntil: "domcontentloaded" })
    await page.waitForSelector("text/Launch App")
    await page.click("text/Launch App")

    await sleep(2000)
    await page.click("text/ Connect Solana Wallet ")

    await page.waitForSelector("text/Phantom")
    await page.click("text/Phantom")

    await sleep(5000)

    const connectPhatomTarget = await browser.waitForTarget((target) => target.url().endsWith("notification.html"))
    const connectPhatomPage = await connectPhatomTarget.asPage()

    await connectPhatomPage.waitForSelector("button[data-testid='primary-button']")
    await connectPhatomPage.click("button[data-testid='primary-button']")

    await sleep(2000)
    await page.click("text/ Connect EVM Wallet ")
    await sleep(5000)

    await page.evaluate(() => {
      const element = document
        ?.querySelector("w3m-modal")
        ?.shadowRoot?.querySelector("w3m-router")
        ?.shadowRoot?.querySelector("w3m-connect-view")
        ?.shadowRoot?.querySelector("w3m-wallet-login-list")
        ?.shadowRoot?.querySelector("w3m-connector-list")
        ?.shadowRoot?.querySelector("w3m-connect-announced-widget")
        ?.shadowRoot?.querySelector("wui-list-wallet")
        ?.shadowRoot?.querySelector("button")

      element?.click()
    })

    await sleep(5000)

    const connectRabbyPage = getPage({
      pages: await browser.pages(),
      url: "chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/notification.html#/approval",
    })

    if (connectRabbyPage) {
      await connectRabbyPage?.evaluate(async () => {
        const span = document.querySelectorAll("span")

        span.forEach((element) => {
          if (element.innerText === "Ignore all") {
            element.click()
            return
          }
        })

        const buttons = document.querySelectorAll("button")
        buttons.forEach((button) => {
          if (button.innerText === "Connect") {
            button.click()
            return
          }
        })
      })
    } else {
      console.log("Не найдена страница подтверждения подключения rabby")
    }

    await sleep(2000)

    await page.evaluate(() => {
      const element = document
        .querySelector("w3m-modal")
        ?.shadowRoot?.querySelector("w3m-router")
        ?.shadowRoot?.querySelector("w3m-unsupported-chain-view")
        ?.shadowRoot?.querySelector(":nth-child(2) > :nth-child(2)")
        ?.shadowRoot?.querySelector("wui-text")
        ?.shadowRoot?.querySelector("slot")

      element?.click()
    })

    await sleep(2000)
    await page.click("button[data-testid='token-amount-max-button']")

    await page.waitForSelector("button[data-testid='transfer-button']:not([disabled])")

    await page.click("button[data-testid='transfer-button']")
    await sleep(5000)

    const confirmPhatomTarget = await browser.waitForTarget((target) => target.url().endsWith("notification.html"))
    const confirmPhatomPage = await confirmPhatomTarget.asPage()

    await confirmPhatomPage?.evaluate(() => {
      const buttons = document.querySelectorAll("button")

      buttons.forEach((button) => {
        if (button.innerText === "Подтвердить") {
          button.click()
          return
        }
      })
    })

    const isSpinExist = async () => {
      return await page.evaluate(() => !!document.querySelector(".animate-spin"))
    }

    while (await isSpinExist()) {
      await sleep(2000)
    }

    const isTransferCompleted = await page.evaluate(() => {
      const element = Array.from(document.querySelectorAll("*")).find((el) => el?.textContent === "Transfer Completed")
      return !!element
    })

    if (isTransferCompleted) {
      const link = await page.evaluate(() => {
        const a = Array.from(document.querySelectorAll("a"))

        return a.find((link) => link.href.includes("https://solscan.io/tx"))?.href
      })
      console.log(`Кошелёк ${this.client.name} отправил бридж в Neon. ${link}`)
    } else {
      throw new Error(`Во время бриджа на кошельке ${this.client.name} произошла ошибка`)
    }
  }

  static async connectWalleIceCream(browser: Browser) {
    const page = (await browser.pages())[0]

    const isWalletNotConnected = async () => {
      return await page.evaluate(() => {
        return !!Array.from(document.querySelectorAll("div")).find((el) => el.textContent?.includes("Connect Wallet"))
      })
    }

    if (await isWalletNotConnected()) {
      await page.waitForSelector("text/Connect Wallet")
      await page.click("text/Connect Wallet")

      await page.waitForSelector("text/Injected")
      await page.click("text/Injected")

      await sleep(1000)

      if (await isWalletNotConnected()) {
        const isErrorExist = await page.evaluate(() => {
          let isErrorExist = false

          document.querySelectorAll("button").forEach((element) => {
            console.log("textContent", element.textContent)
            console.log("innerText", element.innerText)

            if (element.innerText === "Retry") {
              isErrorExist = true
            }
          })

          return isErrorExist
        })

        if (isErrorExist) {
          await Wallet.flipRabby(browser)

          await page.reload()
          await page.waitForSelector("text/Connect Wallet")
          await page.click("text/Connect Wallet")

          await page.waitForSelector("text/Injected")
          await page.click("text/Injected")

          await sleep(5000)
        }

        const popupTarget = await browser.waitForTarget((target) =>
          target.url().endsWith("notification.html#/approval"),
        )

        const popupPage = await popupTarget?.asPage()

        if (popupPage) {
          await sleep(5000)

          await popupPage.evaluate(() => {
            document.querySelectorAll("button").forEach((button) => {
              if (button.innerText === "Connect") {
                button.click()
                return
              }
            })
          })
        }
      }
    }
    await sleep(2000)
  }

  @RetryDecorator()
  async swap(browser: Browser, { fromToken, toToken }: { fromToken: Token; toToken?: Token }) {
    let toTokenName = Tokens.Neon.contract
    let url = `https://icecreamswap.com/swap?chain=neon&outputCurrency=${toTokenName}&inputCurrency=${fromToken.contract}`

    if (toToken) {
      toTokenName = toToken.name
      url = `https://icecreamswap.com/swap?chain=neon&outputCurrency=${toToken.contract}&inputCurrency=${fromToken.contract}`
    }

    const getBalance = async () => {
      if (fromToken.name === Tokens.Neon.name) {
        return Number((await this.client.chainClient.wallet.balance()).Wei) / 10 ** fromToken.decimals
      }

      return Number((await this.client.chainClient.wallet.balance(fromToken.contract)).Wei) / 10 ** fromToken.decimals
    }
    const oldBalance = await getBalance()

    const page = (await browser.pages())[0]
    await page.bringToFront()

    await page.goto(url, { waitUntil: "networkidle0" })

    await sleep(2000)
    await Neon.connectWalleIceCream(browser)

    if (fromToken.name === Tokens.Neon.name) {
      const swapAmount = `${oldBalance - CONFIG.minNeonBalance}`
      await page.type("input[title='Token Amount']", swapAmount)
    } else {
      await page.waitForSelector("text/Max")
      await page.click("text/Max")
    }

    await page.waitForSelector("button[id='swap-button']:not([disabled])")

    await page.click("button[id='swap-button']")

    await page.waitForSelector("button[id='confirm-swap-or-send']")
    await page.click("button[id='confirm-swap-or-send']")

    const popupTarget = await browser.waitForTarget((target) => target.url().endsWith("notification.html#/approval"))

    const popupPage = await popupTarget.asPage()
    await sleep(15000)

    await popupPage.evaluate(() => {
      document.querySelectorAll("button").forEach((button) => {
        if (button.innerText === "Sign") {
          button.click()
          return
        }
      })

      document.querySelectorAll("button").forEach((button) => {
        if (button.innerText === "Confirm") {
          button.click()
          return
        }
      })
    })

    try {
      await page.waitForSelector("text/Transaction Submitted")
    } catch (error) {
      await popupPage.close()
    }
    const elementExists = await page.evaluate(() => {
      const element = Array.from(document.querySelectorAll("div")).find(
        (el) => el?.textContent === "Transaction Submitted",
      )
      return !!element
    })

    if (elementExists) {
      console.log(`Кошелёк ${this.client.name} отправил свап ${fromToken.name} -> ${toTokenName}`)
    } else {
      throw new Error(`Транзакция свап ${fromToken.name} -> ${toTokenName} не отправилась`)
    }

    let counter = 0
    while (oldBalance === (await getBalance())) {
      if (counter === 21) {
        throw new Error(`Во время свапа ${fromToken.name} -> ${toTokenName} произошла ошибка. Слишком долгое ожидаение`)
      }
      await sleep(15000)

      ++counter
    }

    console.log(`Кошелёк ${this.client.name} совершил свап ${fromToken.name} -> ${toTokenName}`)
  }
}

export { Neon }

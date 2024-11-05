/* eslint-disable @typescript-eslint/no-explicit-any */
import { Browser } from "puppeteer"
import { sleep } from "../helpers"

function RetryDecorator() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>,
  ) {
    const originalMethod = descriptor.value!

    descriptor.value = async function (...args: any[]) {
      const browser: Browser = args[0]
      const page = (await browser.pages())[0]
      let attempts = 0

      while (attempts <= 10) {
        try {
          return await originalMethod.apply(this, args)
        } catch (error) {
          attempts++

          console.error(`Ошибка при выполнении ${propertyKey} (попытка ${attempts}): ${error}`)

          if (attempts >= 10) {
            console.warn(`Не удалось выполнить ${propertyKey} после ${attempts} попыток. Пропускаем...`)
            await browser.close()
            return null
          }

          console.log("Пробуем снова...")
          // await page.reload({ waitUntil: "networkidle0" })
          await sleep(10000)
        }
      }
    }
    return descriptor
  }
}

export { RetryDecorator }

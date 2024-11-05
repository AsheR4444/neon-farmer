import prompts from "prompts"

import createDb from "./helpers/database"
import bridgeAndFarm from "./farmAndBridge"

const main = async () => {
  const response = await prompts({
    type: "select",
    name: "action",
    message: "Выберите действие:",
    choices: [
      { title: "Импортировать кошельки из data.json в БД", value: "import" },
      { title: "Бридж + Фарм", value: "bridgeAndFarm" },
    ],
  })

  if (response.action === "import") {
    await createDb()
  }

  // if (response.action === "bridge") {
  //   await bridge()
  // }

  // if (response.action === "farm") {
  //   await farm()
  // }

  if (response.action === "bridgeAndFarm") {
    await bridgeAndFarm()
  }
}

main()

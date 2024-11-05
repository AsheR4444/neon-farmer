import path from "path"

const ROOT_DIR = path.resolve()
const SRC_DIR = path.join(ROOT_DIR, "src")
const EXTENSIONS_DIR = path.join(SRC_DIR, "extensions")

const PHATOM_PATH = path.join(EXTENSIONS_DIR, "phantom")
const RABBY_PATH = path.join(EXTENSIONS_DIR, "rabby")
const DB_PATH = path.join(SRC_DIR, "wallets.db")

export { ROOT_DIR, EXTENSIONS_DIR, PHATOM_PATH, RABBY_PATH, DB_PATH }

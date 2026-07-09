import { WarehouseDeskApp } from "./warehouseDeskApp.ts"

const main = (): void => {
  const app = new WarehouseDeskApp()
  app.seedData()
  app.runDemoDay()
}

main()

const express = require("express");
require("dotenv").config();
const urFaceData = require(process.env.DATA_FILE);

const app = express();
const { google } = require("googleapis");
const port = 3000;
const cors = require("cors");
const { By, Builder, Browser, until } = require("selenium-webdriver");
const assert = require("assert");
const webdriver = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const { JWT } = require("google-auth-library");
const creds = require("./credentials.json");
const { GoogleSpreadsheet } = require("google-spreadsheet");
// const { getData } = require("./utils");

// const SCOPES = [
//   "https://www.googleapis.com/auth/spreadsheets",
//   "https://www.googleapis.com/auth/drive.file",
// ];
// const jwt = new JWT({
//   email: creds.client_email,
//   key: creds.private_key,
//   scopes: SCOPES,
// });

app.use(cors());
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

// test selenium utils
// (async function firstTest() {
//   let driver;

//   try {
//     driver = await new Builder().forBrowser(Browser.CHROME).build();
//     await driver.get('https://www.selenium.dev/selenium/web/web-form.html');

//     let title = await driver.getTitle();
//     assert.equal("Web form", title);

//     await driver.manage().setTimeouts({implicit: 500});

//     let textBox = await driver.findElement(By.name('my-text'));
//     let submitButton = await driver.findElement(By.css('button'));

//     await textBox.sendKeys('Selenium');
//     await submitButton.click();

//     let message = await driver.findElement(By.id('message'));
//     let value = await message.getText();
//     assert.equal("Received!", value);
//   } catch (e) {
//     console.log(e)
//   } finally {
//     await driver.quit();
//   }
// }())

// Проверка доступа к таблицам
// async function checkPermissions() {
//   const auth = new google.auth.GoogleAuth({
//     keyFile: './credentials.json',
//     scopes: ['https://www.googleapis.com/auth/spreadsheets'],
//   });

//   const authClient = await auth.getClient();
//   const sheetsApi = google.sheets({ version: 'v4', auth: authClient });

//   try {
//     const response = await sheetsApi.spreadsheets.get({
//       spreadsheetId: '1kvAgk0uWAaXLYlnUJZAlssqIwSbGruNYidToboZ1BqM',
//     });
//     console.log('Access granted:', response.data);
//   } catch (error) {
//     console.error('Error:', error);
//   }
// }
// checkPermissions();

// Настройка аутентификации

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "./credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const spreadsheetId = "1kvAgk0uWAaXLYlnUJZAlssqIwSbGruNYidToboZ1BqM";

  // Получение клиента аутентификации
  const authClient = await auth.getClient();

  // Создание экземпляра Google Sheets API
  const sheets = google.sheets({ version: "v4", auth: authClient });

  // Пример запроса к Google Sheets API

  app.get("/processingData", async (req, res) => {
    try {
      console.log(urFaceData);
      async function selectContract(
        objectName,
        contractNum,
        val,
        indf,
        driver
      ) {
        //  операция 1 поиск договора в интпуте
        await driver
          .wait(
            until.elementLocated(By.xpath("/html/body/div[1]/div/div[1]/a[5]")),
            20 * 1000
          )
          .then(async (link_give) => {
            await link_give.click();
          });
        //  операция 2 выбор договора в интпуте

        await driver
          .wait(
            until.elementLocated(
              By.xpath(
                "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div/div/span[1]/input"
              )
            ),
            20 * 1000
          )
          .then(async (select_contract) => {
            await select_contract.click();

            await driver.sleep(1000);
            try {
              await driver
                .wait(
                  until.elementLocated(
                    By.xpath(`//div[@title="${contractNum}"]`)
                  ),
                  10 * 1000
                )
                .then(async (needed_div) => {
                  await needed_div.click();
                });

              //  операция 3 выбор объекта
              await driver
                .wait(
                  until.elementLocated(
                    By.xpath(
                      "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div[2]/div/span[1]/input"
                    )
                  ),
                  20 * 1000
                )
                .then(async (select_object) => {
                  await select_object.click();

                  try {
                    driver
                      .wait(
                        until.elementLocated(
                          By.xpath(`//div[@title="${objectName}"]`)
                        ),
                        10 * 1000
                      )
                      .then(async (needed_div) => {
                        await needed_div.click();

                        try {
                          driver
                            .wait(
                              until.elementLocated(By.tagName(`tbody`)),
                              20 * 1000
                            )
                            .then(async (tbody) => {
                              let trs = await driver.findElements(
                                By.tagName("tr")
                              );
                              if (trs.length <= 0) {
                                res
                                  .status(200)
                                  .send(
                                    "По данному договору приборы учета отсутствуют"
                                  );
                              } else {
                                trs.forEach(async (tr) => {
                                  let attribute = await tr.getAttribute(
                                    "class"
                                  );
                                  if (
                                    attribute ==
                                    "ant-table-row ant-table-row-level-0 editable-row"
                                  ) {
                                    let needed_input = await tr.findElement(
                                      By.tagName("input")
                                    );
                                    // -------------------------------------Отправка результата -----------------------
                                    await needed_input.sendKeys(val);
                                  }
                                });
                                await driver
                                  .wait(
                                    until.elementLocated(
                                      By.xpath(
                                        "/html/body/div[1]/div/div[2]/div[2]/div[2]/form/button"
                                      )
                                    ),
                                    20 * 1000
                                  )
                                  .then(async (send_button) => {
                                    try {
                                      await driver.sleep(1000);

                                      // Закрывает всплывающее окно чата
                                      await driver
                                        .wait(
                                          until.elementLocated(
                                            By.xpath(
                                              "/html/body/div[1]/div/div[4]/button"
                                            )
                                          ),
                                          10 * 1000
                                        )
                                        .then(async (close_button_window) => {
                                          await close_button_window.click();
                                        });
                                      await driver.sleep(2000);
                                      await send_button.click();
                                      await driver.sleep(3000);
                                      await driver.close();

                                      // отловить статусы в html и сделать логику с 20 -25 и с 1 - 2 числа
                                      res
                                        .status(200)
                                        .send(
                                          `Показания ${val} переданы по объекту ${objectName}`
                                        );
                                    } catch (err) {
                                      console.log(
                                        `Ошибка отправки показаний ${val} по объекту ${objectName} период передачи ${indf}`
                                      );
                                    }
                                  });
                              }
                            });
                        } catch (err) {
                          console.log(err);
                          res.status(200).send("Ошибка");
                        }
                      });
                  } catch {
                    console.log("Заданный объект не найден 1");
                    res.status(200).send("Заданный объект не найден");
                  }
                }, 2 * 1000);
            } catch {
              console.log(`Заданный договор ${contractNum} не найден`);
              res.status(200).send(`Заданный договор ${contractNum} не найден`);
            }
          });
      }
      async function selectUrFace(
        name,
        driver,
        objectName,
        contractNum,
        indf,
        val
      ) {
        // ----------------------выбор юр лица-------------------
        await driver
          .wait(
            until.elementLocated(
              By.xpath(
                "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[2]/div[1]/span[2]"
              )
            ),
            20 * 1000
          )
          .then(async (select_contract) => {
            await select_contract.click();
          });
        // Ожидание появления выпадающего списка
        await driver.wait(
          until.elementLocated(By.className("ant-select-dropdown")),
          10 * 1000
        );

        // Добавление задержки для загрузки элементов списка
        await driver.sleep(1000);

        // Получение всех элементов списка
        let options = await driver.findElements(
          By.css(".ant-select-dropdown .ant-select-item")
        );
        // Выбор нужного элемента по тексту
        for (let option of options) {
          if ((await option.getText()) === `${name}`) {
            await option.click();
            await driver.sleep(1000);
            await selectContract(objectName, contractNum, val, indf, driver);
            break;
          }
        }
      }
      async function authorization(
        { num, pass, objectName, contractNum, name, indf },
        val
      ) {
        try {
          let driver = await new Builder()
            .forBrowser(webdriver.Browser.CHROME)
            .build();
          await driver.get("https://ulk.vostok-electra.ru");
          await driver
            .wait(until.elementLocated(By.id("login")))
            .then(async (input_login) => {
              await input_login.sendKeys(num);
            });
          await driver
            .wait(
              until.elementLocated(
                By.xpath(
                  "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button"
                )
              ),
              20 * 1000
            )
            .then(async (button_submit) => {
              await button_submit.click();
            });
          await driver
            .wait(until.elementLocated(By.id("password")), 20 * 1000)
            .then(async (input_password) => {
              await input_password.sendKeys(pass);
            });
          await driver
            .wait(
              until.elementLocated(
                By.xpath(
                  "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button[2]"
                )
              ),
              20 * 1000
            )
            .then(async (button_submit) => {
              await button_submit.click();
            });
          if (name !== "Спутник") {
            return selectUrFace(
              name,
              driver,
              objectName,
              contractNum,
              indf,
              val
            );

            // await driver.sleep(1000);
            // await driver.quit();
          } else if (name == "Спутник") {
            return selectContract(objectName, contractNum, val, indf, driver);
            // await driver.sleep(1000);
            // await driver.quit();
          }

          // await driver.sleep(1000);
          // await driver.quit();
        } catch (e) {
          console.log(e);
        }
      }

      for (const el of urFaceData) {
        const ranges = el.ranges;
        const response = await sheets.spreadsheets.values.batchGet({
          spreadsheetId,
          ranges,
        });

        const value = response.data.valueRanges[0].values[0][0];
        // console.log(value);

        await authorization(el, value);
      }
    } catch (error) {
      res.status(500).send("Error retrieving data");
    }
  });
  // ============================================================

  app.get("/sputnikBZ", async (req, res) => {
    try {
      // let bazaOtdiha = 0;
      // const spreadsheetId = "1kvAgk0uWAaXLYlnUJZAlssqIwSbGruNYidToboZ1BqM";
      // const range = ["Июль 2024!H8", "Июль 2024!H9", "Июль 2024!H12"];
      // const response = await sheets.spreadsheets.values.get({
      //   spreadsheetId,
      //   range,
      // });

      const spreadsheetId = "1kvAgk0uWAaXLYlnUJZAlssqIwSbGruNYidToboZ1BqM";
      const ranges = ["Июль 2024!H8"];

      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      });

      const value = response.data.valueRanges[0].values[0][0];

      // переформатирование матрицы в мас.объектов
      // const formattedData = response.data.values.map((row) => {
      //   let obj = {};
      //   row.forEach((header, index) => {
      //     obj[index] = row[index];
      //   });
      //   return obj;
      // });

      // bazaOtdiha = await response.data.values[0][0];
      // bazaOtdiha = await response.data.values;

      // Selenium webDriver
      const num = "612081483";
      const pass = "Test72";

      // аунтификация в лк
      let driver = await new Builder()
        .forBrowser(webdriver.Browser.CHROME)
        .build();
      await driver.get("https://ulk.vostok-electra.ru");

      await driver
        .wait(until.elementLocated(By.id("login")))
        .then(async (input_login) => {
          await input_login.sendKeys(num);
        });
      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button"
            )
          ),
          20 * 1000
        )
        .then(async (button_submit) => {
          await button_submit.click();
        });

      await driver
        .wait(until.elementLocated(By.id("password")), 20 * 1000)
        .then(async (input_password) => {
          await input_password.sendKeys(pass);
        });

      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button[2]"
            )
          ),
          20 * 1000
        )
        .then(async (button_submit) => {
          await button_submit.click();
        });
      //  операция 1 поиск договора в интпуте ________________________
      await driver
        .wait(
          until.elementLocated(By.xpath("/html/body/div[1]/div/div[1]/a[5]")),
          20 * 1000
        )
        .then(async (link_give) => {
          await link_give.click();
        });

      //  операция 2 выбор договора в интпуте

      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div/div/span[1]/input"
            )
          ),
          20 * 1000
        )
        .then(async (select_contract) => {
          await select_contract.click();
          setTimeout(async () => {
            try {
              await driver
                .wait(
                  until.elementLocated(By.xpath(`//div[@title="7180"]`)),
                  10 * 1000
                )
                .then(async (needed_div) => {
                  await needed_div.click();
                });

              await driver
                .wait(
                  until.elementLocated(
                    By.xpath(
                      "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div[2]/div/span[1]/input"
                    )
                  ),
                  20 * 1000
                )
                //  операция 3 выбор объекта
                // ______________________________________________________________________
                .then(async (select_object) => {
                  await select_object.click();

                  try {
                    driver
                      .wait(
                        until.elementLocated(
                          By.xpath(`//div[@title="База отдыха"]`)
                        ),
                        10 * 1000
                      )
                      .then(async (needed_div) => {
                        await needed_div.click();

                        try {
                          driver
                            .wait(
                              until.elementLocated(By.tagName(`tbody`)),
                              20 * 1000
                            )
                            .then(async (tbody) => {
                              let trs = await driver.findElements(
                                By.tagName("tr")
                              );
                              if (trs.length <= 0) {
                                res
                                  .status(200)
                                  .send(
                                    "По данному договору приборы учета отсутствуют"
                                  );
                              } else {
                                trs.forEach(async (tr) => {
                                  let attribute = await tr.getAttribute(
                                    "class"
                                  );
                                  if (
                                    attribute ==
                                    "ant-table-row ant-table-row-level-0 editable-row"
                                  ) {
                                    let needed_input = await tr.findElement(
                                      By.tagName("input")
                                    );
                                    // -------------------------------------Отправка результата -----------------------
                                    await needed_input.sendKeys(value);
                                  }
                                });
                                await driver
                                  .wait(
                                    until.elementLocated(
                                      By.xpath(
                                        "/html/body/div[1]/div/div[2]/div[2]/div[2]/form/button"
                                      )
                                    ),
                                    20 * 1000
                                  )
                                  .then(async (send_button) => {
                                    setTimeout(async () => {
                                      // Закрывает всплывающее окно чата
                                      await driver
                                        .wait(
                                          until.elementLocated(
                                            By.xpath(
                                              "/html/body/div[1]/div/div[4]/button"
                                            )
                                          ),
                                          10 * 1000
                                        )
                                        .then(async (close_button_window) => {
                                          await close_button_window.click();
                                        });
                                      await send_button.click();
                                      setTimeout(async () => {
                                        await driver.close();
                                        res
                                          .status(200)
                                          .send("Показания успешно переданы");
                                      }, 2 * 1000);
                                    }, 2 * 1000);
                                  });
                              }
                            });
                        } catch (err) {
                          console.log(err);
                          res.status(200).send("Ошибка");
                        }
                      });
                  } catch {
                    console.log("Заданный объект не найден 1");
                    res.status(200).send("Заданный объект не найден");
                  }
                }, 5 * 1000);
              // _______________________________________________________________________________________________________
            } catch {
              console.log("Заданный договор не найден");
              res.status(200).send("Заданный договор не найден");
            }
          }, 5 * 1000);
        });
    } catch (error) {
      res.status(500).send("Error retrieving data");
    }
  });

  app.get("/sputnikOZ8", async (req, res) => {
    try {
      const spreadsheetId = "1kvAgk0uWAaXLYlnUJZAlssqIwSbGruNYidToboZ1BqM";
      const ranges = ["Июль 2024!H9"];

      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      });

      const value = response.data.valueRanges[0].values[0][0];

      // Selenium webDriver
      const num = "612081483";
      const pass = "Test72";

      // аунтификация в лк
      let driver = await new Builder()
        .forBrowser(webdriver.Browser.CHROME)
        .build();
      await driver.get("https://ulk.vostok-electra.ru");

      await driver
        .wait(until.elementLocated(By.id("login")))
        .then(async (input_login) => {
          await input_login.sendKeys(num);
        });
      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button"
            )
          ),
          20 * 1000
        )
        .then(async (button_submit) => {
          await button_submit.click();
        });

      await driver
        .wait(until.elementLocated(By.id("password")), 20 * 1000)
        .then(async (input_password) => {
          await input_password.sendKeys(pass);
        });

      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button[2]"
            )
          ),
          20 * 1000
        )
        .then(async (button_submit) => {
          await button_submit.click();
        });
      //  операция 1 поиск договора в интпуте ________________________
      await driver
        .wait(
          until.elementLocated(By.xpath("/html/body/div[1]/div/div[1]/a[5]")),
          20 * 1000
        )
        .then(async (link_give) => {
          await link_give.click();
        });

      //  операция 2 выбор договора в интпуте

      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div/div/span[1]/input"
            )
          ),
          20 * 1000
        )
        .then(async (select_contract) => {
          await select_contract.click();
          setTimeout(async () => {
            try {
              await driver
                .wait(
                  until.elementLocated(By.xpath(`//div[@title="7180"]`)),
                  10 * 1000
                )
                .then(async (needed_div) => {
                  await needed_div.click();
                });

              await driver
                .wait(
                  until.elementLocated(
                    By.xpath(
                      "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div[2]/div/span[1]/input"
                    )
                  ),
                  20 * 1000
                )
                //  операция 3 выбор объекта
                // ______________________________________________________________________
                .then(async (select_object) => {
                  await select_object.click();

                  try {
                    driver
                      .wait(
                        until.elementLocated(
                          By.xpath(`//div[@title="индивидуальный жилой дом"]`)
                        ),
                        10 * 1000
                      )
                      .then(async (needed_div) => {
                        await needed_div.click();

                        try {
                          driver
                            .wait(
                              until.elementLocated(By.tagName(`tbody`)),
                              20 * 1000
                            )
                            .then(async (tbody) => {
                              let trs = await driver.findElements(
                                By.tagName("tr")
                              );
                              if (trs.length <= 0) {
                                res
                                  .status(200)
                                  .send(
                                    "По данному договору приборы учета отсутствуют"
                                  );
                              } else {
                                trs.forEach(async (tr) => {
                                  let attribute = await tr.getAttribute(
                                    "class"
                                  );
                                  if (
                                    attribute ==
                                    "ant-table-row ant-table-row-level-0 editable-row"
                                  ) {
                                    let needed_input = await tr.findElement(
                                      By.tagName("input")
                                    );
                                    // -------------------------------------Отправка результата -----------------------
                                    await needed_input.sendKeys(value);
                                  }
                                });
                                await driver
                                  .wait(
                                    until.elementLocated(
                                      By.xpath(
                                        "/html/body/div[1]/div/div[2]/div[2]/div[2]/form/button"
                                      )
                                    ),
                                    20 * 1000
                                  )
                                  .then(async (send_button) => {
                                    setTimeout(async () => {
                                      // Закрывает всплывающее окно чата
                                      await driver
                                        .wait(
                                          until.elementLocated(
                                            By.xpath(
                                              "/html/body/div[1]/div/div[4]/button"
                                            )
                                          ),
                                          10 * 1000
                                        )
                                        .then(async (close_button_window) => {
                                          await close_button_window.click();
                                        });
                                      await send_button.click();
                                      setTimeout(async () => {
                                        await driver.close();
                                        res
                                          .status(200)
                                          .send("Показания успешно переданы");
                                      }, 2 * 1000);
                                    }, 2 * 1000);
                                  });
                              }
                            });
                        } catch (err) {
                          console.log(err);
                          res.status(200).send("Ошибка");
                        }
                      });
                  } catch {
                    console.log("Заданный объект не найден 1");
                    res.status(200).send("Заданный объект не найден");
                  }
                }, 5 * 1000);
              // _______________________________________________________________________________________________________
            } catch {
              console.log("Заданный договор не найден");
              res.status(200).send("Заданный договор не найден");
            }
          }, 5 * 1000);
        });
    } catch (error) {
      res.status(500).send("Error retrieving data");
    }
  });

  app.get("/ipShevchikOffice", async (req, res) => {
    try {
      const spreadsheetId = "1kvAgk0uWAaXLYlnUJZAlssqIwSbGruNYidToboZ1BqM";
      const ranges = ["Июль 2024!H72"];

      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      });

      const value = response.data.valueRanges[0].values[0][0];
      console.log(value);

      const num = "323204379";
      const pass = "CgLVuJjFmgbhJ@8";

      // аунтификация в лк
      let driver = await new Builder()
        .forBrowser(webdriver.Browser.CHROME)
        .build();
      await driver.get("https://ulk.vostok-electra.ru");

      await driver
        .wait(until.elementLocated(By.id("login")))
        .then(async (input_login) => {
          await input_login.sendKeys(num);
        });
      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button"
            )
          ),
          20 * 1000
        )
        .then(async (button_submit) => {
          await button_submit.click();
        });

      await driver
        .wait(until.elementLocated(By.id("password")), 20 * 1000)
        .then(async (input_password) => {
          await input_password.sendKeys(pass);
        });

      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button[2]"
            )
          ),
          20 * 1000
        )
        .then(async (button_submit) => {
          await button_submit.click();
        });

      // ----------------------выбор юр лица-------------------
      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[2]/div[1]/span[2]"
            )
          ),
          20 * 1000
        )
        .then(async (select_contract) => {
          await select_contract.click();

          // Ожидание появления выпадающего списка
          await driver.wait(
            until.elementLocated(By.className("ant-select-dropdown")),
            10 * 1000
          );

          // Добавление задержки для загрузки элементов списка
          await driver.sleep(1000);

          // Получение всех элементов списка
          let options = await driver.findElements(
            By.css(".ant-select-dropdown .ant-select-item")
          );

          // Логирование текста всех элементов списка в консоль
          for (let option of options) {
            console.log(await option.getText());
          }

          // Выбор нужного элемента по тексту
          for (let option of options) {
            if ((await option.getText()) === "ИП Шевчик Владимир Степанович") {
              await option.click();
              break;
            }
          }
        });

      // -----------------------------------------
      //  операция 1 клик по передаче показаний поиск договора в интпуте ________________________
      await driver.sleep(1000);
      await driver
        .wait(
          until.elementLocated(By.xpath("/html/body/div[1]/div/div[1]/a[5]")),
          20 * 1000
        )
        .then(async (link_give) => {
          await link_give.click();
        });

      //  операция 2 выбор договора в интпуте

      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div/div/span[1]/input"
            )
          ),
          20 * 1000
        )
        .then(async (select_contract) => {
          await select_contract.click();
          setTimeout(async () => {
            try {
              await driver
                .wait(
                  until.elementLocated(
                    By.xpath(`//div[@title="ТС01ЭЭ0100027462"]`)
                  ),
                  10 * 1000
                )
                .then(async (needed_div) => {
                  await needed_div.click();
                });

              //  операция 3 выбор объекта
              await driver
                .wait(
                  until.elementLocated(
                    By.xpath(
                      "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div[2]/div/span[1]/input"
                    )
                  ),
                  20 * 1000
                )
                .then(async (select_object) => {
                  await select_object.click();

                  try {
                    driver
                      .wait(
                        until.elementLocated(By.xpath(`//div[@title="Офис"]`)),
                        10 * 1000
                      )
                      .then(async (needed_div) => {
                        await needed_div.click();

                        try {
                          driver
                            .wait(
                              until.elementLocated(By.tagName(`tbody`)),
                              20 * 1000
                            )
                            .then(async (tbody) => {
                              let trs = await driver.findElements(
                                By.tagName("tr")
                              );
                              if (trs.length <= 0) {
                                res
                                  .status(200)
                                  .send(
                                    "По данному договору приборы учета отсутствуют"
                                  );
                              } else {
                                trs.forEach(async (tr) => {
                                  let attribute = await tr.getAttribute(
                                    "class"
                                  );
                                  if (
                                    attribute ==
                                    "ant-table-row ant-table-row-level-0 editable-row"
                                  ) {
                                    let needed_input = await tr.findElement(
                                      By.tagName("input")
                                    );
                                    // -------------------------------------Отправка результата -----------------------
                                    await needed_input.sendKeys(value);
                                  }
                                });
                                await driver
                                  .wait(
                                    until.elementLocated(
                                      By.xpath(
                                        "/html/body/div[1]/div/div[2]/div[2]/div[2]/form/button"
                                      )
                                    ),
                                    20 * 1000
                                  )
                                  .then(async (send_button) => {
                                    setTimeout(async () => {
                                      // Закрывает всплывающее окно чата
                                      await driver
                                        .wait(
                                          until.elementLocated(
                                            By.xpath(
                                              "/html/body/div[1]/div/div[4]/button"
                                            )
                                          ),
                                          10 * 1000
                                        )
                                        .then(async (close_button_window) => {
                                          await close_button_window.click();
                                        });
                                      await send_button.click();
                                      setTimeout(async () => {
                                        await driver.close();
                                        res
                                          .status(200)
                                          .send("Показания успешно переданы");
                                      }, 2 * 1000);
                                    }, 2 * 1000);
                                  });
                              }
                            });
                        } catch (err) {
                          console.log(err);
                          res.status(200).send("Ошибка");
                        }
                      });
                  } catch {
                    console.log("Заданный объект не найден 1");
                    res.status(200).send("Заданный объект не найден");
                  }
                }, 2 * 1000);
              // _______________________________________________________________________________________________________
            } catch {
              console.log("Заданный договор не найден");
              res.status(200).send("Заданный договор не найден");
            }
          }, 2 * 1000);
        });
    } catch (error) {
      res.status(500).send("Error retrieving data");
    }
  });
  app.get("/ipShevchikMagazine", async (req, res) => {
    try {
      const spreadsheetId = "1kvAgk0uWAaXLYlnUJZAlssqIwSbGruNYidToboZ1BqM";
      const ranges = ["Июль 2024!H47"];

      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      });

      const value = response.data.valueRanges[0].values[0][0];
      console.log(value);

      const num = "323204379";
      const pass = "CgLVuJjFmgbhJ@8";

      // аунтификация в лк
      let driver = await new Builder()
        .forBrowser(webdriver.Browser.CHROME)
        .build();
      await driver.get("https://ulk.vostok-electra.ru");

      await driver
        .wait(until.elementLocated(By.id("login")))
        .then(async (input_login) => {
          await input_login.sendKeys(num);
        });
      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button"
            )
          ),
          20 * 1000
        )
        .then(async (button_submit) => {
          await button_submit.click();
        });

      await driver
        .wait(until.elementLocated(By.id("password")), 20 * 1000)
        .then(async (input_password) => {
          await input_password.sendKeys(pass);
        });

      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button[2]"
            )
          ),
          20 * 1000
        )
        .then(async (button_submit) => {
          await button_submit.click();
        });
      // -----------------------выбор юрлица---------------
      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[2]/div[1]/span[2]"
            )
          ),
          20 * 1000
        )
        .then(async (select_contract) => {
          await select_contract.click();

          // Ожидание появления выпадающего списка
          await driver.wait(
            until.elementLocated(By.className("ant-select-dropdown")),
            10 * 1000
          );

          // Добавление задержки для загрузки элементов списка
          await driver.sleep(1000);

          // Получение всех элементов списка
          let options = await driver.findElements(
            By.css(".ant-select-dropdown .ant-select-item")
          );

          // Логирование текста всех элементов списка в консоль
          for (let option of options) {
            console.log(await option.getText());
          }

          // Выбор нужного элемента по тексту
          for (let option of options) {
            if ((await option.getText()) === "ИП Шевчик Владимир Степанович") {
              await option.click();
              break;
            }
          }
        });
      await driver.sleep(1000);

      // --------------------------------------
      //  операция 1 поиск договора в интпуте ________________________
      await driver
        .wait(
          until.elementLocated(By.xpath("/html/body/div[1]/div/div[1]/a[5]")),
          20 * 1000
        )
        .then(async (link_give) => {
          await link_give.click();
        });

      //  операция 2 выбор договора в интпуте

      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div/div/span[1]/input"
            )
          ),
          20 * 1000
        )
        .then(async (select_contract) => {
          await select_contract.click();
          setTimeout(async () => {
            try {
              await driver
                .wait(
                  until.elementLocated(
                    By.xpath(`//div[@title="ТС01ЭЭ0100027462"]`)
                  ),
                  10 * 1000
                )
                .then(async (needed_div) => {
                  await needed_div.click();
                });

              await driver
                .wait(
                  until.elementLocated(
                    By.xpath(
                      "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div[2]/div/span[1]/input"
                    )
                  ),
                  20 * 1000
                )
                //  операция 3 выбор объекта
                // ______________________________________________________________________
                .then(async (select_object) => {
                  await select_object.click();

                  try {
                    driver
                      .wait(
                        until.elementLocated(
                          By.xpath(
                            `//div[@title="Нежилое помещение (магазин)"]`
                          )
                        ),
                        10 * 1000
                      )
                      .then(async (needed_div) => {
                        await needed_div.click();

                        try {
                          driver
                            .wait(
                              until.elementLocated(By.tagName(`tbody`)),
                              20 * 1000
                            )
                            .then(async (tbody) => {
                              let trs = await driver.findElements(
                                By.tagName("tr")
                              );
                              if (trs.length <= 0) {
                                res
                                  .status(200)
                                  .send(
                                    "По данному договору приборы учета отсутствуют"
                                  );
                              } else {
                                trs.forEach(async (tr) => {
                                  let attribute = await tr.getAttribute(
                                    "class"
                                  );
                                  if (
                                    attribute ==
                                    "ant-table-row ant-table-row-level-0 editable-row"
                                  ) {
                                    let needed_input = await tr.findElement(
                                      By.tagName("input")
                                    );
                                    // -------------------------------------Отправка результата -----------------------
                                    await needed_input.sendKeys(value);
                                  }
                                });
                                await driver
                                  .wait(
                                    until.elementLocated(
                                      By.xpath(
                                        "/html/body/div[1]/div/div[2]/div[2]/div[2]/form/button"
                                      )
                                    ),
                                    20 * 1000
                                  )
                                  .then(async (send_button) => {
                                    setTimeout(async () => {
                                      // Закрывает всплывающее окно чата
                                      await driver
                                        .wait(
                                          until.elementLocated(
                                            By.xpath(
                                              "/html/body/div[1]/div/div[4]/button"
                                            )
                                          ),
                                          10 * 1000
                                        )
                                        .then(async (close_button_window) => {
                                          await close_button_window.click();
                                        });
                                      await send_button.click();
                                      setTimeout(async () => {
                                        await driver.close();
                                        res
                                          .status(200)
                                          .send("Показания успешно переданы");
                                      }, 2 * 1000);
                                    }, 2 * 1000);
                                  });
                              }
                            });
                        } catch (err) {
                          console.log(err);
                          res.status(200).send("Ошибка");
                        }
                      });
                  } catch {
                    console.log("Заданный объект не найден 1");
                    res.status(200).send("Заданный объект не найден");
                  }
                }, 5 * 1000);
              // _______________________________________________________________________________________________________
            } catch {
              console.log("Заданный договор не найден");
              res.status(200).send("Заданный договор не найден");
            }
          }, 5 * 1000);
        });
    } catch (error) {
      res.status(500).send("Error retrieving data");
    }
  });
  app.get("/sicomplex", async (req, res) => {
    try {
      const spreadsheetId = "1kvAgk0uWAaXLYlnUJZAlssqIwSbGruNYidToboZ1BqM";
      const ranges = ["Июль 2024!H117"];

      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      });

      const value = response.data.valueRanges[0].values[0][0];
      console.log(value);

      const num = "323204379";
      const pass = "CgLVuJjFmgbhJ@8";

      // аунтификация в лк
      let driver = await new Builder()
        .forBrowser(webdriver.Browser.CHROME)
        .build();
      await driver.get("https://ulk.vostok-electra.ru");

      await driver
        .wait(until.elementLocated(By.id("login")))
        .then(async (input_login) => {
          await input_login.sendKeys(num);
        });
      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button"
            )
          ),
          20 * 1000
        )
        .then(async (button_submit) => {
          await button_submit.click();
        });

      await driver
        .wait(until.elementLocated(By.id("password")), 20 * 1000)
        .then(async (input_password) => {
          await input_password.sendKeys(pass);
        });

      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button[2]"
            )
          ),
          20 * 1000
        )
        .then(async (button_submit) => {
          await button_submit.click();
        });

      // -----------------------выбор юрлица---------------
      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[2]/div[1]/span[2]"
            )
          ),
          20 * 1000
        )
        .then(async (select_contract) => {
          await select_contract.click();

          // Ожидание появления выпадающего списка
          await driver.wait(
            until.elementLocated(By.className("ant-select-dropdown")),
            10 * 1000
          );

          // Добавление задержки для загрузки элементов списка
          await driver.sleep(1000);

          // Получение всех элементов списка
          let options = await driver.findElements(
            By.css(".ant-select-dropdown .ant-select-item")
          );

          // Логирование текста всех элементов списка в консоль
          for (let option of options) {
            console.log(await option.getText());
          }

          // Выбор нужного элемента по тексту
          for (let option of options) {
            if ((await option.getText()) === "СИ-КОМПЛЕКС ООО") {
              await option.click();
              break;
            }
          }
        });
      await driver.sleep(1000);

      // --------------------------------------
      //  операция 1 поиск договора в интпуте ________________________
      await driver
        .wait(
          until.elementLocated(By.xpath("/html/body/div[1]/div/div[1]/a[5]")),
          20 * 1000
        )
        .then(async (link_give) => {
          await link_give.click();
        });

      //  операция 2 выбор договора в интпуте

      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div/div/span[1]/input"
            )
          ),
          20 * 1000
        )
        .then(async (select_contract) => {
          await select_contract.click();
          setTimeout(async () => {
            try {
              await driver
                .wait(
                  until.elementLocated(
                    By.xpath(`//div[@title="ТС01ЭЭ0100026912"]`)
                  ),
                  10 * 1000
                )
                .then(async (needed_div) => {
                  await needed_div.click();
                });

              await driver
                .wait(
                  until.elementLocated(
                    By.xpath(
                      "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div[2]/div/span[1]/input"
                    )
                  ),
                  20 * 1000
                )
                //  операция 3 выбор объекта
                // ______________________________________________________________________
                .then(async (select_object) => {
                  await select_object.click();

                  try {
                    driver
                      .wait(
                        until.elementLocated(
                          By.xpath(
                            `//div[@title="нежилое помещение, ул. М. Горького, д. 68, корп.1/7"]`
                          )
                        ),
                        10 * 1000
                      )
                      .then(async (needed_div) => {
                        await needed_div.click();

                        try {
                          driver
                            .wait(
                              until.elementLocated(By.tagName(`tbody`)),
                              20 * 1000
                            )
                            .then(async (tbody) => {
                              let trs = await driver.findElements(
                                By.tagName("tr")
                              );
                              if (trs.length <= 0) {
                                res
                                  .status(200)
                                  .send(
                                    "По данному договору приборы учета отсутствуют"
                                  );
                              } else {
                                trs.forEach(async (tr) => {
                                  let attribute = await tr.getAttribute(
                                    "class"
                                  );
                                  if (
                                    attribute ==
                                    "ant-table-row ant-table-row-level-0 editable-row"
                                  ) {
                                    let needed_input = await tr.findElement(
                                      By.tagName("input")
                                    );
                                    // -------------------------------------Отправка результата -----------------------
                                    await needed_input.sendKeys(value);
                                  }
                                });
                                await driver
                                  .wait(
                                    until.elementLocated(
                                      By.xpath(
                                        "/html/body/div[1]/div/div[2]/div[2]/div[2]/form/button"
                                      )
                                    ),
                                    20 * 1000
                                  )
                                  .then(async (send_button) => {
                                    setTimeout(async () => {
                                      // Закрывает всплывающее окно чата
                                      await driver
                                        .wait(
                                          until.elementLocated(
                                            By.xpath(
                                              "/html/body/div[1]/div/div[4]/button"
                                            )
                                          ),
                                          10 * 1000
                                        )
                                        .then(async (close_button_window) => {
                                          await close_button_window.click();
                                        });
                                      await send_button.click();
                                      setTimeout(async () => {
                                        await driver.close();
                                        res
                                          .status(200)
                                          .send("Показания успешно переданы");
                                      }, 2 * 1000);
                                    }, 2 * 1000);
                                  });
                              }
                            });
                        } catch (err) {
                          console.log(err);
                          res.status(200).send("Ошибка");
                        }
                      });
                  } catch {
                    console.log("Заданный объект не найден 1");
                    res.status(200).send("Заданный объект не найден");
                  }
                }, 5 * 1000);
              // _______________________________________________________________________________________________________
            } catch {
              console.log("Заданный договор не найден");
              res.status(200).send("Заданный договор не найден");
            }
          }, 5 * 1000);
        });
    } catch (error) {
      res.status(500).send("Error retrieving data");
    }
  });
  app.get("/sicomplexMG1/8", async (req, res) => {
    try {
      const spreadsheetId = "1kvAgk0uWAaXLYlnUJZAlssqIwSbGruNYidToboZ1BqM";
      const ranges = ["Июль 2024!H119"];

      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      });

      const value = response.data.valueRanges[0].values[0][0];
      console.log(value);

      const num = "323204379";
      const pass = "CgLVuJjFmgbhJ@8";

      // аунтификация в лк
      let driver = await new Builder()
        .forBrowser(webdriver.Browser.CHROME)
        .build();
      await driver.get("https://ulk.vostok-electra.ru");

      await driver
        .wait(until.elementLocated(By.id("login")))
        .then(async (input_login) => {
          await input_login.sendKeys(num);
        });
      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button"
            )
          ),
          20 * 1000
        )
        .then(async (button_submit) => {
          await button_submit.click();
        });

      await driver
        .wait(until.elementLocated(By.id("password")), 20 * 1000)
        .then(async (input_password) => {
          await input_password.sendKeys(pass);
        });

      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button[2]"
            )
          ),
          20 * 1000
        )
        .then(async (button_submit) => {
          await button_submit.click();
        });

      // -----------------------выбор юрлица---------------
      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[2]/div[1]/span[2]"
            )
          ),
          20 * 1000
        )
        .then(async (select_contract) => {
          await select_contract.click();

          // Ожидание появления выпадающего списка
          await driver.wait(
            until.elementLocated(By.className("ant-select-dropdown")),
            10 * 1000
          );

          // Добавление задержки для загрузки элементов списка
          await driver.sleep(1000);

          // Получение всех элементов списка
          let options = await driver.findElements(
            By.css(".ant-select-dropdown .ant-select-item")
          );

          // Логирование текста всех элементов списка в консоль
          for (let option of options) {
            console.log(await option.getText());
          }

          // Выбор нужного элемента по тексту
          for (let option of options) {
            if ((await option.getText()) === "СИ-КОМПЛЕКС ООО") {
              await option.click();
              break;
            }
          }
        });
      await driver.sleep(1000);

      // --------------------------------------
      //  операция 1 поиск договора в интпуте ________________________
      await driver
        .wait(
          until.elementLocated(By.xpath("/html/body/div[1]/div/div[1]/a[5]")),
          20 * 1000
        )
        .then(async (link_give) => {
          await link_give.click();
        });

      //  операция 2 выбор договора в интпуте

      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div/div/span[1]/input"
            )
          ),
          20 * 1000
        )
        .then(async (select_contract) => {
          await select_contract.click();
          setTimeout(async () => {
            try {
              await driver
                .wait(
                  until.elementLocated(
                    By.xpath(`//div[@title="ТС01ЭЭ0100026912"]`)
                  ),
                  10 * 1000
                )
                .then(async (needed_div) => {
                  await needed_div.click();
                });

              await driver
                .wait(
                  until.elementLocated(
                    By.xpath(
                      "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div[2]/div/span[1]/input"
                    )
                  ),
                  20 * 1000
                )
                //  операция 3 выбор объекта
                // ______________________________________________________________________
                .then(async (select_object) => {
                  await select_object.click();

                  try {
                    driver
                      .wait(
                        until.elementLocated(
                          By.xpath(
                            `//div[@title="нежилое помещение, ул. М. Горького, д. 68, корп.1/8"]`
                          )
                        ),
                        10 * 1000
                      )
                      .then(async (needed_div) => {
                        await needed_div.click();

                        try {
                          driver
                            .wait(
                              until.elementLocated(By.tagName(`tbody`)),
                              20 * 1000
                            )
                            .then(async (tbody) => {
                              let trs = await driver.findElements(
                                By.tagName("tr")
                              );
                              if (trs.length <= 0) {
                                res
                                  .status(200)
                                  .send(
                                    "По данному договору приборы учета отсутствуют"
                                  );
                              } else {
                                trs.forEach(async (tr) => {
                                  let attribute = await tr.getAttribute(
                                    "class"
                                  );
                                  if (
                                    attribute ==
                                    "ant-table-row ant-table-row-level-0 editable-row"
                                  ) {
                                    let needed_input = await tr.findElement(
                                      By.tagName("input")
                                    );
                                    // -------------------------------------Отправка результата -----------------------
                                    await needed_input.sendKeys(value);
                                  }
                                });
                                await driver
                                  .wait(
                                    until.elementLocated(
                                      By.xpath(
                                        "/html/body/div[1]/div/div[2]/div[2]/div[2]/form/button"
                                      )
                                    ),
                                    20 * 1000
                                  )
                                  .then(async (send_button) => {
                                    setTimeout(async () => {
                                      // Закрывает всплывающее окно чата
                                      await driver
                                        .wait(
                                          until.elementLocated(
                                            By.xpath(
                                              "/html/body/div[1]/div/div[4]/button"
                                            )
                                          ),
                                          10 * 1000
                                        )
                                        .then(async (close_button_window) => {
                                          await close_button_window.click();
                                        });
                                      await send_button.click();
                                      setTimeout(async () => {
                                        await driver.close();
                                        res
                                          .status(200)
                                          .send("Показания успешно переданы");
                                      }, 2 * 1000);
                                    }, 2 * 1000);
                                  });
                              }
                            });
                        } catch (err) {
                          console.log(err);
                          res.status(200).send("Ошибка");
                        }
                      });
                  } catch {
                    console.log("Заданный объект не найден 1");
                    res.status(200).send("Заданный объект не найден");
                  }
                }, 5 * 1000);
              // _______________________________________________________________________________________________________
            } catch {
              console.log("Заданный договор не найден");
              res.status(200).send("Заданный договор не найден");
            }
          }, 5 * 1000);
        });
    } catch (error) {
      res.status(500).send("Error retrieving data");
    }
  });
  app.get("/lenina47", async (req, res) => {
    try {
      const spreadsheetId = "1kvAgk0uWAaXLYlnUJZAlssqIwSbGruNYidToboZ1BqM";
      const ranges = ["Июль 2024!H137"];

      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      });

      const value = response.data.valueRanges[0].values[0][0];
      console.log(value);

      const num = "323204379";
      const pass = "CgLVuJjFmgbhJ@8";

      // аунтификация в лк
      let driver = await new Builder()
        .forBrowser(webdriver.Browser.CHROME)
        .build();
      await driver.get("https://ulk.vostok-electra.ru");

      await driver
        .wait(until.elementLocated(By.id("login")))
        .then(async (input_login) => {
          await input_login.sendKeys(num);
        });
      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button"
            )
          ),
          20 * 1000
        )
        .then(async (button_submit) => {
          await button_submit.click();
        });

      await driver
        .wait(until.elementLocated(By.id("password")), 20 * 1000)
        .then(async (input_password) => {
          await input_password.sendKeys(pass);
        });

      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[1]/form/button[2]"
            )
          ),
          20 * 1000
        )
        .then(async (button_submit) => {
          await button_submit.click();
        });

      // -----------------------выбор юрлица---------------
      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[1]/div/div[2]/div/div[2]/div[1]/span[2]"
            )
          ),
          20 * 1000
        )
        .then(async (select_contract) => {
          await select_contract.click();

          // Ожидание появления выпадающего списка
          await driver.wait(
            until.elementLocated(By.className("ant-select-dropdown")),
            10 * 1000
          );

          // Добавление задержки для загрузки элементов списка
          await driver.sleep(1000);

          // Получение всех элементов списка
          let options = await driver.findElements(
            By.css(".ant-select-dropdown .ant-select-item")
          );

          // Логирование текста всех элементов списка в консоль
          for (let option of options) {
            console.log(await option.getText());
          }

          // Выбор нужного элемента по тексту
          for (let option of options) {
            if ((await option.getText()) === "РАЗВИТИЕ БИЗНЕСА ООО") {
              await option.click();
              break;
            }
          }
        });
      await driver.sleep(1000);

      // --------------------------------------
      //  операция 1 поиск договора в интпуте ________________________
      await driver
        .wait(
          until.elementLocated(By.xpath("/html/body/div[1]/div/div[1]/a[5]")),
          20 * 1000
        )
        .then(async (link_give) => {
          await link_give.click();
        });

      //  операция 2 выбор договора в интпуте

      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div/div/span[1]/input"
            )
          ),
          20 * 1000
        )
        .then(async (select_contract) => {
          await select_contract.click();
          setTimeout(async () => {
            try {
              await driver
                .wait(
                  until.elementLocated(
                    By.xpath(`//div[@title="ТС01ЭЭ0100028660"]`)
                  ),
                  10 * 1000
                )
                .then(async (needed_div) => {
                  await needed_div.click();
                });

              await driver
                .wait(
                  until.elementLocated(
                    By.xpath(
                      "/html/body/div[1]/div/div[2]/div[2]/div[2]/div/div/div[2]/div/span[1]/input"
                    )
                  ),
                  20 * 1000
                )
                //  операция 3 выбор объекта
                // ______________________________________________________________________
                .then(async (select_object) => {
                  await select_object.click();

                  try {
                    driver
                      .wait(
                        until.elementLocated(By.xpath(`//div[@title="Офис"]`)),
                        10 * 1000
                      )
                      .then(async (needed_div) => {
                        await needed_div.click();

                        try {
                          driver
                            .wait(
                              until.elementLocated(By.tagName(`tbody`)),
                              20 * 1000
                            )
                            .then(async (tbody) => {
                              let trs = await driver.findElements(
                                By.tagName("tr")
                              );
                              if (trs.length <= 0) {
                                res
                                  .status(200)
                                  .send(
                                    "По данному договору приборы учета отсутствуют"
                                  );
                              } else {
                                trs.forEach(async (tr) => {
                                  let attribute = await tr.getAttribute(
                                    "class"
                                  );
                                  if (
                                    attribute ==
                                    "ant-table-row ant-table-row-level-0 editable-row"
                                  ) {
                                    let needed_input = await tr.findElement(
                                      By.tagName("input")
                                    );
                                    // -------------------------------------Отправка результата -----------------------
                                    await needed_input.sendKeys(value);
                                  }
                                });
                                await driver
                                  .wait(
                                    until.elementLocated(
                                      By.xpath(
                                        "/html/body/div[1]/div/div[2]/div[2]/div[2]/form/button"
                                      )
                                    ),
                                    20 * 1000
                                  )
                                  .then(async (send_button) => {
                                    setTimeout(async () => {
                                      // Закрывает всплывающее окно чата
                                      await driver
                                        .wait(
                                          until.elementLocated(
                                            By.xpath(
                                              "/html/body/div[1]/div/div[4]/button"
                                            )
                                          ),
                                          10 * 1000
                                        )
                                        .then(async (close_button_window) => {
                                          await close_button_window.click();
                                        });
                                      await send_button.click();
                                      setTimeout(async () => {
                                        // await driver.close();
                                        res
                                          .status(200)
                                          .send("Показания успешно переданы");
                                      }, 2 * 1000);
                                    }, 2 * 1000);
                                  });
                              }
                            });
                        } catch (err) {
                          console.log(err);
                          res.status(200).send("Ошибка");
                        }
                      });
                  } catch {
                    console.log("Заданный объект не найден 1");
                    res.status(200).send("Заданный объект не найден");
                  }
                }, 5 * 1000);
              // _______________________________________________________________________________________________________
            } catch {
              console.log("Заданный договор не найден");
              res.status(200).send("Заданный договор не найден");
            }
          }, 5 * 1000);
        });
    } catch (error) {
      res.status(500).send("Error retrieving data");
    }
  });
  app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
  });
}

main().catch(console.error);

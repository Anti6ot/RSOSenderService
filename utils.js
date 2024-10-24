const { By, Builder, Browser, until } = require("selenium-webdriver");
const webdriver = require("selenium-webdriver");
const EventEmitter = require("events");
const emitter = new EventEmitter();
emitter.setMaxListeners(20); // Increase the limit to 20 listeners
// ЭК ВОСТОК
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
    return selectUrFace(name, driver, objectName, contractNum, indf, val);
  } catch (e) {
    console.log(e);
  }
}
async function selectContract(objectName, contractNum, val, indf, driver) {
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
            until.elementLocated(By.xpath(`//div[@title="${contractNum}"]`)),
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
                        let trs = await driver.findElements(By.tagName("tr"));
                        if (trs.length <= 0) {
                          res
                            .status(200)
                            .send(
                              "По данному договору приборы учета отсутствуют"
                            );
                        } else {
                          trs.forEach(async (tr) => {
                            let attribute = await tr.getAttribute("class");
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
                                  // "/html/body/div[1]/div/div[4]/button"
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

                                try {
                                  await driver
                                    .wait(
                                      until.elementLocated(
                                        By.xpath(
                                          "//button[@type='submit' and contains(@class, 'ant-btn ant-btn-primary ant-btn-lg sc-bAfeAT kgPYcZ')]"
                                        )
                                      ),
                                      10000
                                    )
                                    .then(async (confirmButton) => {
                                      await confirmButton.click();

                                      await driver
                                        .wait(
                                          until.elementLocated(
                                            By.xpath(
                                              "//button[@type='button' and contains(@class, 'ant-btn sc-kGNybE iqergQ')]"
                                            )
                                          ),
                                          10000
                                        )
                                        .then(async (closeconfirmButton) => {
                                          await closeconfirmButton.click();
                                        });

                                      await driver.sleep(3000);
                                      return driver.close();
                                    });
                                } catch (err) {
                                  console.log(
                                    `Ошибка отправки показаний ${val} по объекту ${objectName} после нажатия отправить `
                                  );
                                }
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
async function selectUrFace(name, driver, objectName, contractNum, indf, val) {
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

// Водоканал
async function authorizationVoda({ num, pass, inputSiteId }, val) {
  console.log(num);
  console.log(inputSiteId);
  console.log(val);

  try {
    let driver = await new Builder()
      .forBrowser(webdriver.Browser.CHROME)
      .build();
    await driver.get("https://lk.rosvodokanal.ru/en/index/index");
    await driver.sleep(1000);

    // Find the select element and click on it
    let selectCity = await driver.wait(
      until.elementLocated(By.id("selectFilialModal")),
      20000
    );
    await selectCity.click();

    // Select the desired option from the dropdown
    let option = await driver.wait(
      until.elementLocated(By.xpath("//option[text()='Тюмень']")),
      20000
    );
    await option.click();

    // Find and click the submit button
    let submitButton = await driver.wait(
      until.elementLocated(By.xpath("//button[@id='modal_save']")),
      20000
    );
    await submitButton.click();

    let input_login = await driver.wait(
      until.elementLocated(By.id("en_username")),
      20 * 1000
    );
    await input_login.sendKeys(num);

    let input_password = await driver.wait(
      until.elementLocated(By.id("en_password")),
      20 * 1000
    );
    await input_password.sendKeys(pass);
    let submit_Button = await driver.wait(
      until.elementLocated(
        By.xpath("//button[@class='btn btn--fourth btn-open']")
      ),
      20000
    );
    await submit_Button.click();
    // await driver.sleep(1000);

    await driver.get("https://lk.rosvodokanal.ru/en/index/watermeter");

    let button_input_water = await driver.wait(
      until.elementLocated(
        By.xpath("//button[@class='btn btn--fourth enter']")
      ),
      20000
    );

    await button_input_water.click();

    // Поиск таблицы со счечиками
    let ttable = await driver.wait(
      until.elementLocated(By.xpath("//table[@id='en_wtrms']")),
      20000
    );
    let targetTbody = await ttable.findElement(By.xpath(".//tbody[2]"));
    // Find all tr elements within the tbody
    let rows = await targetTbody.findElements(By.xpath("./tr"));

    for (let row of rows) {
      // console.log(await row.getAttribute("innerHTML"));

      // console.log(await row.getAttribute("innerHTML"));
      // let inputs = await row.findElements(By.xpath(".//input[@type='number']"));
      await driver.sleep(1000);

      let input = await targetTbody.findElement(
        By.xpath(`.//input[@type='number' and @id='${inputSiteId}']`)
      );

      if (input) {
        await driver.sleep(2000);

        // console.log("Элемент найден с id:", await input.getAttribute("id"));
        //  действия с найденным элементом
        await input.sendKeys(val);
        await driver.sleep(3000);
        // нажати и отправка показаний
        let button_sent_water = await driver.wait(
          until.elementLocated(By.xpath("//button[@id='btt_pre_send']")),
          20000
        );
        await button_sent_water.click();
        await driver.sleep(4000);

        await driver.close();
        emitter.removeAllListeners();

        return console.log("371 Compleate string on utils");
      }
      emitter.removeAllListeners();
      return console.log("395 string on utils");
    }
  } catch (e) {
    console.log(`ошибка в authorizationVoda`);
  }
}
// Водоканал
async function authorizationGazprom(
  { num, pass, inputSiteId, contractNum },
  val
) {
  // console.log(num);
  // console.log(inputSiteId);
  // console.log(val);

  try {
    let driver = await new Builder()
      .forBrowser(webdriver.Browser.CHROME)
      .build();
    await driver.get("https://lku.gesbt.ru/");

    let input_login = await driver.wait(
      until.elementLocated(By.name("USER_LOGIN"))
    );
    await input_login.sendKeys(num);
    await driver.sleep(2000);

    let input_password = await driver.wait(
      until.elementLocated(By.name("USER_PASSWORD"))
    );
    await input_password.sendKeys(pass);
    let submit_Button = await driver.wait(
      until.elementLocated(
        By.xpath("//button[@class='btn_orange btn_default all_width']")
      )
    );
    await submit_Button.click();
    await driver.sleep(2000);

    let input_span_elements = await driver.wait(
      until.elementLocated(
        By.xpath("//span[@class='select2-selection select2-selection--single']")
      ),
      20000
    );
    await input_span_elements.click();
    await driver.sleep(2000);

    let input_span_options = await driver.wait(
      until.elementLocated(
        By.xpath(`//ul[@id="select2-contract_selected-results"]`)
      ),
      10 * 1000
    );
    // Поиск нужного договора внутри выпадающего меню
    let elements = await input_span_options.findElements(By.tagName("li"));
    await driver.sleep(1000);

    for (let el of elements) {
      let id = await el.getText();
      if (id === `${contractNum}`) {
        await el.click();
        break;
      }
    }
    await driver.sleep(2000);

    await driver.get("https://lku.gesbt.ru/lk/meter_values/");

    let input_meter_values = await driver.wait(
      until.elementLocated(By.xpath(`.//input[@class="meter_value"]`)),
      10 * 1000
    );

    // Получаем значение атрибута value
    let value = await input_meter_values.getAttribute("value");
    console.log("Значение элемента:", value);

    //     let button_sent_water = await driver.wait(
    //       until.elementLocated(By.xpath("//button[@id='btt_pre_send']")),
    //       20000
    //     );
    //   }
    driver.quit();
    emitter.removeAllListeners();
    return console.log("395 string on utils");
    // }
  } catch (e) {
    res.status(500).send("Показания не переданы");

    throw new Error("ошибка в authorizationGazprom");

    console.log(`ошибка в authorizationVoda`);
  }
}

module.exports = { authorization, authorizationVoda, authorizationGazprom };

Чтобы всё робатало как задуманно нужно:
1. добавить файл data.js в нем мы имеем такую структуру -
   <p>
   <code>
 {const urFaceData = [
  {
    name: "Наименование юрлица/физлица в лк",
    objectName: "Название объекта",
    contractNum: "Номер договора",
    ranges: ["Клетка в гугл таблице с конечным показанием"],
    indicationGSS: 0,
    num: "логин  от лк",
    pass: "пароль от лк",
    indf: "1-4",//диапозон даты передачи показания
}//можно добавлять через запятую несколько лк
]
</code>
 </p>
2.получаем из https://console.cloud.google.com/ файл credentials.json в таком формате
<p>
    <code>
{
  "type": "service_account",
  "project_id": "ваш project_id",
  "private_key_id": "Ваш Ключ",
  "private_key": "Ваш Ключ"
  "client_email": "Ваш emai",
  "client_id": "Ваш id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "",
  "universe_domain": "googleapis.com"
}
   </code>
 </p>
добавляем его в корень проэкта.

3. в index.js 66строка меняем в const spreadsheetId = "ваш id книги из google spredsheet"
4. npm install,
   npm start
   npm run dev



const express = require('express')
const app = express()

app.set('view engine', 'ejs')
app.set('views', './src/templates')

// Это необходимо для разбора данных формы
app.use(express.urlencoded({ extended: true }));

// можно подкл. стили из public или скрипты
app.use(express.static('public'))  

app.get('/', (req,res)=>{
    res.render('index')
})


let port = 3000
app.listen(port, ()=>{
    console.log(`server working: http://localhost:${port}`)
})
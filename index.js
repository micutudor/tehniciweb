const express = require('express');
const app = express();

const fs = require('fs');
const path = require("path");

const sass = require("sass");

console.log("index.js este la: " + __dirname);
console.log("calea fisierului: " + __filename);
console.log("director: " + process.cwd());

const folders = ["temp", "temp1", "res/backup"];

const globalPaths = {
    folderScss: path.join(__dirname, "res", "scss"),
    folderCss: path.join(__dirname, "res", "css"),
    folderBackup: path.join(__dirname, "res/backup"),
}

for (let folder of folders) {
    let folderPath = path.join(__dirname, folder);

    if (!fs.existsSync(folderPath))
        fs.mkdirSync(folderPath);

    // if (folder == "temp1")
    //     fs.rmdirSync(folderPath);
}

let files = fs.readdirSync(globalPaths.folderScss);

for (let file of files) {
    if (path.extname(file) == ".scss")
        compileazaCss(file);
}

fs.watch(globalPaths.folderScss, function (event, file) {
    if (event == "change" || event == "rename") {
        let filePath = path.join(globalPaths.folderScss, file);
        if (fs.existsSync(filePath))
            compileazaCss(filePath);
    }
})

function compileazaCss(caleScss, caleCss) {
    if (!caleCss) {
        let fileExtension = path.basename(caleScss);
        let file = fileExtension.split(".")[0]; // a.scss->[("a"), ("scss")]
        caleCss = file + ".css";
    }

    if (!path.isAbsolute(caleScss))
        caleScss = path.join(globalPaths.folderScss, caleScss);

    if (!path.isAbsolute(caleCss))
        caleCss = path.join(globalPaths.folderCss, caleCss);

    let backupPath = path.join(globalPaths.folderBackup, "/res/css");

    if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
    }

    let fileCss = path.basename(caleScss);

    if (fs.existsSync(caleCss)) {
        fs.copyFileSync(caleCss, path.join(globalPaths.folderBackup, fileCss));
    }

    rez = sass.compile(caleScss, { "sourceMap": true });
    fs.writeFileSync(caleCss, rez.css);
}

const errorsList = readErrors();
const galleryImages = readGallery();

app.set('view engine', 'ejs');

app.use("/res", express.static(__dirname + "/res"));

app.use(/^\/Resurse(\/[a-zA-Z0-9]*(?!\.)[a-zA-Z0-9]*)*$/, function (req, res) {
    showError(res, 403);
})

app.get("/favicon.ico", function (req, res) {
    res.sendFile(__dirname + "/res/ico/favicon-32x32.png");
});

app.get("/*.ejs", function (req, res) {
    showError(res, 400);
});

app.get(['/', '/index', '/home'], (req, res) => {
    return res.render("pagini/index", { ip: req.socket.remoteAddress, gallery: galleryImages });
});

app.get('/*', (req, res) => {
    return res.render("pagini/" + req.url, function (err, result) {
        if (err) {
            if (err.message.startsWith("Failed to lookup view"))
                showError(res, 404);
            else
                showError(res);
        }
        else
            return res.send(result);
    });
});

function readErrors()
{
    const data = fs.readFileSync(process.cwd() + '/res/json/erori.json', 'utf8');
    
    return JSON.parse(data);
}

function showError(res, cod, titlu, text, img)
{
    let err;

    if (cod === undefined)
        err = errorsList.eroare_default;
    else
        err = errorsList.info_erori.filter(error => error.identificator == cod);
    
    titlu = (titlu === undefined ? err[0].titlu : titlu);
    text = (text === undefined ? err[0].text : text);
    img = (img === undefined ? errorsList.cale_baza + '/' + err[0].imagine : img);

    res.render("pagini/eroare", {cod, titlu, text, img});
}

function readGallery()
{
    const fileInput = fs.readFileSync(process.cwd() + '/res/json/galerie.json', 'utf8');

    let month = new Date().getMonth() + 1;
    let anotimp;

    if (month < 3 || month == 12)
        anotimp = "iarna";
    else if (month >= 3 && month <= 5)
        anotimp = "primavara";
    else if (month >= 6 && month <= 8)
        anotimp = "vara";
    else
        anotimp = "toamna";

    const data = JSON.parse(fileInput).imagini.filter((img) => img.anotimp == anotimp);

    return data;
}

app.listen(8080);
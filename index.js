/* TODO:
 * Bonus9, Bonus11
 * 
 */

const express = require('express');
const app = express();

const fs = require('fs');
const path = require("path");

const sass = require("sass");

const {Client} = require("pg");

const config = ({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password : "1234",
    database : "tehniciweb"

});

const client = new Client(config);

let categorii = [];

client.connect();

client.query('SELECT categorie FROM produs GROUP BY categorie', (err, res) => {
    if (err)
        console.log(err);
    else
        categorii = res.rows;
});

console.log("index.js este la: " + __dirname);
console.log("calea fisierului: " + __filename);
console.log("director: " + process.cwd());

const folders = ["temp", "temp1", "res/backup"];

const globalPaths = {
    folderScss: path.join(__dirname, "res", "scss"),
    folderCss: path.join(__dirname, "res", "css"),
    folderBackup: path.join(__dirname, "res/backup"),
}

Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

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
    return res.render("pagini/index", { ip: req.socket.remoteAddress, gallery: galleryImages, categories: categorii });
});

app.get('/produs/:id', (req, res) => {
    client.query('SELECT * FROM produs WHERE id = $1', [req.params.id], (err, rez) => {
        if (err)
            console.log(err);
        else
            return res.render('pagini/produs', { produs: rez.rows[0], categories: categorii });
    });
});

app.get('/produse/:cat', (req, res) => {
    let categorie = req.params.cat;
    
    let artisti = [];

    client.query('SELECT artisti FROM produs GROUP BY artisti', (err, rez) => {
        if (err)
            console.log(err);
        else
        {
            for (let i = 0; i < rez.rows.length; i ++)
                artisti = artisti.concat(rez.rows[i].artisti).unique(); 
        }   
    });

    let localitati;
    client.query('SELECT localitate FROM produs GROUP BY localitate', (err, rez) => {
        if (err)
            console.log(err);
        else
        {
            localitati = rez.rows;
        }   
    });

    let tip_muzica;
    client.query('SELECT subcategorie FROM produs GROUP BY subcategorie', (err, rez) => {
        if (err)
            console.log(err);
        else
        {
            tip_muzica = rez.rows;
        }   
    });

    let minlocuri, maxlocuri;
    client.query('SELECT min(locuri_disponibile) as minloc, max(locuri_disponibile) as maxloc FROM produs', (err, rez) => {
        if (err)
            console.log(err);
        else
        {
            minlocuri = rez.rows[0].minloc;
            maxlocuri = rez.rows[0].maxloc;
        }   
    });

    let query;
    if (categorie == 'toate')
        query = 'SELECT * FROM produs';
    else 
        query = "SELECT * FROM produs WHERE categorie = '" + categorie + "'";

    client.query(query, (err, rez) => {
        if (err)
            console.log(err);
        else {
            return res.render('pagini/produse', { produse: rez.rows, categories: categorii, artisti, localitati, tip_muzica, minlocuri, maxlocuri });
        }        
    });
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
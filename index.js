/* todo: sistem_utilizatori
* 3 - filtre din FE si alea 2 la alegere
* 4 - continut mail, schimbat mail
* 5, 6,7,8,9,11,12,13
* +
* bugfixes
*/

const express = require('express');
const app = express();

const fs = require('fs');
const path = require("path");

const sass = require("sass");

const formidable = require("formidable");
const {Utilizator}=require("./module_proprii/utilizator.js")
const AccesBD=require("./module_proprii/accesbd.js")
const session=require('express-session');
const Drepturi = require("./module_proprii/drepturi.js");

const {Client} = require("pg");

const config = ({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password : "1234",
    database : "tehniciweb"

});

app.use(session({ // aici se creeaza proprietatea session a requestului (pot folosi req.session)
    secret: 'abcdefg',//folosit de express session pentru criptarea id-ului de sesiune
    resave: true,
    saveUninitialized: false
}));

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
app.use("/poze_uploadate", express.static(__dirname + "/poze_uploadate"));

app.use(/^\/res(\/[a-zA-Z0-9]*(?!\.)[a-zA-Z0-9]*)*$/, function (req, res) {
    showError(res, req.sesiune, 403);
});

app.use(/^\/poze_uploadate(\/[a-zA-Z0-9]*(?!\.)[a-zA-Z0-9]*)*$/, function (req, res) {
    showError(res, req.sesiune, 403);
})

app.get("/favicon.ico", function (req, res) {
    res.sendFile(__dirname + "/res/ico/favicon-32x32.png");
});

app.get("/*.ejs", function (req, res) {
    showError(res, req.sesiune, 400);
});

app.get(['/', '/index', '/home'], (req, res) => {
    return res.render("pagini/index", { ip: req.socket.remoteAddress, gallery: galleryImages, categories: categorii, sesiune: req.session });
});

app.post("/inregistrare",function(req, res){
    var username;
    var poza;
    var formular= new formidable.IncomingForm();
    formular.parse(req, function(err, campuriText, campuriFisier ){//4
        console.log("Inregistrare:",campuriText);

        console.log('-----------------------');
        console.log(campuriFisier);
        console.log(poza, username);
        console.log('-----------------------');
        var eroare="";

        if (campuriText.nume == undefined || campuriText.username == undefined || campuriText.email == undefined || campuriText.parola == undefined
            || campuriText.rparola == undefined)
            return res.render("pagini/inregistrare", {err: "Toate campurile sunt obligatorii!", categories: categorii, sesiune: req.sesiune});
        
        var regex = /^\+407\d{8}$/;

        if (!regex.test(campuriText.telefon))
            return res.render("pagini/inregistrare", {err: "Telefon invalid!", categories: categorii, sesiune: req.sesiune});

        var utilizNou=new Utilizator();
        try{
            utilizNou.setareNume=campuriText.nume;
            utilizNou.setareUsername=campuriText.username;
            utilizNou.email=campuriText.email
            utilizNou.prenume=campuriText.prenume
            
            utilizNou.parola=campuriText.parola;
            utilizNou.telefon=campuriText.telefon;
            utilizNou.data_nasterii=campuriText.data_nasterii;
            utilizNou.culoare_chat=campuriText.culoare_chat;
            utilizNou.poza= poza;

            Utilizator.getUtilizDupaUsername(campuriText.username, {}, function(u, parametru ,eroareUser ){
                if (eroareUser==-1){//nu exista username-ul in BD
                    utilizNou.salvareUtilizator();
                }
                else{
                    eroare+="Mai exista username-ul";
                }

                if(!eroare){
                    res.render("pagini/inregistrare", {raspuns:"Inregistrare cu succes!", categories: categorii, sesiune: req.sesiune})
                    
                }
                else
                    res.render("pagini/inregistrare", {err: "Eroare: "+eroare, categories: categorii, sesiune: req.sesiune});
            })
            

        }
        catch(e){ 
            console.log(e);
            eroare+= "Eroare site; reveniti mai tarziu";
            console.log(eroare);
            res.render("pagini/inregistrare", {err: "Eroare: "+eroare, categories: categorii, sesiune: req.sesiune})
        }
    



    });
    formular.on("field", function(nume,val){  // 1 
        console.log(`--- ${nume}=${val}`);
		
        if(nume=="username")
            username=val;
    }) 
    formular.on("fileBegin", function(nume,fisier){ //2
        console.log("fileBegin");
		
        console.log(nume,fisier);
		//TO DO in folderul poze_uploadate facem folder cu numele utilizatorului
        let folderUser=path.join(__dirname, "poze_uploadate",username);
        //folderUser=__dirname+"/poze_uploadate/"+username
        console.log(folderUser);
        if (!fs.existsSync(folderUser))
            fs.mkdirSync(folderUser);
        
        fisier.filepath=path.join(folderUser, fisier.originalFilename)
        poza=fisier.originalFilename;
        //fisier.filepath=folderUser+"/"+fisier.originalFilename
        console.log("fileBegin:",poza)
        console.log("fileBegin, fisier:",fisier)

    })    
    formular.on("file", function(nume,fisier){//3
        console.log("file");
        console.log(nume,fisier);
    }); 
});

app.post("/login",function(req, res){
    console.log("ceva");
    var formular= new formidable.IncomingForm();
    formular.parse(req, function(err, campuriText, campuriFisier ){
        Utilizator.getUtilizDupaUsername (campuriText.username,{
            req:req,
            res:res,
            parola:campuriText.parola
        }, function(u, obparam ){
            let parolaCriptata=Utilizator.criptareParola(obparam.parola);
            if(u.parola==parolaCriptata && u.confirmat_mail ){
                u.poza=u.poza?path.join("poze_uploadate",u.username, u.poza):"";
                obparam.req.session.utilizator=u;
                
                obparam.req.session.mesajLogin="Bravo! Te-ai logat!";
                obparam.req.session.mesajLoginTip = "ok";
                obparam.res.redirect("/index");
                //obparam.res.render("/login");
            }
            else{
                console.log("Eroare logare")
                obparam.req.session.mesajLogin="Date logare incorecte sau nu a fost confirmat mailul!";
                obparam.req.session.mesajLoginTip = "eroare";
                obparam.res.redirect("/index");
            }
        })
    });
});

app.get("/cod_mail/:token/:username",function(req,res){
    console.log(req.params);
    try {
        Utilizator.getUtilizDupaUsername(req.params.username,{res:res,token:req.params.token} ,function(u,obparam){
            AccesBD.getInstanta().update(
                {tabel:"utilizator",
                campuri:{confirmat_mail:'true'}, 
                conditiiAnd:[`cod='${obparam.token}'`]}, 
                function (err, rezUpdate){
                    if(err || rezUpdate.rowCount==0){
                        console.log("Cod:", err);
                        showError(res, req.session, 3);
                    }
                    else{
                        res.render("pagini/confirmare.ejs", {categories: categorii, sesiune: req.sesiune});
                    }
                })
        })
    }
    catch (e){
        console.log(e);
        showError(res, req.session, 2);
    }
});

app.get("/logout", function(req, res){
    req.session.destroy();
    res.locals.utilizator=null;
    res.render("pagini/logout", {categories: categorii, sesiune: req.session});
});

app.get("/profil", function(req,res){
    console.log("hey");
    return res.render("pagini/profil", {categories: categorii, sesiune: req.session});
});

app.post("/profil", function(req, res){
    if (!req.session.utilizator){
        showError(res, req.session, 403);
        res.render("pagini/eroare",{titlu: "404", text:"Nu sunteti logat."});
        return;
    }

    var poza;
    var username;
    var formular= new formidable.IncomingForm();
 
    formular.parse(req,function(err, campuriText, campuriFile){
        var parolaCriptata=Utilizator.criptareParola(campuriText.parola);
        AccesBD.getInstanta().updateParametrizat(
            {tabel:"utilizator",
            campuri:["nume","prenume","email", "data_nasterii", "poza", "culoare_chat"],
            valori:[`${campuriText.nume}`,`${campuriText.prenume}`,`${campuriText.email}`,`${campuriText.data_nasterii}`,`${poza}`,`${campuriText.culoare_chat}`],
            conditiiAnd:[`parola='${parolaCriptata}'`, `username='${campuriText.username}'`]
        },          
        function(err, rez){
            if(err){
                console.log(err);
                afisareEroare(res,2);
                return;
            }
            console.log(rez.rowCount);
            if (rez.rowCount==0){
                res.render("pagini/profil",{categories: categorii, sesiune: req.session, mesaj:"Update-ul nu s-a realizat. Verificati parola introdusa."});
                return;
            }
            else{            
                req.session.utilizator.data_nasterii = campuriText.data_nasterii;
                req.session.utilizator.nume= campuriText.nume;
                req.session.utilizator.prenume= campuriText.prenume;
                req.session.utilizator.email= campuriText.email;
                req.session.utilizator.culoare_chat= campuriText.culoare_chat;
                req.session.utilizator.poza = path.join("poze_uploadate", campuriText.username, poza);
                res.locals.utilizator=req.session.utilizator;
            }
 
 
            res.render("pagini/profil",{categories: categorii, sesiune: req.session, mesaj:"Update-ul s-a realizat cu succes."});
 
        });
    });
    formular.on("field", function(nume,val){  // 1 
        console.log(`--- ${nume}=${val}`);
		
        if(nume=="username")
            username=val;
    }) 
    formular.on("fileBegin", function(nume, fisier){ //2
        let folderUser=path.join(__dirname, "poze_uploadate", username);

        if (!fs.existsSync(folderUser))
            fs.mkdirSync(folderUser);
        
        fisier.filepath = path.join(folderUser, fisier.originalFilename);
        poza = fisier.originalFilename;

        console.log("fileBegin:",poza)
        console.log("fileBegin, fisier:",fisier)
    })  
    formular.on("file", function(nume,fisier){//3
        console.log("file");
        console.log(nume,fisier);
    });   
});

app.get('/produs/:id', (req, res) => {
    client.query('SELECT * FROM produs WHERE id = $1', [req.params.id], (err, rez) => {
        if (err)
            console.log(err);
        else
            return res.render('pagini/produs', { produs: rez.rows[0], categories: categorii, sesiune: req.session });
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
            return res.render('pagini/produse', { produse: rez.rows, categories: categorii, artisti, localitati, tip_muzica, minlocuri, maxlocuri, sesiune: req.session });
        }        
    });
});

app.get('/inregistrare', (req, res) => {
    return res.render("pagini/inregistrare", {categories: categorii, sesiune: req.session});
});

app.get('/relatii-clienti', (req, res) => {
    return res.render("pagini/relatii-clienti", {categories: categorii, sesiune: req.session});
});

app.get('/*', (req, res) => {
    return res.render("pagini/" + req.url, { categories: categorii, sesiune: req.session }, function (err, result) {
        if (err) {
            if (err.message.startsWith("Failed to lookup view"))
                showError(res, sesiune, 404);
            else
                showError(res, sesiune);
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

function showError(res, sesiune, cod, titlu, text, img)
{
    let err;

    if (cod === undefined)
        err = errorsList.eroare_default;
    else
        err = errorsList.info_erori.filter(error => error.identificator == cod);
    
    titlu = (titlu === undefined ? err[0].titlu : titlu);
    text = (text === undefined ? err[0].text : text);
    img = (img === undefined ? errorsList.cale_baza + '/' + err[0].imagine : img);

    res.render("pagini/eroare", {cod, titlu, text, img, categories: categorii, sesiune});
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
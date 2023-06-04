function excludeAtFilter(id) {
    let produs = document.getElementById('elem_' + id);

    let btns = produs.getElementsByClassName('btn btn-warning');

    if (btns.length == 0)
    {
        let btn = produs.getElementsByClassName('btn btn-danger')[0];
        btn.getElementsByTagName('i')[0].className = 'fa-solid fa-unlock';
        btn.classList.add('btn-warning');
        btn.classList.remove('btn-danger');

        produs.setAttribute('avoidFilter', 'no');
    }
    else
    {
        console.log(btns[0].getElementsByTagName('i'));
        btns[0].getElementsByTagName('i')[0].className = 'fa-solid fa-lock';
        btns[0].classList.add('btn-danger');
        btns[0].classList.remove('btn-warning');

        produs.setAttribute('avoidFilter', 'yes');
    }
}

function hide(id) {
    document.getElementById('elem_' + id).style.display = 'none';
}

window.onload = function() {
    document.getElementById('reset').onclick = function () {
        if (confirm("Sigur stergi filtre?")) {
            document.getElementById('denumireProdus').value = null;
            document.getElementById('numarLocuri').value = document.getElementById('numarLocuri').min;
            document.getElementById('mainArtist').value = null;
            document.getElementById('localitate').value = '---';
            document.getElementById('tip_muzica').value = '---';
            document.getElementById('disponibilDa').checked = false;
            document.getElementById('disponibilNu').checked = false;
            document.getElementById('disponibilToate').checked = true;

            let produse = document.getElementsByClassName('produs');

            for (let produs of produse)
                produs.style.display = 'block';

            document.getElementById('noProductsMsg').style.display = 'none';
        }
    }

    document.getElementById('filter').onclick = function () {
        let denumireProdus = document.getElementById('denumireProdus').value.toLowerCase();

        let locuri = document.getElementById('numarLocuri').value;
        let artist = document.getElementById('mainArtist').value;
        let radioBtns = document.getElementsByClassName('form-check-input');

        let disponibil = 'none';
        for (let rBtn of radioBtns)
        {
            if (rBtn.checked)
                disponibil = rBtn.value;
        }

        if (disponibil == 'none')
        {
            alert('Trebuie sa selectati o optiune pentru disponibilitate!');
            return;
        }

        let localitate = document.getElementById('localitate').value;

        let localitati = document.getElementById('localitate').getElementsByTagName('option');

        let g = false;
        for (let loc of localitati)
        {
            if (loc.value == localitate)
            {
                g = true;
                break;
            }
        }

        if (!g)
        {
            alert('Localitate invalida!');
            return;
        }

        let muzica = document.getElementById('tip_muzica').value;
        let genuri = document.getElementById('tip_muzica').getElementsByTagName('option');

        g = false;
        for (let gen of genuri)
        {
            if (gen.value == muzica)
            {
                g = true;
                break;
            }
        }

        if (!g)
        {
            alert('Gen muzical invalid!');
            return;
        }

        if (!(locuri >= document.getElementById('numarLocuri').min && locuri <= document.getElementById('numarLocuri').max))
        {
            alert('Numar de locuri invalid!');
            return;
        }

        let produse = document.getElementsByClassName('produs');

        let c = 0;
        for (let produs of produse)
        {
            if (produs.getAttribute('avoidFilter') == 'yes')
                continue;

            produs.style.display = 'none';
            
            let c1;
            if (denumireProdus != null)
            {
                let denumire = produs.getElementsByClassName('numeProdus')[0].innerHTML;

                let replacements = {'ă': 'a', 'â': 'a', 'î': 'i', 'ț': 't', 'ș': 's'};

                for (let rpl in replacements)
                    denumire = denumire.replace(new RegExp(rpl, 'g'), replacements[rpl]);

                c1 = (denumire.toUpperCase().includes(denumireProdus.toUpperCase()));
            }
            else
                c1 = true;

            let c2;
            if (artist.length > 0)
            {
                let mainArtist = produs.getElementsByClassName('list-group-item')[6].getElementsByClassName('badge bg-secondary')[0].innerHTML.toUpperCase();

                c2 = (mainArtist.toUpperCase() == artist.toUpperCase());
            }
            else
                c2 = true;

            let c3;
            if (produs.getElementsByClassName('list-group-item')[5].innerHTML.includes('true') && disponibil == 'da')
                c3 = true;
            else if (produs.getElementsByClassName('list-group-item')[5].innerHTML.includes('false') && disponibil == 'nu')
                c3 = true;
            else if (disponibil == 'toate')
                c3 = true;
            else
                c3 = false;

            let c4;
            if (localitate != '---')
                c4 = produs.getElementsByClassName('list-group-item')[3].innerHTML.includes(localitate);
            else
                c4 = true;

            let c5;
            if (muzica != '---')
                c5 = (produs.getElementsByClassName('list-group-item')[1].getElementsByClassName('badge bg-secondary')[1].innerHTML == muzica);
            else
                c5 = true;
            
            let c6;
            let nrlocuri = parseInt(produs.getElementsByClassName('list-group-item')[4].getElementsByClassName('locuridisp')[0].innerHTML);

            if (nrlocuri >= locuri)
                c6 = true;
            else
                c6 = false;

            // console.log(c1 + ' ' + c2 + ' ' + c3 + ' ' + c4 + ' ' + c5 + ' ' + c6);

            if (c1 && c2 && c3 && c4 && c5 && c6) {
                produs.style.display = 'block';
                c ++;
            } 
        }

        if (c == 0)
            document.getElementById('noProductsMsg').style.display = 'block';
        else
            document.getElementById('noProductsMsg').style.display = 'none';
    }

    document.getElementById('numarLocuri').onchange = function () {
        document.getElementById('curValRange').innerText = document.getElementById('numarLocuri').value;
    }
}

window.addEventListener("DOMContentLoaded", function () {
    function sortare(sign) {
        let produseDOM = document.getElementsByClassName("produs");
        let produse = Array.from(produseDOM);

        produse.sort(function (first, second) {
            let pretFirst = parseInt(first.getElementsByClassName('list-group-item')[0].getElementsByClassName('pret')[0].innerHTML);
            let pretSecond = parseInt(second.getElementsByClassName('list-group-item')[0].getElementsByClassName('pret')[0].innerHTML);

            if (pretFirst == pretSecond) {
                let denumireFirst = first.getElementsByClassName('list-group-item')[1].getElementsByClassName('badge bg-secondary')[1].innerHTML;
                let denumireSecond = second.getElementsByClassName('list-group-item')[1].getElementsByClassName('badge bg-secondary')[1].innerHTML;
                return sign * denumireFirst.localeCompare(denumireSecond);
            }

            return sign * (pretFirst - pretSecond);
        });

        for (let produs of produse) {
            produs.parentElement.appendChild(produs);
        }
    }

    document.getElementById("asc").onclick = function () {
        sortare(1);
    }
    document.getElementById("desc").onclick = function () {
        sortare(-1);
    }
})

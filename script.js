/// JavaScript source code

document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // 1. EVIDENZIA LA MESSA DEL GIORNO
    // =====================================

    const oggi = new Date().getDay();

    const cards = document.querySelectorAll(".messa-card");

    cards.forEach(function (card) {

        const giornoCard = Number(card.dataset.giorno);

        if (giornoCard === oggi) {
            card.classList.add("oggi");
        }

    });


    // =====================================
    // 2. CARICA FOGLIETTO DA JSON
    // =====================================

    const contenitorePDF = document.getElementById("pdf-container");
    const testoGiorno = document.getElementById("giorno-attuale");

    // Se il visualizzatore PDF non è presente, termina questa parte
    if (!contenitorePDF || !testoGiorno) {
        return;
    }

    const giorni = [
        "Domenica",
        "Lunedì",
        "Martedì",
        "Mercoledì",
        "Giovedì",
        "Venerdì",
        "Sabato"
    ];

    const nomeGiorno = giorni[oggi];

    testoGiorno.textContent = "Oggi è " + nomeGiorno;


    // Carica il JSON del foglietto
    fetch("documenti/foglietto_parrocchiale.json")
        .then(function (response) {
            return response.json();
        })
        .then(function (dati) {

            console.log("JSON caricato:", dati);

            // Trova il giorno corrente nel JSON
            let giornoFound = null;

            dati.giorni.forEach(function (giorno) {
                const parole = giorno.data.split(" ");
                const nomeDel = parole[0];

                if (nomeDel === nomeGiorno) {
                    giornoFound = giorno;
                    console.log("Giorno trovato:", giorno);
                }
            });

            if (!giornoFound) {
                contenitorePDF.innerHTML = "<div class='pdf-giorno-info errore'><p>Giorno non trovato nel foglietto.</p></div>";
                return;
            }

            let htmlContenuto = "<div class='pdf-giorno-info'>";
            htmlContenuto += "<h4>" + giornoFound.data.toUpperCase() + "</h4>";
            htmlContenuto += "<p class='ricorrenza'>" + giornoFound.ricorrenza + "</p>";
            htmlContenuto += "<div class='pdf-giorno-contenuto'>";

            if (giornoFound.celebrazioni && giornoFound.celebrazioni.length > 0) {
                giornoFound.celebrazioni.forEach(function (celebrazione) {
                    htmlContenuto += "<div class='celebrazione'>";
                    htmlContenuto += "<strong>" + celebrazione.ora + "</strong> - " + celebrazione.descrizione;

                    if (celebrazione.luogo) {
                        htmlContenuto += " (" + celebrazione.luogo + ")";
                    }

                    if (celebrazione.intenzioni) {
                        htmlContenuto += "<br><em>Intenzioni: " + celebrazione.intenzioni + "</em>";
                    }

                    htmlContenuto += "</div>";
                });
            }

            htmlContenuto += "</div>";
            htmlContenuto += "<p class='contatti-footer'>Telefono: " + dati.telefono + "</p>";
            htmlContenuto += "</div>";

            contenitorePDF.innerHTML = htmlContenuto;

        })
        .catch(function (errore) {
            console.error("Errore:", errore);
            contenitorePDF.innerHTML = "<div class='pdf-giorno-info errore'><p>Impossibile caricare il foglietto.</p></div>";
        });

});
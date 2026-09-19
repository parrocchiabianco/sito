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
    // 2. MOSTRA SOLO IL RIQUADRO DEL GIORNO
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


    // Percorso del PDF
    const url = "documenti/foglietto-settimanale.pdf?v=2";


    // Configurazione PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


    // Carica il PDF
    pdfjsLib.getDocument(url).promise.then(function (pdf) {

        // Leggiamo solo la prima pagina (foglietto settimanale)
        pdf.getPage(1).then(function (pagina) {

            const scala = 1.5;

            const viewport = pagina.getViewport({
                scale: scala
            });

            // Render della pagina intera
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const contesto = canvas.getContext("2d");

            pagina.render({
                canvasContext: contesto,
                viewport: viewport
            }).promise.then(function () {

                // Usa OCR per leggere il testo dal PDF
                console.log("Inizio OCR per il giorno:", nomeGiorno);

                Tesseract.recognize(
                    canvas,
                    "ita"
                ).then(function (result) {

                    const testoOCR = result.data.text;
                    console.log("Testo OCR completo:\n", testoOCR);

                    // Separa il testo per righe
                    const righe = testoOCR.split("\n").map(r => r.trim()).filter(r => r.length > 0);

                    console.log("Tutte le righe estratte:");
                    righe.forEach(function(r, idx) {
                        console.log(idx + ": " + r);
                    });

                    // Trova l'ultimo indice della riga con il giorno (per evitare intestazioni)
                    let indiceGiorno = -1;
                    righe.forEach(function (riga, idx) {
                        if (riga.toUpperCase().includes(nomeGiorno.toUpperCase())) {
                            indiceGiorno = idx;
                            console.log("Trovato giorno all'indice:", idx, "Riga:", riga);
                        }
                    });

                    // Se non trovato
                    if (indiceGiorno === -1) {
                        contenitorePDF.innerHTML =
                            "<div class='pdf-giorno-info errore'>" +
                            "<p>Giorno '" + nomeGiorno + "' non trovato nel foglietto.</p>" +
                            "</div>";
                        return;
                    }

                    console.log("✓✓✓ Indice finale del giorno:", indiceGiorno);

                    // Estrai le righe del giorno (dal giorno corrente fino al prossimo giorno)
                    let contenutoGiorno = [];

                    // Inizia dalla riga del giorno
                    for (let i = indiceGiorno; i < righe.length; i++) {
                        const riga = righe[i];

                        // Se trovo un altro giorno della settimana, stop
                        let trovatoAltroGiorno = false;
                        giorni.forEach(function (g) {
                            if (i !== indiceGiorno && riga.toUpperCase().includes(g.toUpperCase())) {
                                trovatoAltroGiorno = true;
                            }
                        });

                        if (trovatoAltroGiorno) {
                            console.log("Trovato altro giorno all'indice " + i + ", stop");
                            break;
                        }

                        contenutoGiorno.push(riga);
                    }

                    console.log("Contenuto grezzo del giorno:", contenutoGiorno);

                    // Funzione per pulire il testo
                    function pulisciTesto(testo) {
                        // Mantiene solo lettere, numeri, spazi, e punti
                        return testo.replace(/[^\w\s\.àèéìòùÀÈÉÌÒÙáéíóúÁÉÍÓÚ]/g, '').trim();
                    }

                    // Crea il box HTML con le informazioni del giorno
                    let htmlContenuto = "<div class='pdf-giorno-info'>";
                    htmlContenuto += "<h4>" + nomeGiorno.toUpperCase() + "</h4>";
                    htmlContenuto += "<div class='pdf-giorno-contenuto'>";

                    // Mostra le righe del giorno
                    contenutoGiorno.forEach(function (riga, idx) {
                        if (idx === 0) {
                            // Prima riga è il titolo del giorno, skip
                            return;
                        }

                        const testoPulito = pulisciTesto(riga);
                        if (testoPulito.length > 0) {
                            htmlContenuto += "<p>" + testoPulito + "</p>";
                        }
                    });

                    htmlContenuto += "</div></div>";

                    // Mostra il contenuto
                    contenitorePDF.innerHTML = htmlContenuto;

                    console.log("Contenuto finale visualizzato:", contenutoGiorno);

                }).catch(function (ocrError) {
                    console.error("Errore OCR:", ocrError);
                    contenitorePDF.innerHTML =
                        "<div class='pdf-giorno-info errore'>" +
                        "<p>Errore nel riconoscimento del testo dal PDF.</p>" +
                        "</div>";
                });

            });

        });

    }).catch(function (errore) {

        console.error(
            "Errore nel caricamento del PDF:",
            errore
        );

        contenitorePDF.innerHTML =
            "<p>Impossibile caricare il foglietto settimanale.</p>";

    });

});
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

                // Usa OCR per leggere il testo e le coordinate
                console.log("Inizio OCR per il giorno:", nomeGiorno);

                Tesseract.recognize(
                    canvas,
                    "ita"
                ).then(function (result) {

                    const testoOCR = result.data.text;
                    const words = result.data.words;

                    console.log("Testo OCR trovato:", testoOCR);
                    console.log("Numero di parole:", words.length);

                    // Cerca la parola che contiene il nome del giorno
                    let giornoBox = null;

                    words.forEach(function (word) {
                        const testoWord = word.text.trim().toUpperCase();
                        const giornoUpper = nomeGiorno.toUpperCase();

                        // Stampa per debug
                        console.log("Parola:", testoWord, "Cerco:", giornoUpper);

                        if (testoWord.includes(giornoUpper) || giornoUpper.includes(testoWord)) {
                            console.log("✓ Trovato giorno:", testoWord, "Bounding box:", word.bbox);
                            giornoBox = word.bbox;
                        }
                    });

                    // Se non trovato il giorno, errore
                    if (!giornoBox) {
                        contenitorePDF.innerHTML =
                            "<p>Giorno '" + nomeGiorno + "' non trovato nel foglietto.</p>";
                        return;
                    }

                    // Usa il bounding box per calcolare il crop
                    // Proviamo a estendere il box verso il basso per catturare il contenuto del giorno
                    const margine = 30;

                    // Il giorno è nella parte superiore del suo riquadro
                    // Estendiamo verso il basso per catturare il contenuto
                    let recX = Math.max(0, giornoBox.x0 - margine);
                    let recY = Math.max(0, giornoBox.y0 - margine);
                    let recWidth = (giornoBox.x1 - giornoBox.x0) + (margine * 2);

                    // Stima dell'altezza: dalla parola del giorno fino al giorno successivo
                    // Approssimiamo con l'altezza della pagina / 7 * 1.5
                    let recHeight = ((viewport.height / 7) * 1.2);

                    // Assicuriamoci che il crop non superi i limiti della pagina
                    if (recY + recHeight > viewport.height) {
                        recHeight = viewport.height - recY - 10;
                    }

                    console.log("Crop calcolato:", { x: recX, y: recY, w: recWidth, h: recHeight });

                    // Crea un nuovo canvas per il crop
                    const cropCanvas = document.createElement("canvas");
                    cropCanvas.width = recWidth;
                    cropCanvas.height = recHeight;

                    const cropContesto = cropCanvas.getContext("2d");

                    // Copia la porzione dal canvas originale
                    cropContesto.drawImage(
                        canvas,
                        recX,
                        recY,
                        recWidth,
                        recHeight,
                        0,
                        0,
                        recWidth,
                        recHeight
                    );

                    // Mostra il crop nel contenitore
                    const wrapper = document.createElement("div");
                    wrapper.className = "pdf-giorno-crop";
                    wrapper.appendChild(cropCanvas);

                    contenitorePDF.appendChild(wrapper);

                }).catch(function (ocrError) {
                    console.error("Errore OCR:", ocrError);
                    contenitorePDF.innerHTML =
                        "<p>Errore nel riconoscimento del testo dal PDF.</p>";
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
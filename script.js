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

                // Usa OCR per leggere il testo dall'immagine
                console.log("Inizio OCR...");

                Tesseract.recognize(
                    canvas,
                    "ita"
                ).then(function (result) {

                    const testoOCR = result.data.text;
                    console.log("Testo OCR trovato:", testoOCR);

                    // Cerca il giorno nel testo OCR
                    if (!testoOCR.toUpperCase().includes(nomeGiorno.toUpperCase())) {
                        contenitorePDF.innerHTML =
                            "<p>Giorno non trovato nel foglietto. Testo OCR: " + 
                            testoOCR.substring(0, 100) + "...</p>";
                        return;
                    }

                    // Se il PDF ha testo vettoriale, usa quello
                    pagina.getTextContent().then(function (contenuto) {

                        let minX = null, minY = null, maxX = null, maxY = null;
                        let trovatoGiorno = false;

                        // Prima passa: trovare il giorno e calcolare il bounding box
                        contenuto.items.forEach(function (elemento) {

                            const testo = elemento.str.trim().toUpperCase();
                            const giornoUpper = nomeGiorno.toUpperCase();

                            // Cerca il nome del giorno attuale
                            if (
                                testo === giornoUpper || 
                                testo.includes(giornoUpper)
                            ) {

                                trovatoGiorno = true;

                                const trasformazione =
                                    pdfjsLib.Util.transform(
                                        viewport.transform,
                                        elemento.transform
                                    );

                                const x = trasformazione[4];
                                const y = trasformazione[5];
                                const larghezza =
                                    Math.abs(trasformazione[0]);
                                const altezza =
                                    Math.abs(trasformazione[3]);

                                if (minX === null || x < minX) minX = x;
                                if (minY === null || (y - altezza) < minY)
                                    minY = y - altezza;
                                if (maxX === null || (x + larghezza) > maxX)
                                    maxX = x + larghezza;
                                if (maxY === null || y > maxY)
                                    maxY = y;
                            }

                        });

                        // Se non trovato con testo vettoriale, usa OCR per calcolare approssimazione
                        if (!trovatoGiorno) {
                            console.log("Usando approssimazione basata su layout del foglietto");
                            // Foglietto settimanale: 7 giorni disposti linearmente o in griglia
                            // Possiamo approssimare dividendo la pagina in 7 sezioni
                            // Il giorno "oggi" corrisponde alla sezione corrispondente

                            const sectionHeight = viewport.height / 7;
                            minX = 20;
                            minY = (oggi * sectionHeight) + 20;
                            maxX = viewport.width - 20;
                            maxY = ((oggi + 1) * sectionHeight) - 20;
                        }

                        // Aggiunge margine al riquadro
                        const margine = 15;
                        const recX = Math.max(0, minX - margine);
                        const recY = Math.max(0, minY - margine);
                        const recWidth = (maxX - minX) + (margine * 2);
                        const recHeight = (maxY - minY) + (margine * 2);

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

                    });

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
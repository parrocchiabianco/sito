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
    // 2. VISUALIZZA EVIDENZIAZIONE NEL PDF
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

        for (
            let numeroPagina = 1;
            numeroPagina <= pdf.numPages;
            numeroPagina++
        ) {

            pdf.getPage(numeroPagina).then(function (pagina) {

                const scala = 1.5;

                const viewport = pagina.getViewport({
                    scale: scala
                });

                const wrapper = document.createElement("div");

                wrapper.className = "pdf-pagina";

                wrapper.style.position = "relative";
                wrapper.style.width = viewport.width + "px";
                wrapper.style.height = viewport.height + "px";


                const canvas = document.createElement("canvas");

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                wrapper.appendChild(canvas);

                contenitorePDF.appendChild(wrapper);


                const contesto = canvas.getContext("2d");


                // Visualizza la pagina PDF
                pagina.render({
                    canvasContext: contesto,
                    viewport: viewport
                });


                // Legge il testo del PDF
                pagina.getTextContent().then(function (contenuto) {

                    contenuto.items.forEach(function (elemento) {

                        const testo = elemento.str.trim();


                        // Cerca il nome del giorno attuale
                        if (
                            testo.toLowerCase().includes(
                                nomeGiorno.toLowerCase()
                            )
                        ) {

                            const evidenziazione =
                                document.createElement("div");

                            evidenziazione.className =
                                "pdf-giorno-oggi";


                            const trasformazione =
                                pdfjsLib.Util.transform(
                                    viewport.transform,
                                    elemento.transform
                                );


                            const x = trasformazione[4];
                            const y = trasformazione[5];

                            const altezza =
                                Math.abs(trasformazione[3]);

                            const larghezza =
                                Math.abs(trasformazione[0]);


                            evidenziazione.style.position = "absolute";

                            evidenziazione.style.left = x + "px";

                            evidenziazione.style.top =
                                (y - altezza) + "px";

                            evidenziazione.style.width =
                                larghezza + "px";

                            evidenziazione.style.height =
                                (altezza + 8) + "px";


                            wrapper.appendChild(evidenziazione);

                        }

                    });

                });

            });

        }

    }).catch(function (errore) {

        console.error(
            "Errore nel caricamento del PDF:",
            errore
        );

        contenitorePDF.innerHTML =
            "<p>Impossibile caricare il foglietto settimanale.</p>";

    });

});
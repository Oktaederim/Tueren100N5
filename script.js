// JavaScript-Logik für den Rechner
document.addEventListener('DOMContentLoaded', () => {
    // Elemente der Benutzeroberfläche abrufen
    const doorWidthSlider = document.getElementById('doorWidthSlider');
    const doorWidthInput = document.getElementById('doorWidth');
    const doorHeightSlider = document.getElementById('doorHeightSlider');
    const doorHeightInput = document.getElementById('doorHeight');
    const differentialPressureSlider = document.getElementById('differentialPressureSlider');
    const differentialPressureInput = document.getElementById('differentialPressure');
    const doorCloserMomentSlider = document.getElementById('doorCloserMomentSlider');
    const doorCloserMomentInput = document.getElementById('doorCloserMoment');
    const b2DistanceSlider = document.getElementById('b2DistanceSlider'); // Neuer b2 Slider
    const b2DistanceInput = document.getElementById('b2Distance');     // Neues b2 Input
    const volumeFlowSlider = document.getElementById('volumeFlowSlider');
    const volumeFlowInput = document.getElementById('volumeFlow');
    const resetButton = document.getElementById('resetButton'); // Reset Button

    const roomTypeRadios = document.querySelectorAll('input[name="roomType"]');

    const doorAreaResult = document.getElementById('doorAreaResult');
    const displayDifferentialPressureResult = document.getElementById('displayDifferentialPressureResult');
    const operatingForceDisplay = document.getElementById('operatingForceDisplay');
    const operatingForceResult = document.getElementById('operatingForceResult');
    const doorCloserForceContribution = document.getElementById('doorCloserForceContribution'); // Neues Element für Türschließer-Anteil
    const operatingForceStatus = document.getElementById('operatingForceStatus');
    const airflowVelocityDisplay = document.getElementById('airflowVelocityDisplay');
    const airflowVelocityResult = document.getElementById('airflowVelocityResult');
    const airflowVelocityStatus = document.getElementById('airflowVelocityStatus');
    const volumeFlowHourResult = document.getElementById('volumeFlowHourResult'); // Neues Element für m³/h


    // Speichern der Standardwerte
    const defaultValues = {
        doorWidth: "1.00", // Türbreite 1 m
        doorHeight: "2.00", // Türhöhe 2,00 m
        differentialPressure: "50", // Differenzdruck 50 Pa
        doorCloserMoment: "0", // Türschließermoment 0 Nm
        b2Distance: "0.50", // Abstand zur Drehachse b2 0,50 m (Standard)
        volumeFlow: "2.0", // Volumenstrom 2,0 m³/s
        roomType: "Sicherheitstreppenraum"
    };


    // Hauptfunktion zur Aktualisierung der Berechnungen und Anzeigen
    const updateCalculations = () => {
        // Eingabewerte abrufen (als Zahlen parsen)
        const B = parseFloat(doorWidthInput.value); // Türbreite
        const H = parseFloat(doorHeightInput.value); // Türhöhe
        const deltaP = parseFloat(differentialPressureInput.value); // Differenzdruck
        const M0 = parseFloat(doorCloserMomentInput.value); // Türschließer-Moment
        let b2 = parseFloat(b2DistanceInput.value);      // Abstand b2 (Türgriff zu Drehachse)
        const Q_s = parseFloat(volumeFlowInput.value); // Volumenstrom in m³/s

        // --- Validierung für b2 ---
        // b2 muss kleiner als B sein (mit etwas Puffer).
        // Wenn B=0, dann kann b2 nur 0 sein.
        const currentDoorWidth = parseFloat(doorWidthInput.value);
        let newMaxB2 = currentDoorWidth - 0.01; 
        if (newMaxB2 < 0) newMaxB2 = 0; // b2 kann nicht negativ sein

        b2DistanceSlider.max = newMaxB2;
        b2DistanceInput.max = newMaxB2;


        if (b2 > newMaxB2) { // Falls b2 über dem neuen Maximum liegt
            b2 = newMaxB2; 
            // Hier keine sofortige Zuweisung zu Input/Slider, da dies zu einem "Flackern" führen könnte
            // Die updateInputFromSlider/updateSliderFromInput sorgen dafür
            console.warn(`b2 wurde auf max. zulässigen Wert (${newMaxB2.toFixed(2)}m) begrenzt.`);
        }
        // Auch sicherstellen, dass b2 nicht kleiner als das Minimum des Sliders/Inputs ist (0)
        if (b2 < 0) {
            b2 = 0;
            console.warn("b2 wurde auf min. zulässigen Wert (0m) begrenzt.");
        }
        // Stellen Sie sicher, dass die angezeigten Werte auch nach der Begrenzung korrekt sind
        b2DistanceInput.value = b2.toFixed(2);
        b2DistanceSlider.value = b2.toFixed(2);


        // Türfläche (A = B * H)
        const A = B * H;
        doorAreaResult.textContent = A.toFixed(2); // Auf 2 Dezimalstellen runden

        // Anzeige des aktuellen Differenzdrucks
        displayDifferentialPressureResult.textContent = deltaP.toFixed(0);

        // Berechnete Betätigungskraft (F_T)
        // b1 = B/2 (Abstand Drehpunkt zu Kraftangriffspunkt - Mitte Türfläche)
        const b1 = B / 2;
        
        let FT_numerator = (deltaP * A * b1 + M0);
        let FT = 0;
        let F_Mo_contribution = 0; // Anteil des Türschließers in N

        if (b2 === 0) { // Division durch Null oder sehr kleinen Wert behandeln
            FT = Infinity; // Physikalisch unendliche Kraft am Drehpunkt
            F_Mo_contribution = Infinity;
            console.warn("b2 ist Null, die Betätigungskraft ist unendlich.");
        } else {
            FT = FT_numerator / b2;
            F_Mo_contribution = M0 / b2;
        }
        
        // Sicherstellen, dass FT nicht negativ wird, falls M0 zu klein ist und deltaP 0 ist (unwahrscheinlich, aber für Robustheit)
        if (FT < 0) FT = 0;

        // Handling Infinity/NaN for display
        operatingForceResult.textContent = Number.isFinite(FT) ? FT.toFixed(2) : (FT === Infinity ? "∞" : "N/A");
        doorCloserForceContribution.textContent = Number.isFinite(F_Mo_contribution) ? `(davon Türschließer: ${F_Mo_contribution.toFixed(2)} N)` : "(Türschließer: ∞ N)";


        // Farbliche Kennzeichnung und Status für Betätigungskraft
        operatingForceDisplay.classList.remove('bg-ok', 'bg-danger');
        operatingForceResult.classList.remove('text-ok', 'text-danger');
        operatingForceStatus.classList.remove('text-ok', 'text-danger');

        if (Number.isFinite(FT) && FT <= 100) { // Nur bei endlichen Werten prüfen
            operatingForceDisplay.classList.add('bg-ok');
            operatingForceResult.classList.add('text-ok');
            operatingForceStatus.classList.add('text-ok');
            operatingForceStatus.textContent = 'Status: OK (≤ 100 N)';
        } else if (Number.isFinite(FT) && FT > 100) {
            operatingForceDisplay.classList.add('bg-danger');
            operatingForceResult.classList.add('text-danger');
            operatingForceStatus.classList.add('text-danger');
            operatingForceStatus.textContent = 'Status: NICHT OK (> 100 N)! Erhöhte Betätigungskraft.';
        } else { // Für Unendlich oder NaN
            operatingForceDisplay.classList.add('bg-danger'); // oder eine neutrale Farbe
            operatingForceResult.classList.add('text-danger');
            operatingForceStatus.classList.add('text-danger');
            operatingForceStatus.textContent = 'Status: NICHT DEFINIERT (physikalisch unmöglich/unendlich)';
        }


        // Berechnete Durchströmungsgeschwindigkeit (v = Q / A)
        let v = 0;
        if (A === 0) { // Explicitly handle A = 0
            if (Q_s === 0) {
                v = 0; // 0/0 is NaN, but physically 0 velocity if no flow and no area
            } else {
                v = Infinity; // Flow through zero area is infinite velocity
            }
            console.warn("Türfläche ist 0. Durchströmungsgeschwindigkeit ist unendlich oder 0.");
        } else {
            v = Q_s / A;
        }
        
        // Handling Infinity/NaN for display
        airflowVelocityResult.textContent = Number.isFinite(v) ? v.toFixed(2) : (v === Infinity ? "∞" : "N/A");


        // Durchströmungsvolumen in m³/h
        const Q_h = Q_s * 3600;
        volumeFlowHourResult.textContent = Q_h.toFixed(2);


        // Farbliche Kennzeichnung und Status für Durchströmungsgeschwindigkeit
        airflowVelocityDisplay.classList.remove('bg-ok', 'bg-warning', 'bg-danger');
        airflowVelocityResult.classList.remove('text-ok', 'text-warning', 'text-danger');
        airflowVelocityStatus.classList.remove('text-ok', 'text-warning', 'text-danger');

        const selectedRoomType = document.querySelector('input[name="roomType"]:checked').value;

        if (Number.isFinite(v)) { // Nur bei endlichen Werten prüfen
            if (selectedRoomType === 'Sicherheitstreppenraum') {
                if (v >= 2.0) {
                    airflowVelocityDisplay.classList.add('bg-ok');
                    airflowVelocityResult.classList.add('text-ok');
                    airflowVelocityStatus.classList.add('text-ok');
                    airflowVelocityStatus.textContent = 'Status: OK (≥ 2,0 m/s für Sicherheitstreppenraum)';
                } else if (v >= 1.0 && v < 2.0) {
                    airflowVelocityDisplay.classList.add('bg-warning');
                    airflowVelocityResult.classList.add('text-warning');
                    airflowVelocityStatus.classList.add('text-warning');
                    airflowVelocityStatus.textContent = 'Status: Achtung (≥ 1,0 m/s, aber < 2,0 m/s)! Ggf. unter bestimmten Bedingungen zulässig.';
                } else {
                    airflowVelocityDisplay.classList.add('bg-danger');
                    airflowVelocityResult.classList.add('text-danger');
                    airflowVelocityStatus.classList.add('text-danger');
                    airflowVelocityStatus.textContent = 'Status: NICHT OK (< 1,0 m/s)! Strömungsgeschwindigkeit zu gering.';
                }
            } else if (selectedRoomType === 'Feuerwehraufzug') {
                if (v >= 0.75) {
                    airflowVelocityDisplay.classList.add('bg-ok');
                    airflowVelocityResult.classList.add('text-ok');
                    airflowVelocityStatus.classList.add('text-ok');
                    airflowVelocityStatus.textContent = 'Status: OK (≥ 0,75 m/s für Feuerwehraufzugsvorraum)';
                } else {
                    airflowVelocityDisplay.classList.add('bg-danger');
                    airflowVelocityResult.classList.add('text-danger');
                    airflowVelocityStatus.classList.add('text-danger');
                    airflowVelocityStatus.textContent = 'Status: NICHT OK (< 0,75 m/s)! Strömungsgeschwindigkeit zu gering.';
                }
            }
        } else { // Für Unendlich oder NaN
            airflowVelocityDisplay.classList.add('bg-danger'); // oder eine neutrale Farbe
            airflowVelocityResult.classList.add('text-danger');
            airflowVelocityStatus.classList.add('text-danger');
            airflowVelocityStatus.textContent = 'Status: NICHT DEFINIERT (physikalisch unmöglich/unendlich)';
        }
    };

    // Funktion zur Synchronisierung von Slider und Zahlenfeld
    // Diese generische Funktion wird für die meisten Eingabefelder verwendet
    const syncInputs = (slider, numberInput) => {
        // Vom Slider zum Zahlenfeld: Wert vom Slider übernehmen und formatieren
        slider.addEventListener('input', () => {
            numberInput.value = parseFloat(slider.value).toFixed(2);
            updateCalculations();
        });

        // Vom Zahlenfeld zum Slider (live input): Wert parsen und Slider aktualisieren
        numberInput.addEventListener('input', () => {
            let value = parseFloat(numberInput.value);
            // Erlaube die Eingabe von "0.", "1.", "-", ohne dass NaN auftritt
            if (isNaN(value) && !["", "-", "."].includes(numberInput.value) && !numberInput.value.endsWith('.')) {
                return; // Ungültige Eingabe, die nicht zu einer Zahl führt und nicht teil einer gültigen Zahl sein kann
            }
            // Wert innerhalb der Slider-Grenzen halten
            const min = parseFloat(numberInput.min);
            const max = parseFloat(numberInput.max);
            // Nur den Slider aktualisieren, wenn der Wert gültig ist, und ihn klemmen
            if (!isNaN(value)) {
                value = Math.max(min, Math.min(max, value));
                slider.value = value;
            }
            updateCalculations(); // Berechnungen bei jeder Eingabe aktualisieren
        });

        // Vom Zahlenfeld zum Slider (bei Fokusverlust/Change - für finale Formatierung)
        numberInput.addEventListener('change', () => {
            let value = parseFloat(numberInput.value);
            const min = parseFloat(numberInput.min);
            const max = parseFloat(numberInput.max);
            if (isNaN(value) || value < min) {
                value = min;
            } else if (value > max) {
                value = max;
            }
            numberInput.value = value.toFixed(2); // Finale Formatierung nach Eingabe
            slider.value = value;
            updateCalculations();
        });
    };

    // Spezielle Synchronisierung für Türbreite, um b2-Range anzupassen
    // Diese Funktionen sind notwendig, da doorWidth den max-Wert von b2 beeinflusst.
    doorWidthSlider.addEventListener('input', () => {
        doorWidthInput.value = parseFloat(doorWidthSlider.value).toFixed(2);
        updateB2RangeAndValue(); 
        updateCalculations();
    });
    doorWidthInput.addEventListener('input', () => {
        let value = parseFloat(doorWidthInput.value);
        if (isNaN(value) && !["", "-", "."].includes(doorWidthInput.value) && !doorWidthInput.value.endsWith('.')) {
            return;
        }
        const min = parseFloat(doorWidthInput.min);
        const max = parseFloat(doorWidthInput.max);
        if (!isNaN(value)) {
            value = Math.max(min, Math.min(max, value));
            doorWidthSlider.value = value;
        }
        updateB2RangeAndValue(); 
        updateCalculations();
    });
    doorWidthInput.addEventListener('change', () => {
        let value = parseFloat(doorWidthInput.value);
        const min = parseFloat(doorWidthInput.min);
        const max = parseFloat(doorWidthInput.max);
        if (isNaN(value) || value < min) {
            value = min;
        } else if (value > max) {
            value = max;
        }
        doorWidthInput.value = value.toFixed(2);
        doorWidthSlider.value = value;
        updateB2RangeAndValue();
        updateCalculations();
    });

    // Funktion zur dynamischen Anpassung des b2-Sliders und Inputs Max-Wertes und Wertanpassung
    const updateB2RangeAndValue = () => {
        const currentDoorWidth = parseFloat(doorWidthInput.value);
        // Wenn Türbreite 0 ist, dann kann b2 nur 0 sein. Ansonsten muss b2 kleiner als Türbreite sein.
        // Ein kleiner Puffer (z.B. 0.01m) ist sinnvoll, damit b2 nicht exakt gleich B wird, was zu Division durch 0 führen könnte
        const newMaxB2 = (currentDoorWidth > 0) ? currentDoorWidth - 0.01 : 0; 
        
        b2DistanceSlider.max = newMaxB2;
        b2DistanceInput.max = newMaxB2;

        // Wenn der aktuelle b2-Wert außerhalb des neuen Bereichs liegt, anpassen
        let currentB2 = parseFloat(b2DistanceInput.value);
        if (isNaN(currentB2) || currentB2 > newMaxB2) {
            b2DistanceInput.value = newMaxB2.toFixed(2);
            b2DistanceSlider.value = newMaxB2.toFixed(2);
        } else if (currentB2 < parseFloat(b2DistanceInput.min)) { // b2 kann nicht negativ sein, min ist 0
            b2DistanceInput.value = parseFloat(b2DistanceInput.min).toFixed(2);
            b2DistanceSlider.value = parseFloat(b2DistanceInput.min).toFixed(2);
        }
        // Wichtig: Nach der Anpassung des Bereichs den aktuellen Wert im Feld und Slider sicherstellen
        b2DistanceInput.value = parseFloat(b2DistanceInput.value).toFixed(2);
        b2DistanceSlider.value = parseFloat(b2DistanceInput.value);
    };


    // Synchronisierung für andere Eingabepaare
    syncInputs(doorHeightSlider, doorHeightInput);
    syncInputs(differentialPressureSlider, differentialPressureInput);
    syncInputs(doorCloserMomentSlider, doorCloserMomentInput);
    syncInputs(b2DistanceSlider, b2DistanceInput); // b2 Slider synchronisieren (normale sync für Input/Slider)
    syncInputs(volumeFlowSlider, volumeFlowInput);

    // Event-Listener für Radio-Buttons (Raumtyp)
    roomTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateCalculations);
    });

    // Reset-Funktion
    resetButton.addEventListener('click', () => {
        // Setzen der Eingabefelder auf die Standardwerte
        doorWidthInput.value = defaultValues.doorWidth;
        doorHeightInput.value = defaultValues.doorHeight;
        differentialPressureInput.value = defaultValues.differentialPressure;
        doorCloserMomentInput.value = defaultValues.doorCloserMoment;
        b2DistanceInput.value = defaultValues.b2Distance; 
        volumeFlowInput.value = defaultValues.volumeFlow;

        // Reset der Slider-Positionen entsprechend der Standardwerte
        doorWidthSlider.value = defaultValues.doorWidth;
        doorHeightSlider.value = defaultValues.doorHeight;
        differentialPressureSlider.value = defaultValues.differentialPressure;
        doorCloserMomentSlider.value = defaultValues.doorCloserMoment;
        b2DistanceSlider.value = defaultValues.b2Distance;
        volumeFlowSlider.value = defaultValues.volumeFlow;

        // Reset room type radio button
        document.getElementById('roomTypeSafetyStairwell').checked = true;

        // Sicherstellen, dass der b2-Bereich und Wert nach dem Reset der Türbreite korrekt aktualisiert wird
        updateB2RangeAndValue(); 
        updateCalculations(); // Berechnungen nach Reset aktualisieren
    });

    // Initialberechnung beim Laden der Seite
    updateB2RangeAndValue(); // Set initial b2 max based on default door width and ensure value is valid
    updateCalculations();
});

const SUPABASE_URL = "https://fupgxfeumsubvxpnmvli.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_YWiBhQ9Tcu6pPjpDoVJufQ_MQLVKNfR";
console.log("TV Turns: Supabase connection configured");

const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const kidsInput = document.getElementById("kids");
const calculateButton = document.getElementById("calculateButton");
const resetButton = document.getElementById("resetButton");
const results = document.getElementById("results");
const turnList = document.getElementById("turnList");

async function loadSettings() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/tv_settings?select=*&order=id.asc&limit=1`,
            {
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Could not load settings.");
        }

        const data = await response.json();

        if (data.length > 0) {
            startTimeInput.value = data[0].start_time.slice(0, 5);
            endTimeInput.value = data[0].end_time.slice(0, 5);
            kidsInput.value = data[0].kids;
        }
    } catch (error) {
        console.error("Supabase load error:", error);
    }
}

async function saveSettings() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/tv_settings?id=eq.1`,
            {
                method: "PATCH",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    kids: Number(kidsInput.value),
                    start_time: `${startTimeInput.value}:00`,
                    end_time: `${endTimeInput.value}:00`,
                    updated_at: new Date().toISOString()
                })
            }
        );

        if (!response.ok) {
            throw new Error("Could not save settings.");
        }
    } catch (error) {
        console.error("Supabase save error:", error);
    }
}

function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes) {
    minutes = minutes % (24 * 60);

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${String(mins).padStart(2, "0")} ${suffix}`;
}

async function calculateTurns() {
    await saveSettings();

    const start = timeToMinutes(startTimeInput.value);
    let end = timeToMinutes(endTimeInput.value);
    const kids = Number(kidsInput.value);

    if (end <= start) {
        end += 24 * 60;
    }

    const totalMinutes = end - start;

    if (totalMinutes < kids) {
        alert("There isn't enough time for each kid to have a turn.");
        return;
    }

    const baseMinutes = Math.floor(totalMinutes / kids);
    const remainder = totalMinutes % kids;

    let currentTime = start;

    turnList.innerHTML = "";

    for (let i = 0; i < kids; i++) {
        const turnLength = baseMinutes + (i < remainder ? 1 : 0);
        const turnStart = currentTime;
        const turnEnd = currentTime + turnLength;

        const turn = document.createElement("div");
        turn.className = "turn";

        turn.innerHTML = `
            <div class="turn-number">Kid ${i + 1}</div>
            <div class="turn-time">
                ${minutesToTime(turnStart)} – ${minutesToTime(turnEnd)}
            </div>
        `;

        turnList.appendChild(turn);

        currentTime = turnEnd;
    }

    results.classList.remove("hidden");
}

function reset() {
    startTimeInput.value = "19:00";
    endTimeInput.value = "21:00";
    kidsInput.value = "3";

    results.classList.add("hidden");
    turnList.innerHTML = "";
}

calculateButton.addEventListener("click", calculateTurns);
resetButton.addEventListener("click", reset);

loadSettings();

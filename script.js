
// its the start of the promodo timer, it counts down from 25 minutes
// and when it reaches 0 it increases the session count by 1 

//let time = 25 * 60;
const POMODORO_DURATION = 10; // seconds (shortened for testing)
let time = POMODORO_DURATION;
let timerInterval = null;

function updateTimerDisplay() {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    document.getElementById("timer-display").textContent =
        `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Progress tracker: store completed pomodoro sessions and update UI
let sessions = parseInt(localStorage.getItem("sessions") || "0", 10) || 0;

function updateSessionsDisplay() {
    const el = document.getElementById("sessions-count");
    if (el) el.textContent = sessions;
}

function increaseSessions() {
    sessions += 1;
    localStorage.setItem("sessions", String(sessions));
    updateSessionsDisplay();
    // notify the user and play a short beep when a session completes
    notifySessionComplete();
    playBeep();
}

function resetSessions() {
    sessions = 0;
    localStorage.setItem("sessions", String(sessions));
    updateSessionsDisplay();
}

// show a desktop notification if permitted (requests permission if needed)
function notifySessionComplete() {
    if (!('Notification' in window)) return;
    try {
        if (Notification.permission === 'granted') {
            new Notification('Pomodoro complete', { body: 'Well done — session recorded.' });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Pomodoro complete', { body: 'Well done — session recorded.' });
                }
            });
        }
    } catch (e) {
        // ignore notification errors
    }
}

// play a short beep using the Web Audio API
function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 880;
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.01);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        o.stop(ctx.currentTime + 0.21);
    } catch (e) {
        // some browsers may block autoplay; ignore if unavailable
    }
}

updateSessionsDisplay();

document.getElementById("start-btn").onclick = () => {
    if (timerInterval) return;

    timerInterval = setInterval(() => {
        time--;
        updateTimerDisplay();

        if (time <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            time = POMODORO_DURATION;
            increaseSessions();
            updateTimerDisplay();
        }
    }, 1000);
};

document.getElementById("reset-btn").onclick = () => {
    clearInterval(timerInterval);
    timerInterval = null;
    time = POMODORO_DURATION;
    updateTimerDisplay();
};

updateTimerDisplay();

// wire up reset sessions button if present
const resetSessionsBtn = document.getElementById('reset-sessions-btn');
if (resetSessionsBtn) resetSessionsBtn.onclick = resetSessions;

//This is the task list code

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
    const list = document.getElementById("task-list");
    list.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.textContent = task.text;

        // saw this on a youtube video, it makes completed tasks look different by putting a line through them
        if (task.completed) {
            li.style.textDecoration = "line-through";
            li.style.color = "gray";
        }

        // on click it marks the task as completed or not completed
        li.onclick = () => {
            tasks[index].completed = !tasks[index].completed;
            saveTasks();
            renderTasks();
        };

        // on right click it deletes the task
        li.oncontextmenu = (e) => {
            e.preventDefault();
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        };

        list.appendChild(li);
    });
}

document.getElementById("add-task-btn").onclick = () => {
    const input = document.getElementById("task-input");

    if (input.value.trim() === "") return;

    tasks.push({
        text: input.value,
        completed: false
    });

    input.value = "";
    saveTasks();
    renderTasks();
};

renderTasks();

// --- Supabase Setup ---
const SUPABASE_URL = 'https://rvuchpujghjblwlpjbky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2dWNocHVqZ2hqYmx3bHBqYmt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NzE2NTIsImV4cCI6MjA3NjM0NzY1Mn0.mTUwHEr7VBsnSOlvhvbZX0IctOQrwfiLAdgWUpHXilw';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM Elements ---
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const profileBtn = document.getElementById('profile-btn');
const newKitBtn = document.getElementById('new-kit-btn');
const kitHistory = document.getElementById('kit-history');
const generatorForm = document.getElementById('generator-form');
const outputContainer = document.getElementById('output-container');
const eventTypeSelect = document.getElementById('event-type');
const eventVibeSelect = document.getElementById('event-vibe');
const generateBtn = document.getElementById('generate-btn');

// Modal Elements
const authModalOverlay = document.getElementById('auth-modal-overlay');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalTitle = document.getElementById('modal-title');
const authForm = document.getElementById('auth-form');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const modalSubmitBtn = document.getElementById('modal-submit-btn');
const switchModePrompt = document.getElementById('switch-mode-prompt');
const switchModeBtn = document.getElementById('switch-mode-btn');
const modalError = document.getElementById('modal-error');

let currentUser = null;
let currentKitData = null;
let isLoginMode = true;

// --- Authentication UI ---

function openModal(mode = 'login') {
    isLoginMode = mode === 'login';
    modalTitle.textContent = isLoginMode ? 'Log In' : 'Sign Up';
    modalSubmitBtn.textContent = isLoginMode ? 'Log In' : 'Sign Up';
    switchModePrompt.textContent = isLoginMode ? "Don't have an account?" : "Already have an account?";
    switchModeBtn.textContent = isLoginMode ? 'Sign Up' : 'Log In';
    modalError.textContent = '';
    authModalOverlay.style.display = 'flex';
}

function closeModal() {
    authModalOverlay.style.display = 'none';
}

loginBtn.addEventListener('click', () => openModal('login'));
signupBtn.addEventListener('click', () => openModal('signup'));
closeModalBtn.addEventListener('click', closeModal);
authModalOverlay.addEventListener('click', (e) => {
    if (e.target === authModalOverlay) closeModal();
});
switchModeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(isLoginMode ? 'signup' : 'login');
});

// --- Authentication Logic ---

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    modalError.textContent = '';
    const email = authEmailInput.value;
    const password = authPasswordInput.value;

    if (isLoginMode) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            modalError.textContent = error.message;
        } else if (data.user) {
            currentUser = data.user;
            updateUIForLoggedInUser();
            loadKitHistory();
            closeModal();
        }
    } else { // Signup mode
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) {
            modalError.textContent = error.message;
        } else {
            // Auto-login after successful signup
            alert("Signup successful! You're now logged in.");
            currentUser = data.user;
            updateUIForLoggedInUser();
            loadKitHistory();
            closeModal();
        }
    }
});

async function checkUserSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) {
        currentUser = session.user;
        updateUIForLoggedInUser();
        loadKitHistory();
    } else {
        updateUIForLoggedOutUser();
        // Show login modal on first visit if not logged in
        openModal('login');
    }
}

function updateUIForLoggedInUser() {
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'none';
    profileBtn.style.display = 'flex';
    const emailInitial = currentUser?.email ? currentUser.email[0].toUpperCase() : '?';
    profileBtn.textContent = emailInitial;
}

function updateUIForLoggedOutUser() {
    loginBtn.style.display = 'block';
    signupBtn.style.display = 'block';
    profileBtn.style.display = 'none';
    kitHistory.innerHTML = '<p>Log in to save and view your kit history.</p>';
}

profileBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    currentUser = null;
    updateUIForLoggedOutUser();
    clearGenerator();
});

// --- UI & Generator Logic ---

menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
newKitBtn.addEventListener('click', () => {
    clearGenerator();
    if (window.innerWidth <= 768) sidebar.classList.remove('open');
});

function clearGenerator() {
    generatorForm.reset();
    outputContainer.innerHTML = '';
    currentKitData = null;
    eventVibeSelect.innerHTML = '<option value="" disabled selected>Select event type first...</option>';
}

const vibeOptions = {
    college: [
        { value: "hype", text: "Hype & Energetic" }, { value: "tech", text: "Tech-focused & Innovative" },
        { value: "creative", text: "Creative & Artsy" }, { value: "casual", text: "Fun & Casual" }
    ],
    corporate: [
        { value: "professional", text: "Professional & Formal" }, { value: "inspirational", text: "Inspirational & Visionary" },
        { value: "networking", text: "Networking-focused" }, { value: "teambuilding", text: "Team-Building & Fun" }
    ]
};
eventTypeSelect.addEventListener('change', (e) => {
    const selectedType = e.target.value;
    eventVibeSelect.innerHTML = '<option value="" disabled selected>Select a vibe...</option>';
    if (vibeOptions[selectedType]) {
        vibeOptions[selectedType].forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.text;
            eventVibeSelect.appendChild(opt);
        });
    }
});

generatorForm.addEventListener('submit', async (e) => { /* ... Keep this function identical to the previous version ... */ });
function setLoading(isLoading) { /* ... Keep this function identical to the previous version ... */ }
function displayResults(kit) { /* ... Keep this function identical to the previous version ... */ }
function createResultCard(iconClass, title, text) { /* ... Keep this function identical to the previous version ... */ }
outputContainer.addEventListener('click', (e) => { /* ... Keep this function identical to the previous version ... */ });
function addSaveButton(eventName) { /* ... Keep this function identical to the previous version ... */ }

// --- Database Functions (Saving & Loading) ---

async function saveCurrentKit(eventName) {
    if (!currentUser || !currentKitData) return alert("You must be logged in and have generated a kit to save.");
    
    const { error } = await supabaseClient.from('kits').insert([{
        user_id: currentUser.id, event_name: eventName, kit_data: currentKitData
    }]);

    if (error) {
        alert("Failed to save kit: " + error.message);
    } else {
        alert(`Kit "${eventName}" saved successfully!`);
        loadKitHistory();
    }
}

async function loadKitHistory() {
    if (!currentUser) return;
    const { data: kits, error } = await supabaseClient.from('kits').select('id, event_name, created_at')
        .eq('user_id', currentUser.id).order('created_at', { ascending: false });

    if (error) {
        kitHistory.innerHTML = '<p>Error loading history.</p>';
    } else if (kits && kits.length > 0) {
        kitHistory.innerHTML = '';
        kits.forEach(kit => {
            const link = document.createElement('a');
            link.href = `#kit-${kit.id}`;
            link.textContent = kit.event_name || 'Untitled Kit';
            link.onclick = (e) => {
                e.preventDefault();
                loadSpecificKit(kit.id);
                if (window.innerWidth <= 768) sidebar.classList.remove('open');
            };
            kitHistory.appendChild(link);
        });
    } else {
        kitHistory.innerHTML = '<p>No saved kits yet.</p>';
    }
}

async function loadSpecificKit(kitId) {
    if (!currentUser) return;
    setLoading(true);
    outputContainer.innerHTML = '';

    const { data: kit, error } = await supabaseClient.from('kits').select('event_name, kit_data')
        .eq('id', kitId).eq('user_id', currentUser.id).single();

    if (error || !kit) {
        alert("Could not load the selected kit.");
    } else {
        document.getElementById('event-name').value = kit.event_name || '';
        currentKitData = kit.kit_data;
        displayResults(currentKitData);
        addSaveButton(kit.event_name);
    }
    setLoading(false);
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', checkUserSession);

// --- Supabase Setup ---
const SUPABASE_URL = 'https://rvuchpujghjblwlpjbky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2dWNocHVqZ2hqYmx3bHBqYmt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NzE2NTIsImV4cCI6MjA3NjM0NzY1Mn0.mTUwHEr7VBsnSOlvhvbZX0IctOQrwfiLAdgWUpHXilw';

// Initialize the Supabase client (Corrected Initialization)
// We assume the global 'supabase' object exists from the CDN script
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM Elements ---
const eventTypeSelect = document.getElementById('event-type');
const eventVibeSelect = document.getElementById('event-vibe');
const generatorForm = document.getElementById('generator-form');
const generateBtn = document.getElementById('generate-btn');
const outputContainer = document.getElementById('output-container');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const newKitBtn = document.getElementById('new-kit-btn');
const kitHistory = document.getElementById('kit-history');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const profileBtn = document.getElementById('profile-btn');

let currentUser = null; // Variable to store logged-in user info
let currentKitData = null; // Variable to store the last generated kit

// --- Authentication Functions ---

// Check login status on page load
async function checkUserSession() {
    // Use the initialized client variable
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
        console.error("Error getting session:", error);
        updateUIForLoggedOutUser();
        return;
    }
    if (session && session.user) {
        currentUser = session.user;
        updateUIForLoggedInUser();
        loadKitHistory();
    } else {
        updateUIForLoggedOutUser();
    }
}

// Update UI elements for logged-in state
function updateUIForLoggedInUser() {
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'none';
    profileBtn.style.display = 'flex'; // Use flex for centering
    const emailInitial = currentUser?.email ? currentUser.email[0].toUpperCase() : '?';
    profileBtn.textContent = emailInitial;
}

// Update UI elements for logged-out state
function updateUIForLoggedOutUser() {
    loginBtn.style.display = 'block';
    signupBtn.style.display = 'block';
    profileBtn.style.display = 'none';
    kitHistory.innerHTML = '<p><a href="#" onclick="handleLogin()">Log in</a> to see saved kits.</p>';
}

// Placeholder Login Handler
async function handleLogin() {
    const email = prompt("Enter your email:");
    const password = prompt("Enter your password:");
    if (!email || !password) return;

    // Use the initialized client variable
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        alert("Login failed: " + error.message);
    } else if (data.user) {
        currentUser = data.user;
        updateUIForLoggedInUser();
        loadKitHistory();
        alert("Login successful!");
    }
}

// Placeholder Signup Handler
async function handleSignup() {
    const email = prompt("Enter email for signup:");
    const password = prompt("Enter password (min 6 chars):");
    if (!email || !password) return;

    // Use the initialized client variable
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
        alert("Signup failed: " + error.message);
    } else {
        alert("Signup successful! Please check your email to confirm.");
    }
}

// Logout Handler
async function handleLogout() {
    // Use the initialized client variable
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error("Logout failed:", error);
    } else {
        currentUser = null;
        updateUIForLoggedOutUser();
        clearGenerator();
        alert("Logged out successfully.");
    }
}


// --- Sidebar & UI Interaction ---

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

newKitBtn.addEventListener('click', () => {
    clearGenerator();
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
});

function clearGenerator() {
    generatorForm.reset();
    outputContainer.innerHTML = '';
    currentKitData = null;
    // Manually reset vibe dropdown as reset() might not trigger change event
    eventVibeSelect.innerHTML = '<option value="" disabled selected>Select event type first...</option>';
}

loginBtn.addEventListener('click', handleLogin);
signupBtn.addEventListener('click', handleSignup);
profileBtn.addEventListener('click', handleLogout);


// --- Kit Generation & Saving ---

// Dropdown logic
const vibeOptions = {
    college: [
        { value: "hype", text: "Hype & Energetic" },
        { value: "tech", text: "Tech-focused & Innovative" },
        { value: "creative", text: "Creative & Artsy" },
        { value: "casual", text: "Fun & Casual" }
    ],
    corporate: [
        { value: "professional", text: "Professional & Formal" },
        { value: "inspirational", text: "Inspirational & Visionary" },
        { value: "networking", text: "Networking-focused" },
        { value: "teambuilding", text: "Team-Building & Fun" }
    ]
};
eventTypeSelect.addEventListener('change', (e) => {
    const selectedType = e.target.value;
    eventVibeSelect.innerHTML = '<option value="" disabled selected>Select a vibe...</option>'; // Clear old options

    if (vibeOptions[selectedType]) {
        vibeOptions[selectedType].forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.text;
            eventVibeSelect.appendChild(opt);
        });
    }
});

// Form submission
generatorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(true);
    outputContainer.innerHTML = '';
    currentKitData = null;

    const eventName = document.getElementById('event-name').value;
    const eventType = document.getElementById('event-type').value;
    const eventVibe = document.getElementById('event-vibe').value;

    try {
        const response = await fetch('/api/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventName, eventType, eventVibe }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const rawText = data.kit;
        const jsonText = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);

        currentKitData = JSON.parse(jsonText);
        displayResults(currentKitData);
        addSaveButton(eventName);

    } catch (error) {
        console.error('Error generating or parsing kit:', error);
        outputContainer.innerHTML = `<div class="result-card"><p>Sorry, something went wrong generating the kit. Please try again!</p></div>`;
    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) {
    if (isLoading) {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
    } else {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate';
    }
}

// Display results
function displayResults(kit) {
    outputContainer.innerHTML = '';
    if (!kit) return;
    createResultCard("fa-solid fa-envelope", "Email Subject", kit.email_subject);
    createResultCard("fa-solid fa-at", "Email Body", kit.email_body);
    createResultCard("fa-brands fa-linkedin", "LinkedIn Post", kit.linkedin_post);
    createResultCard("fa-brands fa-x-twitter", "X (Twitter) Post", kit.x_post);
    createResultCard("fa-brands fa-instagram", "Instagram Caption", kit.instagram_caption);
    createResultCard("fa-brands fa-whatsapp", "WhatsApp / Telegram", kit.whatsapp_blurb);
}

// Create result card
function createResultCard(iconClass, title, text) {
     if (!text) return;

    const card = document.createElement('div');
    card.className = 'result-card';

    const titleElement = document.createElement('h3');
    const iconElement = document.createElement('i');
    const classes = iconClass.split(' ');
    iconElement.classList.add(...classes);
    titleElement.appendChild(iconElement);
    titleElement.appendChild(document.createTextNode(' ' + title));

    const textElement = document.createElement('p');
    textElement.textContent = text;

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-btn';
    copyButton.textContent = 'Copy';

    card.appendChild(titleElement);
    card.appendChild(textElement);
    card.appendChild(copyButton);
    outputContainer.appendChild(card);
}

// Copy button logic
outputContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy-btn')) {
        const textToCopy = e.target.previousElementSibling.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            e.target.textContent = 'Copied!';
            setTimeout(() => {
                e.target.textContent = 'Copy';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }
});

// Add a "Save Kit" button
function addSaveButton(eventName) {
    if (!currentUser) return;

    const saveBtnContainer = document.createElement('div');
    saveBtnContainer.style.textAlign = 'center';
    saveBtnContainer.style.marginTop = '1rem';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save Kit';
    saveBtn.className = 'btn-primary';
    saveBtn.onclick = () => saveCurrentKit(eventName);

    saveBtnContainer.appendChild(saveBtn);
    outputContainer.appendChild(saveBtnContainer);
}

// Function to save the current kit
async function saveCurrentKit(eventName) {
    if (!currentUser || !currentKitData) {
        alert("You must be logged in and have generated a kit to save.");
        return;
    }

    // Use the initialized client variable
    const { data, error } = await supabaseClient
        .from('kits')
        .insert([
            {
                user_id: currentUser.id,
                event_name: eventName,
                kit_data: currentKitData
            }
        ]);

    if (error) {
        console.error("Error saving kit:", error);
        alert("Failed to save kit: " + error.message);
    } else {
        alert(`Kit "${eventName}" saved successfully!`);
        loadKitHistory();
    }
}


// --- Kit History ---

// Load saved kits
async function loadKitHistory() {
    if (!currentUser) return;

    // Use the initialized client variable
    const { data: kits, error } = await supabaseClient
        .from('kits')
        .select('id, event_name, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading kit history:", error);
        kitHistory.innerHTML = '<p>Error loading history.</p>';
        return;
    }

    if (kits && kits.length > 0) {
        kitHistory.innerHTML = '';
        kits.forEach(kit => {
            const link = document.createElement('a');
            link.href = `#kit-${kit.id}`;
            link.textContent = kit.event_name || 'Untitled Kit';
            link.onclick = (e) => {
                e.preventDefault();
                loadSpecificKit(kit.id);
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            };
            kitHistory.appendChild(link);
        });
    } else {
        kitHistory.innerHTML = '<p>No saved kits yet.</p>';
    }
}

// Load and display a specific kit
async function loadSpecificKit(kitId) {
    if (!currentUser) return;

    setLoading(true);
    outputContainer.innerHTML = '';

    // Use the initialized client variable
    const { data: kit, error } = await supabaseClient
        .from('kits')
        .select('event_name, kit_data')
        .eq('id', kitId)
        .eq('user_id', currentUser.id)
        .single();

    if (error || !kit) {
        console.error("Error loading specific kit:", error);
        alert("Could not load the selected kit.");
        outputContainer.innerHTML = '<p>Error loading kit.</p>';
    } else {
        document.getElementById('event-name').value = kit.event_name || '';
        currentKitData = kit.kit_data;
        displayResults(currentKitData);
        addSaveButton(kit.event_name);
    }
    setLoading(false);
}


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', checkUserSession); // Check login status when the page is ready

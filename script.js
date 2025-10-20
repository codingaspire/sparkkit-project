// --- Supabase Setup ---
const SUPABASE_URL = 'https://rvuchpujghjblwlpjbky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2dWNocHVqZ2hqYmx3bHBqYmt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NzE2NTIsImV4cCI6MjA3NjM0NzY1Mn0.mTUwHEr7VBsnSOlvhvbZX0IctOQrwfiLAdgWUpHXilw';

// Initialize the Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    const { data: { session }, error } = await supabase.auth.getSession();
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
    // Set profile button initial (you'd fetch user data for a real name)
    const emailInitial = currentUser?.email ? currentUser.email[0].toUpperCase() : '?';
    profileBtn.textContent = emailInitial;
}

// Update UI elements for logged-out state
function updateUIForLoggedOutUser() {
    loginBtn.style.display = 'block';
    signupBtn.style.display = 'block';
    profileBtn.style.display = 'none';
    kitHistory.innerHTML = '<p><a href="#" onclick="handleLogin()">Log in</a> to see saved kits.</p>'; // Prompt login
}

// Placeholder Login Handler (Redirects to Supabase Auth UI in future)
async function handleLogin() {
    // In a real app, you'd use Supabase UI or custom forms
    // For now, let's simulate login with a prompt (VERY INSECURE - FOR DEMO ONLY)
    const email = prompt("Enter your email:");
    const password = prompt("Enter your password:");
    if (!email || !password) return;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
        alert("Signup failed: " + error.message);
    } else {
        alert("Signup successful! Please check your email to confirm.");
        // UI doesn't update until email is confirmed and user logs in
    }
}

// Logout Handler
async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Logout failed:", error);
    } else {
        currentUser = null;
        updateUIForLoggedOutUser();
        // Optionally clear form/output
        clearGenerator();
        alert("Logged out successfully.");
    }
}


// --- Sidebar & UI Interaction ---

// Toggle sidebar visibility on mobile
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// "New Kit" button clears the form and results
newKitBtn.addEventListener('click', () => {
    clearGenerator();
    if (window.innerWidth <= 768) { // Close sidebar on mobile after click
        sidebar.classList.remove('open');
    }
});

// Clear form inputs and output area
function clearGenerator() {
    generatorForm.reset();
    outputContainer.innerHTML = '';
    currentKitData = null; // Clear stored kit data
}

// Add event listeners to auth buttons
loginBtn.addEventListener('click', handleLogin);
signupBtn.addEventListener('click', handleSignup);
profileBtn.addEventListener('click', handleLogout); // Simple logout for now


// --- Kit Generation & Saving ---

// Dropdown logic (unchanged)
const vibeOptions = { /* ... (keep your existing vibeOptions object) ... */ };
eventTypeSelect.addEventListener('change', (e) => { /* ... (keep existing listener) ... */ });

// Form submission (updated to add Save button)
generatorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(true);
    outputContainer.innerHTML = '';
    currentKitData = null; // Clear previous kit before generating new one

    const eventName = document.getElementById('event-name').value;
    const eventType = document.getElementById('event-type').value;
    const eventVibe = document.getElementById('event-vibe').value;

    try {
        const response = await fetch('/api/index', { // Call our Vercel function
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

        currentKitData = JSON.parse(jsonText); // Store the generated kit data
        displayResults(currentKitData); // Display the kit
        addSaveButton(eventName); // Add the "Save Kit" button

    } catch (error) {
        console.error('Error generating or parsing kit:', error);
        outputContainer.innerHTML = `<div class="result-card"><p>Sorry, something went wrong generating the kit. Please try again!</p></div>`;
    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) { /* ... (keep existing setLoading function) ... */ }

// Display results (updated slightly)
function displayResults(kit) {
    outputContainer.innerHTML = ''; // Clear previous results

    if (!kit) return;

    createResultCard("fa-solid fa-envelope", "Email Subject", kit.email_subject);
    createResultCard("fa-solid fa-at", "Email Body", kit.email_body);
    createResultCard("fa-brands fa-linkedin", "LinkedIn Post", kit.linkedin_post);
    createResultCard("fa-brands fa-x-twitter", "X (Twitter) Post", kit.x_post);
    createResultCard("fa-brands fa-instagram", "Instagram Caption", kit.instagram_caption);
    createResultCard("fa-brands fa-whatsapp", "WhatsApp / Telegram", kit.whatsapp_blurb);
}

// Create result card (updated with icon logic)
function createResultCard(iconClass, title, text) { /* ... (keep existing createResultCard function) ... */ }

// Copy button logic (unchanged)
outputContainer.addEventListener('click', (e) => { /* ... (keep existing copy button listener) ... */ });

// Add a "Save Kit" button below the results
function addSaveButton(eventName) {
    if (!currentUser) return; // Only show save if logged in

    const saveBtnContainer = document.createElement('div');
    saveBtnContainer.style.textAlign = 'center'; // Center the button
    saveBtnContainer.style.marginTop = '1rem';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save Kit';
    saveBtn.className = 'btn-primary'; // Use existing button style
    saveBtn.onclick = () => saveCurrentKit(eventName); // Call save function on click

    saveBtnContainer.appendChild(saveBtn);
    outputContainer.appendChild(saveBtnContainer); // Add below the cards
}

// Function to save the current kit to Supabase
async function saveCurrentKit(eventName) {
    if (!currentUser || !currentKitData) {
        alert("You must be logged in and have generated a kit to save.");
        return;
    }

    const { data, error } = await supabase
        .from('kits')
        .insert([
            {
                user_id: currentUser.id, // Link to the logged-in user
                event_name: eventName,   // Save the event name for the history list
                kit_data: currentKitData // Save the full JSON kit
            }
        ]);

    if (error) {
        console.error("Error saving kit:", error);
        alert("Failed to save kit: " + error.message);
    } else {
        alert(`Kit "${eventName}" saved successfully!`);
        loadKitHistory(); // Refresh the sidebar history
    }
}


// --- Kit History ---

// Load saved kits from Supabase and display in sidebar
async function loadKitHistory() {
    if (!currentUser) return; // Only load if logged in

    const { data: kits, error } = await supabase
        .from('kits')
        .select('id, event_name, created_at') // Select only needed fields
        .eq('user_id', currentUser.id)       // Filter by the current user
        .order('created_at', { ascending: false }); // Show newest first

    if (error) {
        console.error("Error loading kit history:", error);
        kitHistory.innerHTML = '<p>Error loading history.</p>';
        return;
    }

    if (kits && kits.length > 0) {
        kitHistory.innerHTML = ''; // Clear "No saved kits" message
        kits.forEach(kit => {
            const link = document.createElement('a');
            link.href = `#kit-${kit.id}`; // Use fragment identifier (doesn't reload page)
            link.textContent = kit.event_name || 'Untitled Kit'; // Display event name
            link.onclick = (e) => {
                e.preventDefault(); // Stop default link behavior
                loadSpecificKit(kit.id); // Load this kit's data
                if (window.innerWidth <= 768) { // Close sidebar on mobile
                    sidebar.classList.remove('open');
                }
            };
            kitHistory.appendChild(link);
        });
    } else {
        kitHistory.innerHTML = '<p>No saved kits yet.</p>';
    }
}

// Load and display a specific kit when its history link is clicked
async function loadSpecificKit(kitId) {
    if (!currentUser) return;

    setLoading(true); // Show loading state
    outputContainer.innerHTML = ''; // Clear current output

    const { data: kit, error } = await supabase
        .from('kits')
        .select('event_name, kit_data') // Get the full kit data
        .eq('id', kitId)
        .eq('user_id', currentUser.id) // Ensure it belongs to the user
        .single(); // Expect only one result

    if (error || !kit) {
        console.error("Error loading specific kit:", error);
        alert("Could not load the selected kit.");
        outputContainer.innerHTML = '<p>Error loading kit.</p>';
    } else {
        // Populate the form with the event name (optional)
        document.getElementById('event-name').value = kit.event_name || '';
        // Display the loaded kit data
        currentKitData = kit.kit_data; // Store it in case they want to re-save
        displayResults(currentKitData);
        addSaveButton(kit.event_name); // Re-add save button for consistency
    }
    setLoading(false); // Hide loading state
}


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', checkUserSession); // Check login status when the page is ready

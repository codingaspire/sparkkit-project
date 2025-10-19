const eventTypeSelect = document.getElementById('event-type');
const eventVibeSelect = document.getElementById('event-vibe');
const generatorForm = document.getElementById('generator-form');
const generateBtn = document.getElementById('generate-btn');
const outputContainer = document.getElementById('output-container');

// 1. DYNAMIC DROPDOWN LOGIC
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

// 2. FORM SUBMISSION LOGIC
generatorForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    setLoading(true);
    outputContainer.innerHTML = ''; // Clear old results

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
        
        // --- THIS IS THE NEW CLEANING LOGIC ---
        // The AI might return ```json{...}```, so we clean it.
        const rawText = data.kit;
        const jsonText = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
        
        const kit = JSON.parse(jsonText); 
        displayResults(kit);
        // --- END OF NEW PART ---

    } catch (error) {
        console.error('Error parsing AI response:', error);
        outputContainer.innerHTML = `<div class="result-card"><p>Sorry, something went wrong with parsing the AI response. Please try again!</p></div>`;
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

// 3. DISPLAY RESULTS LOGIC (Updated with Icon Classes)
function displayResults(kit) {
    outputContainer.innerHTML = ''; // Clear again just in case

    // We're now passing the icon class names
    createResultCard("fa-solid fa-envelope", "Email Subject", kit.email_subject);
    createResultCard("fa-solid fa-at", "Email Body", kit.email_body);
    createResultCard("fa-brands fa-linkedin", "LinkedIn Post", kit.linkedin_post);
    createResultCard("fa-brands fa-x-twitter", "X (Twitter) Post", kit.x_post);
    createResultCard("fa-brands fa-instagram", "Instagram Caption", kit.instagram_caption);
    createResultCard("fa-brands fa-whatsapp", "WhatsApp / Telegram", kit.whatsapp_blurb);
}

// 4. HELPER FUNCTION (Updated to create <i> tags)
function createResultCard(iconClass, title, text) {
    if (!text) return; 

    const card = document.createElement('div');
    card.className = 'result-card';
    
    const titleElement = document.createElement('h3');
    
    // --- NEW ICON CODE ---
    const iconElement = document.createElement('i');
    // 'fa-solid fa-envelope' becomes ['fa-solid', 'fa-envelope']
    const classes = iconClass.split(' '); 
    iconElement.classList.add(...classes); // Adds all classes to the <i> tag
    
    // Add the icon and then the text (with a space)
    titleElement.appendChild(iconElement);
    titleElement.appendChild(document.createTextNode(' ' + title));
    // --- END NEW ICON CODE ---

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
    
// 5. COPY BUTTON LOGIC (Same as before)
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

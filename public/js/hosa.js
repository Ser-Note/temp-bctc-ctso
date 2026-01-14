// Fetch and display HOSA organization data from JotForm
window.onload = function() {
    fetchHosaData();
};

async function fetchHosaData() {
    try {
        const response = await fetch('/getJotFormData');
        const data = await response.json();
        
        // Filter all ACTIVE/CUSTOM HOSA Organization Details submissions
        const hosaSubmissions = data.content.filter(submission => {
            const answers = submission.answers;
            return (
                (submission.status === 'ACTIVE' || submission.status === 'CUSTOM') &&
                answers['13']?.answer === 'Organization Details' &&
                answers['17']?.answer === 'HOSA'
            );
        });

        // Sort by created_at date (most recent first)
        hosaSubmissions.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return dateB - dateA; // Descending order (newest first)
        });

        // Get the most recent submission
        const hosaSubmission = hosaSubmissions[0];

        if (hosaSubmission) {
            displayHosaInfo(hosaSubmission);
        }
    } catch (error) {
        console.error('Error fetching HOSA data:', error);
    }
}

function displayHosaInfo(submission) {
    const answers = submission.answers;
    
    // Update description if available
    if (answers['18']?.answer) {
        const descriptionElement = document.querySelector('#HOSA p');
        if (descriptionElement) {
            // Strip HTML tags from the description
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = answers['18'].answer;
            const cleanDescription = tempDiv.textContent || tempDiv.innerText;
            
            // Convert URLs to clickable links
            descriptionElement.innerHTML = linkify(cleanDescription);
        }
    }

    // Update advisors if available
    if (answers['26']?.answer) {
        let advisorsSection = document.getElementById('hosa-advisors');
        if (!advisorsSection) {
            // Create advisors section if it doesn't exist
            const hosaSection = document.getElementById('HOSA');
            advisorsSection = document.createElement('div');
            advisorsSection.id = 'hosa-advisors';
            hosaSection.appendChild(advisorsSection);
        }
        
        advisorsSection.innerHTML = `
            <h2>Advisors</h2>
            <p>${linkify(answers['26'].answer)}</p>
        `;
    }

    // Display officers if available (field 33 for HOSA)
    if (answers['33']?.answer && Array.isArray(answers['33'].answer)) {
        displayOfficers(answers['33']);
    }
}

// Helper function to convert URLs to clickable links
function linkify(text) {
    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    
    return text.replace(urlRegex, function(url) {
        let href = url;
        // Add https:// if the URL starts with www.
        if (url.startsWith('www.')) {
            href = 'https://' + url;
        }
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
}

function displayOfficers(officerData) {
    let officersSection = document.getElementById('hosa-officers');
    if (!officersSection) {
        // Create officers section if it doesn't exist
        const hosaSection = document.getElementById('HOSA');
        officersSection = document.createElement('div');
        officersSection.id = 'hosa-officers';
        hosaSection.appendChild(officersSection);
    }

    // Parse the officer data
    // Field 32 structure: dcolumns defines columns (President, VP, Treasurer, Secretary)
    // answer is a 2D array where rows are AM/PM and columns are the positions
    const positions = ['President', 'Vice President', 'Treasurer', 'Secretary'];
    const officers = officerData.answer;

    let html = '<h2>Student Officers</h2><div class="officers-grid">';
    
    // Assuming first row (AM) contains the current officers
    if (officers.length > 0 && officers[0].length > 0) {
        officers[0].forEach((name, index) => {
            if (name && index < positions.length) {
                html += `
                    <div class="officer-card">
                        <h3>${positions[index]}</h3>
                        <p>${name}</p>
                    </div>
                `;
            }
        });
    }

    html += '</div>';
    officersSection.innerHTML = html;
}

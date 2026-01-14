window.onload = function() {

    // Add loading states
    document.getElementById('fullEventName').classList.add('loading');
    document.getElementById('eventOrganization').classList.add('loading');
    document.getElementById('fullEventDate').classList.add('loading');
    document.getElementById('eventTime').classList.add('loading');
    document.getElementById('eventLocation').classList.add('loading');
    document.getElementById('fullDescription').classList.add('loading');

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    fetch('/auth/signin')
        .then(response => response.json())


    fetch('/getJotFormData')
        .then(response => response.json())
        .then(data => {

            const events = data.content
            .filter(submission =>
                submission.status !== "DELETED")
            .filter(submission =>
                submission.answers['13']?.answer === 'New Events')
            .filter(submission => {
                const dateType = submission.answers['41']?.answer || 'Single Day (Happens Once)';
                if (dateType === 'Range of dates') {
                    return submission.answers['45']?.answer && submission.answers['46']?.answer && submission.answers['5']?.answer && submission.answers['7']?.answer;
                } else {
                    return submission.answers['1']?.answer && submission.answers['5']?.answer && submission.answers['7']?.answer;
                }
            })


            const targetEvent = events.find(submission => submission.id === eventId);
            
            if (targetEvent) {
                displayEventDetails(targetEvent);
            } else {
                // Handle event not found
                document.getElementById('fullEventName').textContent = 'Event Not Found';
                document.getElementById('fullEventName').classList.remove('loading');
                document.getElementById('eventOrganization').textContent = '';
                document.getElementById('fullEventDate').textContent = '';
                document.getElementById('eventTime').textContent = '';
                document.getElementById('eventLocation').textContent = '';
                document.getElementById('fullDescription').textContent = 'The requested event could not be found.';
                document.getElementById('fullDescription').classList.remove('loading');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('fullEventName').textContent = 'Error Loading Event';
            document.getElementById('fullEventName').classList.remove('loading');
            document.getElementById('fullDescription').textContent = 'There was an error loading the event details. Please try again later.';
            document.getElementById('fullDescription').classList.remove('loading');
        });
};

// Function to create document elements with appropriate icons and download links
function createDocumentElement(fileUrl, fileExtension, index) {
    const docContainer = document.createElement('div');
    docContainer.className = 'document-item';
    
    // Create icon based on file type
    const icon = document.createElement('div');
    icon.className = 'document-icon';
    
    let iconSvg = '';
    switch (fileExtension) {
        case 'pdf':
            iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 2H15.5L19 5.5V22H5V2H8.5Z" fill="#DC2626"/>
                <path d="M15.5 2V5.5H19" fill="#DC2626"/>
                <text x="12" y="15" text-anchor="middle" fill="white" font-family="Arial" font-size="8" font-weight="bold">PDF</text>
            </svg>`;
            break;
        case 'doc':
        case 'docx':
            iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 2H15.5L19 5.5V22H5V2H8.5Z" fill="#2563EB"/>
                <path d="M15.5 2V5.5H19" fill="#2563EB"/>
                <text x="12" y="15" text-anchor="middle" fill="white" font-family="Arial" font-size="6" font-weight="bold">DOC</text>
            </svg>`;
            break;
        case 'xls':
        case 'xlsx':
            iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 2H15.5L19 5.5V22H5V2H8.5Z" fill="#16A34A"/>
                <path d="M15.5 2V5.5H19" fill="#16A34A"/>
                <text x="12" y="15" text-anchor="middle" fill="white" font-family="Arial" font-size="6" font-weight="bold">XLS</text>
            </svg>`;
            break;
        case 'csv':
            iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 2H15.5L19 5.5V22H5V2H8.5Z" fill="#CA8A04"/>
                <path d="M15.5 2V5.5H19" fill="#CA8A04"/>
                <text x="12" y="15" text-anchor="middle" fill="white" font-family="Arial" font-size="6" font-weight="bold">CSV</text>
            </svg>`;
            break;
        default:
            iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 2H15.5L19 5.5V22H5V2H8.5Z" fill="#6B7280"/>
                <path d="M15.5 2V5.5H19" fill="#6B7280"/>
                <text x="12" y="15" text-anchor="middle" fill="white" font-family="Arial" font-size="6" font-weight="bold">FILE</text>
            </svg>`;
    }
    
    icon.innerHTML = iconSvg;
    
    // Extract filename from URL for display
    const urlParts = fileUrl.split('/');
    const filename = urlParts[urlParts.length - 1] || `Document ${index}`;
    
    // Create download link
    const link = document.createElement('a');
    // For documents, link directly to avoid proxy issues with PDFs
    link.href = fileUrl;
    link.download = filename;
    link.className = 'document-link';
    link.target = '_blank';
    
    link.innerHTML = `
        <span class="document-name">${filename}</span>
        <span class="document-size">${fileExtension.toUpperCase()}</span>
    `;
    
    // Add click tracking
    link.addEventListener('click', function(e) {
        console.log(`Downloading document: ${filename}`);
    });
    
    docContainer.appendChild(icon);
    docContainer.appendChild(link);
    
    return docContainer;
}

function displayEventDetails(event) {
    const answers = event.answers;

    const eventName = answers['5'].answer;
    const dateType = answers['41']?.answer || 'Single Day (Happens Once)';
    
    // Add recurring indicator to name
    if (dateType === 'Reoccuring (Monthly)' || dateType === 'Recurring (Monthly)') {
        document.getElementById('fullEventName').textContent = eventName + " 🔄";
    } else {
        document.getElementById('fullEventName').textContent = eventName;
    }
    document.getElementById('fullEventName').classList.remove('loading');
    
    let eventDateText = '';
    let timeData = null;
    
    if (dateType === 'Range of dates') {
        const startData = answers['45'].answer;
        const endData = answers['46'].answer;
        const startDate = new Date(parseInt(startData.year), parseInt(startData.month) - 1, parseInt(startData.day));
        const endDate = new Date(parseInt(endData.year), parseInt(endData.month) - 1, parseInt(endData.day));
        eventDateText = `${startDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })} - ${endDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`;
        timeData = startData; // assume same time
    } else if (dateType === 'Reoccuring (Monthly)' || dateType === 'Recurring (Monthly)') {
        // For recurring events, show the original date with a note
        const dateData = answers['1'].answer;
        const eventDate = new Date(parseInt(dateData.year), parseInt(dateData.month) - 1, parseInt(dateData.day));
        eventDateText = `${eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })} (Recurs Monthly)`;
        timeData = dateData;
    } else {
        const dateData = answers['1'].answer;
        const eventDate = new Date(parseInt(dateData.year), parseInt(dateData.month) - 1, parseInt(dateData.day));
        eventDateText = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        timeData = dateData;
    }
    
    document.getElementById('fullEventDate').textContent = eventDateText;
    document.getElementById('fullEventDate').classList.remove('loading');
    
    // Extract time
    if (timeData && timeData.hour && timeData.min) {
        let hour = parseInt(timeData.hour);
        let minutes = timeData.min.toString().padStart(2, '0');
        const ampm = timeData.ampm || (hour >= 12 ? 'PM' : 'AM');
        
        if (timeData.ampm) {
            hour = parseInt(timeData.hour);
        } else {
            hour = hour % 12 || 12;
        }
        
        const timeString = `${hour}:${minutes} ${ampm}`;
        document.getElementById('eventTime').textContent = timeString;
    } else {
        document.getElementById('eventTime').textContent = 'Time TBA';
    }
    document.getElementById('eventTime').classList.remove('loading');
    switch(answers['37'].answer){
        case 'East (Oley)':
            document.getElementById('eventLocation').textContent = 'East (Oley)';
            break;
        case 'West (Leesport)':
            document.getElementById('eventLocation').textContent = 'West (Leesport)';
            break;
        case 'Both':
            document.getElementById('eventLocation').textContent = 'Both';
            break;
        case 'Other':
            if (answers['29']?.answer) {
                const address = answers['29'].answer;
                const locationParts = [];
                
                if (address.addr_line1) locationParts.push(address.addr_line1);
                if (address.city) locationParts.push(address.city);
                if (address.state) locationParts.push(address.state.toUpperCase());
                if (address.postal) locationParts.push(address.postal);
                
                    const locationString = locationParts.join(', ');
                    document.getElementById('eventLocation').textContent = locationString || 'Location TBA';
                } 
            else {
                document.getElementById('eventLocation').textContent = 'Location TBA';
            }
            
            break;  
    }
    document.getElementById('eventLocation').classList.remove('loading');
    
    // Extract full description (field 7) and strip HTML
    let fullDesc = answers['7'].answer;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullDesc;
    fullDesc = tempDiv.textContent || tempDiv.innerText || fullDesc;
    
    // For multi-day events, the description might have range info added, but we want the original
    // The range info is added in calendar.js, so here we show the original description
    document.getElementById('fullDescription').textContent = fullDesc;
    document.getElementById('fullDescription').classList.remove('loading');
    
    // Extract brief summary (field 14)
    if (answers['14']?.answer) {
        const briefSummary = answers['14'].answer;
        // You could display this somewhere if needed
    }
    
    // Extract which CTSO (field 17)
    if (answers['17']?.answer) {
        document.getElementById('eventOrganization').textContent = answers['17'].answer;
        document.getElementById('eventOrganization').classList.remove('loading');
    } else {
        document.getElementById('eventOrganization').textContent = 'General Event';
        document.getElementById('eventOrganization').classList.remove('loading');
    }
    
    // Extract images and documents from file upload fields
    const fileFields = ['31']; // Add more field IDs if there are other file upload fields
    let hasImages = false;
    let hasDocuments = false;
    
    fileFields.forEach(fieldId => {
        if (answers[fieldId]?.answer && Array.isArray(answers[fieldId].answer) && answers[fieldId].answer.length > 0) {
            answers[fieldId].answer.forEach((fileUrl, index) => {
                // Determine file type from URL or extension
                const fileExtension = fileUrl.split('.').pop().toLowerCase();
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension);
                
                if (isImage) {
                    // Handle as image
                    if (!hasImages) {
                        const imageGallery = document.getElementById('eventImages');
                        const imagesSection = document.getElementById('imagesSection');
                        imageGallery.innerHTML = '';
                        hasImages = true;
                    }
                    
                    console.log(`Loading image ${index + 1} from field ${fieldId}:`, fileUrl);
                    
                    const img = document.createElement('img');
                    // Try loading directly first, fallback to proxy if needed
                    img.src = fileUrl;
                    img.alt = `Event image ${index + 1}`;
                    img.className = 'event-image';
                    
                    img.onerror = function() {
                        console.log('Direct load failed, trying proxy for:', fileUrl);
                        // Fallback to proxy if direct load fails
                        this.src = `/proxy-file?url=${encodeURIComponent(fileUrl)}`;
                        this.onerror = function() {
                            console.error('Failed to load image via proxy:', fileUrl);
                            this.src = 'data:image/svg+xml;base64,' + btoa(`
                                <svg width="280" height="200" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="100%" height="100%" fill="#1a5a62"/>
                                    <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#c2f5ff" font-family="Arial" font-size="14">Image Failed to Load</text>
                                </svg>
                            `);
                            this.style.opacity = '0.6';
                        };
                    };
                    
                    img.onload = function() {
                        console.log('Successfully loaded image:', fileUrl);
                    };
                    
                    document.getElementById('eventImages').appendChild(img);
                } else {
                    // Handle as document
                    if (!hasDocuments) {
                        const docGallery = document.getElementById('eventDocuments');
                        const docsSection = document.getElementById('documentsSection');
                        if (docGallery && docsSection) {
                            docGallery.innerHTML = '';
                            hasDocuments = true;
                        }
                    }
                    
                    console.log(`Loading document ${index + 1} from field ${fieldId}:`, fileUrl);
                    
                    const docElement = createDocumentElement(fileUrl, fileExtension, index + 1);
                    if (docElement) {
                        document.getElementById('eventDocuments').appendChild(docElement);
                    }
                }
            });
        }
    });
    
    // Show/hide sections based on content
    const imagesSection = document.getElementById('imagesSection');
    const docsSection = document.getElementById('documentsSection');
    
    if (imagesSection) {
        imagesSection.style.display = hasImages ? 'block' : 'none';
    }
    if (docsSection) {
        docsSection.style.display = hasDocuments ? 'block' : 'none';
    }
    
    if (!hasImages && !hasDocuments) {
        console.log('No files found for this event');
    }
    
    // Handle additional info section
    const additionalInfoSection = document.getElementById('additionalInfoSection');
    const additionalInfo = document.getElementById('additionalInfo');
    
    // You can add logic here to populate additional info if needed
    // For now, we'll hide it if empty
    if (additionalInfo.textContent.trim() === '') {
        additionalInfoSection.style.display = 'none';
    } else {
        additionalInfoSection.style.display = 'block';
    }
}
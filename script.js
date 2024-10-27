// Dictionary to hold job postings and applicants
const jobApplicants = {};

// Toggle between company and applicant views
function toggleView() {
    const companyView = document.getElementById('companyView');
    const applicantView = document.getElementById('applicantView');
    const toggleButton = document.getElementById('toggleViewButton');

    if (companyView.style.display === 'none') {
        companyView.style.display = 'block';
        applicantView.style.display = 'none';
        toggleButton.textContent = 'Switch to Applicant View';
        populateCompanyView();
    } else {
        companyView.style.display = 'none';
        applicantView.style.display = 'block';
        toggleButton.textContent = 'Switch to Company View';
        populateApplicantView();
    }
}

// Populate company view with job postings and applicants
function populateCompanyView() {
    const jobList = document.getElementById('jobList');
    jobList.innerHTML = '';

    Object.keys(jobApplicants).forEach(jobTitle => {
        const jobDetails = jobApplicants[jobTitle];
        const jobCard = document.createElement('div');
        jobCard.className = 'job-posting';
        jobCard.innerHTML = `
            <h3>${jobTitle}</h3>
            <p>${jobDetails.description}</p>
            <p>Company: ${jobDetails.company}</p>
            <p>Location: ${jobDetails.location}</p>
            <ul class="applicantList"></ul>
        `;
        jobList.appendChild(jobCard);

        displayApplicants(jobTitle, jobCard.querySelector('.applicantList'));
    });
}

// Populate applicant view with available job postings
function populateApplicantView() {
    const applicantJobList = document.getElementById('applicantJobList');
    applicantJobList.innerHTML = '';

    Object.keys(jobApplicants).forEach(jobTitle => {
        const jobDetails = jobApplicants[jobTitle];
        const jobCard = document.createElement('div');
        jobCard.className = 'job-posting';
        jobCard.innerHTML = `
            <h3>${jobTitle}</h3>
            <p>${jobDetails.description}</p>
            <p>Company: ${jobDetails.company}</p>
            <p>Location: ${jobDetails.location}</p>
            <h4>Apply</h4>
            <input type="text" placeholder="Applicant Name" class="applicantName" required>
            <input type="file" accept=".pdf" class="applicantResume" required>
            <button class="applyButton">Apply</button>
        `;
        applicantJobList.appendChild(jobCard);

        // Event listener for applying to a job
        jobCard.querySelector('.applyButton').addEventListener('click', () => {
            const applicantName = jobCard.querySelector('.applicantName').value;
            const applicantResume = jobCard.querySelector('.applicantResume').files[0];

            if (applicantName && applicantResume && applicantResume.type === "application/pdf") {
                submitApplication(jobTitle, applicantName, applicantResume);
                jobCard.querySelector('.applicantName').value = '';
                jobCard.querySelector('.applicantResume').value = '';
            } else {
                alert('Please provide a name and a valid PDF resume.');
            }
        });
    });
}

// Display applicants for a specific job title
function displayApplicants(jobTitle, applicantListDiv) {
    const applicants = jobApplicants[jobTitle].applicants || [];
    applicants.sort((a, b) => {
        // Extract numeric scores from strings
        const scoreA = parseInt(a.score); // Assuming 'a.score' is a string like "90%"
        const scoreB = parseInt(b.score); // Assuming 'b.score' is a string like "55%"
        return scoreB - scoreA; // Sort in descending order
    });
    applicantListDiv.innerHTML = '';

    applicants.forEach(applicant => {
        const li = document.createElement('li');
        const scoreLink = document.createElement('a');
        scoreLink.href = `/create_pdf?score=${applicant.score}&details=${encodeURIComponent(applicant.matchDetails)}&name=${encodeURIComponent(applicant.name)}`;
        scoreLink.textContent = `${applicant.score}`;
        scoreLink.target = "_blank"; // Open PDF in a new tab
        
        const verificationScoreLink = document.createElement('a');
        verificationScoreLink.href = `/create_pdf?score=${applicant.factCheck}&details=${encodeURIComponent(applicant.checkDetails)}&name=${encodeURIComponent(applicant.name)}`;
        verificationScoreLink.textContent = `${applicant.factCheck}`;
        verificationScoreLink.target = "_blank"; // Open PDF in a new tab
        
        // Append everything to the list item
        li.textContent = `${applicant.name} - Score: `;
        li.appendChild(scoreLink);
        li.appendChild(document.createTextNode(' | Verification: '));
        li.appendChild(verificationScoreLink);
        
        const resumeLink = document.createElement('a');
        resumeLink.href = applicant.resume;
        resumeLink.target = "_blank";
        resumeLink.textContent = "View Resume";
        li.appendChild(document.createTextNode(' | '));
        li.appendChild(resumeLink);
        
        
        applicantListDiv.appendChild(li);
    });
}

// Implementations for displayMatchDetails and displayCheckDetails
function displayMatchDetails(details) {
    // Create a modal or any other UI to show match details
    alert(`Match Details: ${JSON.stringify(details)}`); // Replace with actual implementation
}

function displayCheckDetails(details) {
    // Create a modal or any other UI to show check details
    alert(`Check Details: ${JSON.stringify(details)}`); // Replace with actual implementation
}


// Submit an application to the backend for ranking
function submitApplication(jobTitle, applicantName, applicantResume) {
    const formData = new FormData();
    formData.append('applicantName', applicantName);
    formData.append('applicantResume', applicantResume);
    formData.append('jobDescription', jobApplicants[jobTitle].description);


    fetch('http://localhost:5000/process_resume', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert("Application submitted successfully!");

            // Add applicant data to the job title's applicants list
            if (!jobApplicants[jobTitle].applicants) {
                jobApplicants[jobTitle].applicants = [];
            }
            const applicantData = {
                name: applicantName,
                score: data.job_match_score, // Assuming you want the first value from the array
                resume: URL.createObjectURL(applicantResume), // For demo only
                factCheck: data.fact_check_response, // First value of the fact check response
                matchDetails: data.match_details, // Full match details
                checkDetails: data.check_details // Full check details
            };
            
            jobApplicants[jobTitle].applicants.push(applicantData);

            populateCompanyView();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('There was an error submitting the application.');
    });
}

function toggleDescription(fullDescriptionId, shortDescriptionId, button) {
    const fullDescription = document.getElementById(fullDescriptionId);
    const shortDescription = document.getElementById(shortDescriptionId);

    if (fullDescription.style.display === "none") {
        fullDescription.style.display = "block"; // Show full description
        shortDescription.style.display = "none"; // Hide short description
        button.textContent = "Show Less"; // Change button text
    } else {
        fullDescription.style.display = "none"; // Hide full description
        shortDescription.style.display = "block"; // Show short description
        button.textContent = "Show More"; // Change button text
    }
}
// Add a new job posting
document.getElementById('jobForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const jobTitle = document.getElementById('jobTitle').value;
    const companyName = document.getElementById('companyName').value;
    const location = document.getElementById('location').value;
    const jobDescription = document.getElementById('jobDescription').value;

    if (!jobApplicants[jobTitle]) {
        jobApplicants[jobTitle] = {
            description: jobDescription,
            company: companyName,
            location: location,
            applicants: []
        };
    }

    populateCompanyView();
    populateApplicantView();
    document.getElementById('jobForm').reset();
});

// Toggle views when the button is clicked
document.getElementById('toggleViewButton').addEventListener('click', toggleView);

// Initial population of views
populateCompanyView();
populateApplicantView();


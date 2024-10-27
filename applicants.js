// Sample applicants storage from the main page
const jobApplicants = {};

// On window load
window.onload = function() {
    // Get the job title and description from the URL
    const params = new URLSearchParams(window.location.search);
    const jobTitle = params.get('jobTitle');
    const jobDescription = params.get('jobDescription');

    // Set "No job description" if the description is empty or undefined
    if (!jobDescription) {
        jobDescription = "No job description";
    }
    // Set the job title and description in the header
    document.getElementById('jobTitle').textContent = jobTitle;
    document.getElementById('jobDescription').textContent = jobDescription;

    // Initialize the applicants array for this job if it doesn't exist
    if (!jobApplicants[jobTitle]) {
        jobApplicants[jobTitle] = [];
    }

    // Populate the applicant list
    displayApplicants(jobTitle);

    // Event listener for the applicant button
    document.getElementById('addApplicantButton').addEventListener('click', function () {
        const applicantName = document.getElementById('applicantName').value;
        const applicantScore = document.getElementById('applicantScore').value;

        // Validate inputs
        if (applicantName && applicantScore) {
            // Add the applicant to the current job's applicants
            jobApplicants[jobTitle].push({
                name: applicantName,
                score: Number(applicantScore),
            });

            // Sort applicants by score in descending order
            jobApplicants[jobTitle].sort((a, b) => b.score - a.score);

            // Reset the form
            document.getElementById('applicantName').value = '';
            document.getElementById('applicantScore').value = '';

            // Display updated applicants
            displayApplicants(jobTitle);
        }
    });
};

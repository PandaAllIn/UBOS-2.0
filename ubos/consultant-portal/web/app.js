
document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login');
    const dashboardSection = document.getElementById('dashboard');
    const loginButton = document.getElementById('loginButton');
    const apiKeyInput = document.getElementById('apiKey');
    const analyzeButton = document.getElementById('analyzeButton');
    const opportunityInput = document.getElementById('opportunity');
    const analysisResult = document.getElementById('analysisResult');

    loginButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            // In a real app, you would validate the API key against a backend service
            localStorage.setItem('eufmApiKey', apiKey);
            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            // You would also fetch and display customer data here
        } else {
            alert('Please enter an API key.');
        }
    });

    analyzeButton.addEventListener('click', async () => {
        const opportunity = opportunityInput.value.trim();
        const apiKey = localStorage.getItem('eufmApiKey');
        if (!opportunity) {
            alert('Please paste an opportunity to analyze.');
            return;
        }

        analysisResult.textContent = 'Analyzing...';

        try {
            const response = await fetch('/api/eufm/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify({ opportunity })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Analysis failed');
            }

            const result = await response.json();
            analysisResult.textContent = result.output;
        } catch (error) {
            analysisResult.textContent = `Error: ${error.message}`;
        }
    });

    // Check if user is already logged in
    if (localStorage.getItem('eufmApiKey')) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
    }
});

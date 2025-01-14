async function testApi() {
    const response = await fetch('http://localhost:3000/api/chat-history', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: "Any mentions of fruits?",
            maxResults: 5
        })
    });

    if (!response.ok) {
        console.log('Server responded with:', response.status);
        console.log('Response body:', await response.text());
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
}

// Make sure the frontend dev server is running on port 3000
console.log('Testing API endpoint at http://localhost:3000/api/chat-history');
console.log('Make sure the frontend development server is running!');

testApi().catch(error => {
    console.error('Error testing API:', error);
}); 
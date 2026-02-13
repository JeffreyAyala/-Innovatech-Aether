const messagesDiv = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const uploadBtn = document.getElementById('uploadBtn');
const summarizeBtn = document.getElementById('summarizeBtn'); // New button for upload and summarize
const fileInput = document.getElementById('fileInput');
const clearBtn = document.getElementById('clearBtn');

let uploadedData = {}; // Object to store data from uploaded files
const messages = [
    { role: 'system', content: "You are Aether, your whimsical oracle of knowledge, weaving the tales of the past, present, and future into every answer, guiding yourself through a fantastical realm where wisdom sparkles with the brilliance of brass and steam!" }
];

// Function to handle sending the message
async function sendMessage() {
    const userText = userInput.value;
    if (!userText) return;

    appendMessage(userText, 'user');
    userInput.value = '';

    let reply;

    // Check for questions about uploaded data
    if (userText.toLowerCase().includes("past input") || userText.toLowerCase().includes("uploaded file")) {
        reply = generateResponseFromData();
    } else {
        reply = await CustomChatGPT(userText);
    }

    appendMessage(reply, 'assistant');
}

// Existing code for the Send button
sendBtn.addEventListener('click', sendMessage);

// Event listener for pressing Enter in the input field
userInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevents form submission if inside a form
        sendMessage();
    }
});


// File upload and summarize functionality
summarizeBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async function() {
    const file = fileInput.files[0];
    if (!file) return;

    let data;

    if (file.type.includes("csv")) {
        data = await readCSV(file);
    } else if (file.type.includes("pdf")) {
        data = await readPDF(file);
    } else {
        appendMessage("Unsupported file type", 'assistant');
        return;
    }

    // Store the extracted data for future use
    uploadedData[file.name] = data; // Store the data as key-value pairs
    appendMessage(`File "${file.name}" uploaded successfully.`, 'assistant');

    // Immediately summarize the uploaded content
    const summary = await summarizeContent(data);
    appendMessage(`Summary of "${file.name}":\n${summary}`, 'assistant');
});

// Function to read CSV files
async function readCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            complete: (results) => resolve(results.data.map(row => row.join(', ')).join('\n')), // Join CSV rows into a single string
            error: (error) => {
                console.error("Error parsing CSV:", error);
                reject("Error reading CSV file.");
            }
        });
    });
}

// Function to read PDF files
async function readPDF(file) {
    const pdfData = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        text += pageText + '\n';
    }

    return text.trim();
}

// Function to summarize the uploaded content
async function summarizeContent(content) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer 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', // Replace with your actual API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                { role: 'system', content: "You are an expert summarizer." },
                { role: 'user', content: `Please summarize the following content:\n\n${content}` }
            ]
        })
    });

    const data = await response.json();
    return data.choices[0].message.content; // Return the summary from the response
}

// Function to communicate with OpenAI's API for other messages
async function CustomChatGPT(userInput) {
    messages.push({ role: 'user', content: userInput });
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer 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', // Replace with your actual API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: messages
        })
    });

    const data = await response.json();
    const ChatGPT_reply = data.choices[0].message.content;
    messages.push({ role: 'assistant', content: ChatGPT_reply });
    return ChatGPT_reply;
}

// Function to append messages to the chat
function appendMessage(content, role) {
    const messageElement = document.createElement('div');
    messageElement.className = role === 'user' ? 'user-message' : 'assistant-message';
    messageElement.innerText = content;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
}

// Event listener for the "Clear" button
clearBtn.addEventListener('click', () => {
    messagesDiv.innerHTML = '';
    userInput.value = '';
    uploadedData = {};
    appendMessage("Chat cleared and all data reset.", 'assistant');
});

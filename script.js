/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// System prompt for the chatbot
const systemPrompt =
  "You are a helpful assistant for L’Oréal. Only answer questions about L’Oréal products, skincare, haircare, beauty routines, and recommendations. If asked about anything else, politely say you can only help with L’Oréal-related topics.";

// Store the conversation as an array of messages
let messages = [{ role: "system", content: systemPrompt }];

// Set initial message
chatWindow.innerHTML = `<div class="msg ai">👋 Hello! How can I help you with L’Oréal products or routines today?</div>`;

// Variable to store user's name if provided
let userName = "";

// Function to try to extract user's name from their message
function extractName(text) {
  // Simple check for "My name is ..." or "I'm ..."
  const nameMatch =
    text.match(/my name is (\w+)/i) || text.match(/i['’]?m (\w+)/i);
  if (nameMatch) {
    return nameMatch[1];
  }
  return null;
}

// Function to add a message to the chat window
function addMessage(role, text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${role}`;
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
}

// Add a new element above the chat window to show the latest question
let latestQuestionDiv = document.createElement("div");
latestQuestionDiv.id = "latestQuestion";
latestQuestionDiv.style.display = "none"; // Hidden by default
latestQuestionDiv.style.marginBottom = "10px";
latestQuestionDiv.style.fontWeight = "bold";
latestQuestionDiv.style.background = "#fffbe7";
latestQuestionDiv.style.padding = "10px 16px";
latestQuestionDiv.style.borderRadius = "12px";
latestQuestionDiv.style.border = "1px solid #ffe082";
chatWindow.parentNode.insertBefore(latestQuestionDiv, chatWindow);

function showLatestQuestion(text) {
  latestQuestionDiv.textContent = `You asked: ${text}`;
  latestQuestionDiv.style.display = "block";
}

function clearLatestQuestion() {
  latestQuestionDiv.textContent = "";
  latestQuestionDiv.style.display = "none";
}

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user input and clear the input box
  const userText = userInput.value.trim();
  if (!userText) return;
  userInput.value = "";

  // Show the latest question above the chat window
  showLatestQuestion(userText);

  // Try to extract user's name and remember it
  const possibleName = extractName(userText);
  if (possibleName) {
    userName = possibleName;
  }

  // Show user's message
  addMessage("user", userText);

  // Add user's message to conversation
  messages.push({ role: "user", content: userText });

  // If we have the user's name, remind the assistant in the context
  if (userName) {
    messages.push({
      role: "system",
      content: `The user's name is ${userName}. Remember to use their name in your replies when appropriate.`,
    });
  }

  // Show loading message
  addMessage("ai", "Thinking...");

  try {
    // Send request to OpenAI API (replace URL with your Cloudflare Worker endpoint if needed)
    const response = await fetch("https://loreal-prj8.drewlynntaylor.workers.dev",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Use your OpenAI API key from secrets.js (for local dev only)
          //Authorization: `Bearer ${openai_api_key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: messages,
          max_tokens: 300,
        }),
      }
    );

    const data = await response.json();
    // Get the assistant's reply
    const aiText =
      data.choices && data.choices[0].message.content
        ? data.choices[0].message.content.trim()
        : "Sorry, I couldn't get a response. Please try again.";

    // Remove the loading message
    const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
    if (loadingMsg && loadingMsg.textContent === "Thinking...") {
      chatWindow.removeChild(loadingMsg);
    }

    // Show assistant's reply
    addMessage("ai", aiText);

    // Add assistant's reply to conversation
    messages.push({ role: "assistant", content: aiText });

    // After assistant replies, keep the latest question visible until next question
    // (No action needed here, as it resets on next submit)
  } catch (error) {
    // Remove the loading message
    const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
    if (loadingMsg && loadingMsg.textContent === "Thinking...") {
      chatWindow.removeChild(loadingMsg);
    }
    addMessage("ai", "Sorry, there was a problem connecting to the chatbot.");
  }
});

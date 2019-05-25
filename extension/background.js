/* GLOBALS */

// For calling GET and SET to the extension's local storage
const storage = chrome.storage.local;

// Sends a message to content scripts running in the current tab
const message = content => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    let activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, content);
  });
};

// TEMP: For testing only
storage.set({
  "This is a smart reply.": {
    subjectFreqMap: { keyword1: 1, keyword2: 12 },
    emailFreqMap: { keyword1: 1, keyword2: 12 },
    authors: [],
    coOccurringSmartReplies: [],
    content: ""
  },
  "This is another smart reply.": {
    subjectFreqMap: { keyword1: 1, keyword2: 12 },
    emailFreqMap: { keyword1: 1, keyword2: 12 },
    authors: [],
    coOccurringSmartReplies: [],
    content: ""
  }
});

/* Event Handlers */

// Listens for gmail.com to be loaded and tells listeners.js to inject the
// event handlers
chrome.webNavigation.onCompleted.addListener(details => {
  if (details.url.includes("mail.google.com")) {
    message({ message: "injectPayload" });
  }
});

// DEBUG: Listens for when the extension is first installed or updated
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason == "install") {
    console.log(
      "User has installed Smart(er) Replies for the first time on this device."
    );
  } else if (details.reason == "update") {
    let thisVersion = chrome.runtime.getManifest().version;
    console.log(
      "Updated from " + details.previousVersion + " to " + thisVersion + " :)"
    );
  }
});

// Opens long-lived port connections with content scripts
chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(msg => {
    // Handles requests from listeners.js
    if (port.name == "listener") {
      // TODO: Ordering of custom smart replies (do this later)
      // Get everything from storage.
      // Create TF-IDF-based BoW vectors for each Smart Reply's frequency map.
      // Measure cosine similarity between the vector for msg["frequencyMap"]
      // and each Smart Reply's vector.
      // Order Smart Replies based on decreasing similarity.
      // ...
      // Also check if the email author is in the Smart Reply's list of known
      // authors.
      // Place more weight on the subject line than the email content.

      storage.get(); // TODO: Get all items in storage
    }
  });
});

/***********
 * HELPERS *
 ***********/

const injectJSPayload = (payload, args = "") => {
  // Injecting scraper JS payload
  let script = document.createElement("script");
  script.textContent = `(${payload.toString()})(${JSON.stringify(args)})`;
  document.head.appendChild(script);
};

/************
 * PAYLOADS *
 ************/

const scraperPayload = () => {
  let currentURL = window.location.href;

  setInterval(() => {
    let newURL = window.location.href;

    if (currentURL != newURL) {
      // URL change
      currentURL = newURL;

      let subdomain = newURL.split("mail.google.com/mail/u/0/#")[1];
      let emailHash = subdomain.split("/")[1];

      // An email is open
      if (emailHash) {
        let smartReplies = Array.from(document.getElementsByClassName("bra"));

        // Smart Reply elements are present
        if (typeof smartReplies !== "undefined" && smartReplies.length > 0) {
          let receivedEmailAuthor = document.getElementsByClassName("go")[0];
          let receivedEmailSubject = document.getElementsByClassName("hP")[0];
          let receivedEmail = document.getElementsByClassName("a3s aXjCH ")[0];

          // Send scraped email content to the content script
          window.postMessage(
            {
              title: "scrapedEmailContent",
              value: {
                author: receivedEmailAuthor.innerText
                  .replace("<", "")
                  .replace(">", ""),
                subject: receivedEmailSubject.innerText,
                email: receivedEmail.innerText,
                smartReplies: smartReplies.map(reply => reply.innerText)
              }
            },
            "*"
          );
        }
      }
    }
  }, 500);
};

const customSmartReplyPayload = smartReplies => {
  const injectEmailIntoContainer = email => {
    let emailContainer = document.getElementsByClassName(
      "Am Al editable LW-avf"
    )[0];
    if (emailContainer !== "undefined" && emailContainer != null) {
      emailContainer.innerText = email;
    } else {
      setTimeout(() => injectEmailIntoContainer(email), 200);
    }
  };

  const createNewSmartElement = (
    html,
    onClick,
    overwriteClickHandler = false,
    appendToContainer = true
  ) => {
    let smartRepliesContainer = document.getElementsByClassName("brb")[0];
    let clonedNode = smartRepliesContainer.lastChild.cloneNode(true);

    clonedNode.innerHTML = html;

    if (overwriteClickHandler) {
      clonedNode.removeAttribute("data-action-index");
    }
    clonedNode.addEventListener("click", onClick, false);

    if (appendToContainer) {
      smartRepliesContainer.appendChild(clonedNode);
    }

    return clonedNode;
  };

  // Creates smart reply HTML elements
  let hiddenSmartReplies = [];
  for (let idx in smartReplies) {
    let label = smartReplies[idx].label,
      email = smartReplies[idx].email;

    if (idx == 0) {
      // Red
      createNewSmartElement(
        `<div style='height: 8px; width: 8px; border-radius: 50%; margin-right: 8px; background-color: #EA526F;'></div><span style='color: #EA526F;'>${label}</span>`,
        () => injectEmailIntoContainer(email)
      );
    } else if (idx == 1) {
      // Green
      createNewSmartElement(
        `<div style='height: 8px; width: 8px; border-radius: 50%; margin-right: 8px; background-color: #35AC1A;'></div><span style='color: #35AC1A;'>${label}</span>`,
        () => injectEmailIntoContainer(email)
      );
    } else {
      // Collapsed Smart Replies
      hiddenSmartReplies.push(
        createNewSmartElement(
          `<div style='height: 8px; width: 8px; border-radius: 50%; margin-right: 8px; background-color: #767676;'></div><span style='color: #767676;'>${label}</span>`,
          () => injectEmailIntoContainer(email),
          false,
          false
        )
      );
    }
  }

  if (hiddenSmartReplies !== undefined && hiddenSmartReplies.length > 0) {
    var isExpanded = false;
    createNewSmartElement(
      `<span style='color: #767676;'>>></span>`,
      event => {
        if (!isExpanded) {
          let smartRepliesContainer = document.getElementsByClassName("brb")[0];
          for (let idx in hiddenSmartReplies) {
            smartRepliesContainer.insertBefore(
              hiddenSmartReplies[idx],
              smartRepliesContainer.childNodes[
                smartRepliesContainer.childNodes.length - 2
              ]
            );
          }

          event.target.innerHTML = `<span style='color: #767676;'><<</span>`; // this.innerHTML ?
          isExpanded = true;
        } else {
          // TODO: Remove or hide all expanded smart replies
        }
      },
      true,
      true
    );
  }

  // TODO: Listen for message from content script to create a new smart reply

  // Creates a "New Custom Smart Reply" button
  createNewSmartElement(
    `<b style='color: #767676;'>＋</b>`,
    () => {
      let canvas = document.createElement("div");
      let createSmartReply = document.createElement("div");

      // TODO: Clean this up by creating a "style" element and appending it to body

      canvas.style.backgroundColor = "rgba(0,0,0,.35)";
      canvas.style.zIndex = "2147483647";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.top = "0px";
      canvas.style.left = "0px";
      canvas.style.display = "block";
      canvas.style.position = "absolute";

      createSmartReply.style.position = "fixed";
      createSmartReply.style.width = "538px";
      createSmartReply.style.height = "333px";
      createSmartReply.style.top = "50%";
      createSmartReply.style.left = "50%";
      createSmartReply.style.marginLeft = "-269px";
      createSmartReply.style.transform = "translateY(-50%)";
      createSmartReply.style.borderRadius = "10px";
      createSmartReply.style.backgroundColor = "#FFFFFF";
      createSmartReply.style.zIndex = "2147483647";

      let defaultTextCSS = `resize: none;\
                        background-color: #edeff1;\
                        border: none;\
                        outline: none;\
                        border-radius: 8px;\
                        padding-left: 12px;\
                        padding-top: 10px;\
                        font-size: 16px;\
                        font-family: sans-serif;\
                        color: #202124;\
                        width: 457px;\
                        display: block;\
                        margin-top: 20px;\
                        margin-left: auto;\
                        margin-right: auto;`;
      let defaultButtonCSS = `border: none;\
                              color: #fff;\
                              font-family: sans-serif;\
                              font-size: 14px;\
                              position: relative;\
                              height: 40px;\
                              border-radius: 5px;\
                              width: 225px;\
                              cursor: pointer;\
                              outline: none;`;
      let labelPlaceholder = "Title";
      let emailPlaceholder = "Your custom email response";

      createSmartReply.innerHTML = `<div id="createSmartReplyHeader" style="color: #FFFFFF; padding-left: 35px; padding-right: 35px; font-weight: 500; display: flex; align-items: center; justify-content: space-between; background-color: #d93025; position: relative; height: 42px; border-radius: 10px 10px 0px 0px;">
                                      <span>Create a smart reply</span>
                                      <a id="exitButton" style="font-weight: 100 !important; font-size: 24px; cursor: pointer;">×</a>
                                    </div>
                                    <div id="createSmartReplyBody">
                                      <textarea id="replyTitle" autofocus required placeholder="${labelPlaceholder}" style="${defaultTextCSS} height: 26px; white-space: nowrap;"></textarea>
                                      <textarea id="replyContent" placeholder="${emailPlaceholder}" style="${defaultTextCSS} height: 120px;"></textarea>
                                    </div>
                                    <div id="createButtons" style="margin-top: 20px; padding-left: 35px; padding-right: 35px; display: flex; align-items: center; justify-content: space-between;">
                                      <button id="createReplyButton" style="${defaultButtonCSS} background-color: #d92f25;">Create</button>
                                      <button id="cancelButton" style="${defaultButtonCSS} background-color: #9a9a9a;">Cancel</button>
                                    </div>`;

      document.body.appendChild(canvas);
      document.body.appendChild(createSmartReply);

      // Form content
      let labelContent = document.getElementById("replyTitle");
      let emailContent = document.getElementById("replyContent");

      // Buttons
      let exitButton = document.getElementById("exitButton");
      let createReplyButton = document.getElementById("createReplyButton");
      let cancelButton = document.getElementById("cancelButton");

      // Changes color of input text to red if title exceeds 30 characters
      labelContent.addEventListener(
        "keyup",
        event => {
          if (event.target.value.length > 30) {
            event.target.style.color = "#d93025";
          } else {
            event.target.style.color = "#202124";
          }
        },
        false
      );

      const exitHandler = () => {
        document.body.removeChild(createSmartReply);
        document.body.removeChild(canvas);
      };

      exitButton.addEventListener("click", exitHandler, false);
      cancelButton.addEventListener("click", exitHandler, false);
      canvas.addEventListener("click", exitHandler, false);

      createReplyButton.addEventListener(
        "click",
        () => {
          window.postMessage({
            title: "newCustomSmartReply",
            value: {
              label: labelContent.value,
              email: emailContent.value
            }
          });
          exitHandler();
        },
        false
      );
    },
    true
  );
};

/*******************
 * MESSAGE PASSING *
 *******************/

// Listens for the "injectScraper" event from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.ping) {
    console.log("Received ping. Sending pong.");
    sendResponse({ pong: true });
    return;
  } else if (request.message === "injectScraper") {
    console.log("Injecting scraper payload.");
    injectJSPayload(scraperPayload);
  }
});

// Opens a long-lived port connection with the background script
const port = chrome.runtime.connect(
  window.localStorage.getItem("smarterreply-id"),
  { name: "mainPort" }
);

port.onMessage.addListener(msg => {
  if (msg.title === "injectSmartReplies") {
    injectJSPayload(customSmartReplyPayload, msg.smartReplies);
  }
});

// Listens for messages from injected scripts
window.addEventListener("message", event => {
  if (event.data.title === "scrapedEmailContent") {
    // Retrieves scraped email content and sends to the background script
    port.postMessage({
      title: "scrapedEmailContent",
      author: event.data.value.author,
      subject: event.data.value.subject,
      email: event.data.value.email,
      smartReplies: event.data.value.smartReplies
    });
  } else if (event.data.title === "newCustomSmartReply") {
    // TODO: Message injection to create a new smart reply
    port.postMessage({
      title: "newCustomSmartReply",
      label: event.data.value.label,
      email: event.data.value.email
    });
  }
});

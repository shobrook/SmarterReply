/***********
 * HELPERS *
 ***********/

const injectJSPayload = (payload, args = "") => {
  // Injects JS into the Gmail frontend
  let script = document.createElement("script");
  script.textContent = `(${payload.toString()})(${JSON.stringify(args)})`;
  document.head.appendChild(script);
};

/************
 * PAYLOADS *
 ************/

const scraperPayload = () => {
  let smartReplies = Array.from(document.getElementsByClassName("bra"));

  // Smart Reply elements are present
  if (typeof smartReplies !== "undefined" && smartReplies.length > 0) {
    let receivedEmailAuthor = document.getElementsByClassName("gD")[0];
    let receivedEmailSubject = document.getElementsByClassName("hP")[0];
    let receivedEmail = document.getElementsByClassName("a3s aiL ")[0];

    // Send scraped email content to the content script
    window.postMessage(
      {
        title: "scrapedEmailContent",
        value: {
          author: receivedEmailAuthor.innerText
            .replace("<", "")
            .replace(">", ""),
          subject: receivedEmailSubject.innerText,
          email: receivedEmail.innerText
          // smartReplies: smartReplies.map(reply => reply.innerText)
        }
      },
      "*"
    );
  }
};

const customSmartReplyPayload = smartReplies => {
  let defaultReplyClass = document
    .getElementsByClassName("brb")[0]
    .firstChild.getAttribute("class");

  const preventDuplicateButtons = buttonClass => {
    let buttonElements = Array.from(
      document.getElementsByClassName(`${defaultReplyClass} ${buttonClass}`)
    );
    for (let index in buttonElements) {
      document.getElementsByClassName("brb")[0].removeChild(buttonElements[index]);
    }
  }

  // Prevents repeated injections of Smarter Reply elements
  preventDuplicateButtons("customReply");
  preventDuplicateButtons("customButton");

  const injectEmailIntoContainer = email => {
    // Recursively waits for the email draft container to load and injects a
    // Smarter Reply message into the container when it does
    let emailContainer = document.getElementsByClassName(
      "Am Al editable LW-avf"
    )[0];
    if (emailContainer !== undefined && emailContainer != null) {
      emailContainer.innerText = email;
    } else {
      setTimeout(() => injectEmailIntoContainer(email), 200);
    }
  };

  var uniqueSmartReplyId = 0;

  // Smart Elements include Smart(er) Replies, the "Add Smarter Reply" (+) and
  // "Delete Smarter Reply" (-) buttons, and the "Expand Smarter Reply List"
  // (>>) button –– basically any new buttons added to the Smart Reply container
  const createNewSmartElement = (
    html,
    onClick,
    options = {
      overwriteClickHandler: false,
      appendToContainer: true,
      isSmartReply: true
    }
  ) => {
    // Container for existing Smart Replies (created by Gmail)
    let smartRepliesContainer = document.getElementsByClassName("brb")[0];
    // First Smart Reply button
    let clonedNode = smartRepliesContainer.firstChild.cloneNode(true);
    let clonedNodeClass = clonedNode.getAttribute("class");

    if (options.isSmartReply) {
      uniqueSmartReplyId += 1;
      clonedNode.setAttribute("class", clonedNodeClass + " customReply");
      clonedNode.setAttribute("id", `smartReply_${uniqueSmartReplyId}`);
    } else {
      clonedNode.setAttribute("class", clonedNodeClass + " customButton");
    }

    clonedNode.innerHTML = html;

    if (options.overwriteClickHandler) {
      clonedNode.removeAttribute("data-action-index");
    }
    clonedNode.onclick = onClick;
    // clonedNode.addEventListener("click", onClick, false);

    if (options.appendToContainer) {
      smartRepliesContainer.appendChild(clonedNode);
    }

    return clonedNode;
  };

  // Creates smart reply HTML elements
  let hiddenSmartReplies = [];
  for (let idx in smartReplies) {
    let label = smartReplies[idx].label,
      email = smartReplies[idx].email;
    let textColor = "#35AC1A";

    const smartReplyOnClickHandler = () => {
      let receivedAuthor = document.getElementsByClassName("gD")[0];
      let receivedSubject = document.getElementsByClassName("hP")[0];
      let receivedEmail = document.getElementsByClassName("a3s aiL ")[0];

      window.postMessage(
        {
          title: "clickedSmartReply",
          value: {
            smartReplyLabel: label,
            receivedAuthor: receivedAuthor.innerText
              .replace("<", "")
              .replace(">", ""),
            receivedSubject: receivedSubject.innerText,
            receivedEmail: receivedEmail.innerText
          }
        },
        "*"
      );

      injectEmailIntoContainer(email);
    };

    let smartReplyButton;
    if (idx > 1) {
      // Collapsed Smart Replies – if there's more than two then create hidden
      // Smart Replies
      smartReplyButton = createNewSmartElement(
        `<span style='color: ${textColor};'>${label}</span>`,
        smartReplyOnClickHandler,
        {
          overwriteClickHandler: false,
          appendToContainer: false,
          isSmartReply: true
        }
      );
      hiddenSmartReplies.push(smartReplyButton);
    } else {
      smartReplyButton = createNewSmartElement(
        `<span style='color: ${textColor};'>${label}</span>`,
        smartReplyOnClickHandler
      );
    }
  }

  if (hiddenSmartReplies !== undefined && hiddenSmartReplies.length > 0) {
    var isExpanded = false;
    // Button that shows/hides Smart Replies
    createNewSmartElement(
      `<span style='color: #767676;'>>></span>`,
      event => {
        if (!isExpanded) {
          let smartRepliesContainer = document.getElementsByClassName("brb")[0];
          for (let idx in hiddenSmartReplies) {
            // Makes hidden smart replies visible
            smartRepliesContainer.insertBefore(
              hiddenSmartReplies[idx],
              smartRepliesContainer.childNodes[
                smartRepliesContainer.childNodes.length - 2
              ]
            );
          }

          event.target.innerHTML = `<span style='color: #767676;'><<</span>`;
          isExpanded = true;
        } else {
          let smartReplyContainer = document.getElementsByClassName("brb")[0];
          for (let idx in hiddenSmartReplies) {
            // Hides smart replies
            smartReplyContainer.removeChild(hiddenSmartReplies[idx]);
          }

          event.target.innerHTML = `<span style='color: #767676;'>>></span>`;
          isExpanded = false;
        }
      },
      {overwriteClickHandler: true, appendToContainer: true, isSmartReply: false}
    );
  }

  // Creates a "+" button for creating a new smarter reply
  createNewSmartElement(
    `<b style='color: #767676;'>＋</b>`,
    () => {
      let canvas = document.createElement("div");
      let createSmartReply = document.createElement("div");

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
      createSmartReply.style.height = "353px";
      createSmartReply.style.top = "50%";
      createSmartReply.style.left = "50%";
      createSmartReply.style.marginLeft = "-269px";
      createSmartReply.style.transform = "translateY(-50%)";
      createSmartReply.style.borderRadius = "10px";
      createSmartReply.style.backgroundColor = "#FFFFFF";
      createSmartReply.style.zIndex = "2147483647";

      // TODO: Create examples
      let labelPlaceholder = "Title";
      let emailPlaceholder = "Your custom email response";

      createSmartReply.innerHTML = `\
        <div id="createSmartReplyHeader">
          <span>Create a smart reply</span>
          <a id="exitButton">×</a>
        </div>
        <div id="createSmartReplyBody">
          <textarea class="inputTextArea" id="replyTitle" autofocus required placeholder="${labelPlaceholder}"></textarea>
          <textarea class="inputTextArea" id="replyContent" placeholder="${emailPlaceholder}"></textarea>
        </div>
        <div id="createButtons">
          <button class="smartButtons" id="createReplyButton">Create</button>
          <button class="smartButtons" id="cancelButton">Cancel</button>
        </div>`;

      // TODO: Create logo and add to header
      document.getElementsByTagName("style")[0].innerHTML = `\
        #createSmartReplyHeader {
          color: #FFFFFF;
          padding-left: 35px;
          padding-right: 35px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #d93025;
          position: relative;
          height: 42px;
          border-radius: 10px 10px 0px 0px;
        }

        #exitButton {
          font-weight: 100 !important;
          font-size: 24px;
          cursor: pointer;
        }

        .inputTextArea {
          resize: none;
          background-color: #edeff1;
          border: none;
          outline: none;
          border-radius: 6px;
          padding-left: 12px;
          padding-top: 10px;
          font-size: 14px;
          font-family: sans-serif;
          color: #202124;
          width: 457px;
          display: block;
          margin-top: 20px;
          margin-left: auto;
          margin-right: auto;
        }

        #replyTitle {
          height: 26px;
          white-space: nowrap;
        }

        #replyContent {
          height: 140px;
        }

        #createButtons {
          margin-top: 20px;
          padding-left: 35px;
          padding-right: 35px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .smartButtons {
          border: none;
          color: #fff;
          font-family: sans-serif;
          font-size: 14px;
          position: relative;
          height: 40px;
          border-radius: 6px;
          width: 225px;
          cursor: pointer;
          outline: none;
          opacity: 1.0;
        }

        .smartButtons:hover {
          opacity: 0.75;
        }

        #createReplyButton {
          background-color: #d92f25
        }

        #cancelButton {
          background-color: #9a9a9a;
        }`;

      document.body.appendChild(canvas);
      document.body.appendChild(createSmartReply);

      // Form content
      let titleContent = document.getElementById("replyTitle");
      let bodyContent = document.getElementById("replyContent");

      // Buttons
      let exitButton = document.getElementById("exitButton");
      let createReplyButton = document.getElementById("createReplyButton");
      let cancelButton = document.getElementById("cancelButton");

      // Changes color of input text to red if title exceeds 30 characters
      titleContent.addEventListener(
        "keyup",
        event => {
          if (event.target.value.length > 30) {
            event.target.style.color = "#D93025";
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
              label: titleContent.value,
              email: bodyContent.value,
              oldSmartReplies: smartReplies
            }
          });
          exitHandler();
        },
        false
      );
    },
    {
      overwriteClickHandler: true,
      appendToContainer: true,
      isSmartReply: false
    }
  );

  var smartRepliesToBeDeleted = [];
  var isMinusButtonActive = false;

  // Creates a "-" button for deleting smarter replies
  createNewSmartElement(
    `<b style='color: #767676;'>-</b>`,
    event => {
      if (isMinusButtonActive) {
        isMinusButtonActive = false;

        let titlesOfSmartRepliesToBeDeleted = smartRepliesToBeDeleted.map(smartReply =>
          smartReply.getElementsByTagName("span")[0].innerText
        );
        for (let index in smartRepliesToBeDeleted) {
          let smartReplyID = smartRepliesToBeDeleted[index].id;
          let smartReply = document.getElementById(smartReplyID)
          smartReply.remove();
        }
        smartRepliesToBeDeleted = [];

        window.postMessage({
          title: "deleteSmartReplies",
          value: {
            smartReplyTitles: titlesOfSmartRepliesToBeDeleted
          }
        });
      } else {
        isMinusButtonActive = true;

        let smartReplies = Array.from(document.getElementsByClassName("customReply"));
        for (let i in smartReplies) {
          // Change the color of all present smart replies to indicate that they're
          // selectable
          let smartReply = smartReplies[i];
          smartReply.getElementsByTagName("span")[0].style.color = "#767676";
          smartReply.style.backgroundColor = "#DADCE0";

          smartReply.selected = "false";

          // Makes smart reply red on hover
          smartReply.onmouseover = () => {
            smartReply.getElementsByTagName("span")[0].style.color = "#FFFFFF";
            smartReply.style.backgroundColor = "#EA526F";
          }
          smartReply.onmouseout = () => {
            if (smartReply.selected === "false") { // Smart reply isn't already selected
              smartReply.getElementsByTagName("span")[0].style.color = "#767676";
              smartReply.style.backgroundColor = "#DADCE0";
            }
          }

          // Override the on click handlers for smart replies
          smartReply.removeAttribute("data-action-index");
          smartReply.onclick = () => {
            if (smartReply.selected === "false") {
              smartReply.getElementsByTagName("span")[0].style.color = "#FFFFFF";
              smartReply.style.backgroundColor = "#EA526F";
              smartReply.selected = "true";
              smartRepliesToBeDeleted.push(smartReply);
            } else {
              smartReply.getElementsByTagName("span")[0].style.color = "#767676";
              smartReply.style.backgroundColor = "#DADCE0";
              smartReply.selected = "false";
              let indexOfSR = smartRepliesToBeDeleted.indexOf(smartReply);
              smartRepliesToBeDeleted.splice(indexOfSR, 1);
            }

            // For some reason, depending on where on the "-" button the user
            // clicks, event.target will be a different element
            let element;
            if (event.target.tagName == "B") {
              element = event.target.parentNode;
            } else if (event.target.tagName == "DIV") {
              element = event.target;
            }

            // Change the "-" button style depending on whether smarter replies
            // are selected or not
            if (smartRepliesToBeDeleted.length > 0) {
              element.style.backgroundColor = "#EA526F";
              let innerText = element.getElementsByTagName("b")[0];
              innerText.style.color = "#FFFFFF";
            } else {
              element.style.backgroundColor = "#DADCE0";
              let innerText = element.getElementsByTagName("b")[0];
              innerText.style.color = "#767676";
            }
          }
        }
      }
    },
    {
      overwriteClickHandler: true,
      appendToContainer: true,
      isSmartReply: false
    }
  );


};

/*******************
 * MESSAGE PASSING *
 *******************/

// Listens for the "injectScraper" trigger from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.ping) {
    sendResponse({ pong: true });
    return;
  } else if (request.message === "injectScraper") {
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
      email: event.data.value.email
      // smartReplies: event.data.value.smartReplies
    });
  } else if (event.data.title === "newCustomSmartReply") {
    port.postMessage({
      title: "newCustomSmartReply",
      label: event.data.value.label,
      email: event.data.value.email
    });

    let updatedSmartReplies = event.data.value.oldSmartReplies.concat([
      { label: event.data.value.label, email: event.data.value.email }
    ]);

    injectJSPayload(customSmartReplyPayload, updatedSmartReplies);
  } else if (event.data.title === "clickedSmartReply") {
    port.postMessage({
      title: "customSmartReplySent",
      smartReplyLabel: event.data.value.smartReplyLabel,
      emailContent: {
        receivedAuthor: event.data.value.receivedAuthor,
        receivedSubject: event.data.value.receivedSubject,
        receivedEmail: event.data.value.receivedEmail
      }
    });
  } else if (event.data.title === "deleteSmartReplies") {
    port.postMessage({
      title: "deleteSmartReplies",
      smartReplyTitles: event.data.value.smartReplyTitles
    });
  }
});

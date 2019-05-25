/********************************
 * TEXT PREPROCESSING UTILITIES *
 ********************************/

const STOPWORDS = [];

// Porter Stemmer algorithm in pure JS
// Stolen from: https://tartarus.org/martin/PorterStemmer/js.txt
// TODO: Smarten up this old syntax
const PorterStemmer = (() => {
  var step2list = {
      ational: "ate",
      tional: "tion",
      enci: "ence",
      anci: "ance",
      izer: "ize",
      bli: "ble",
      alli: "al",
      entli: "ent",
      eli: "e",
      ousli: "ous",
      ization: "ize",
      ation: "ate",
      ator: "ate",
      alism: "al",
      iveness: "ive",
      fulness: "ful",
      ousness: "ous",
      aliti: "al",
      iviti: "ive",
      biliti: "ble",
      logi: "log"
    },
    step3list = {
      icate: "ic",
      ative: "",
      alize: "al",
      iciti: "ic",
      ical: "ic",
      ful: "",
      ness: ""
    },
    c = "[^aeiou]", // consonant
    v = "[aeiouy]", // vowel
    C = c + "[^aeiouy]*", // consonant sequence
    V = v + "[aeiou]*", // vowel sequence
    mgr0 = "^(" + C + ")?" + V + C, // [C]VC... is m>0
    meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$", // [C]VC[V] is m=1
    mgr1 = "^(" + C + ")?" + V + C + V + C, // [C]VCVC... is m>1
    s_v = "^(" + C + ")?" + v; // vowel in stem

  return function(w) {
    var stem,
      suffix,
      firstch,
      re,
      re2,
      re3,
      re4,
      origword = w;

    if (w.length < 3) {
      return w;
    }

    firstch = w.substr(0, 1);
    if (firstch == "y") {
      w = firstch.toUpperCase() + w.substr(1);
    }

    // Step 1a
    re = /^(.+?)(ss|i)es$/;
    re2 = /^(.+?)([^s])s$/;

    if (re.test(w)) {
      w = w.replace(re, "$1$2");
    } else if (re2.test(w)) {
      w = w.replace(re2, "$1$2");
    }

    // Step 1b
    re = /^(.+?)eed$/;
    re2 = /^(.+?)(ed|ing)$/;
    if (re.test(w)) {
      var fp = re.exec(w);
      re = new RegExp(mgr0);
      if (re.test(fp[1])) {
        re = /.$/;
        w = w.replace(re, "");
      }
    } else if (re2.test(w)) {
      var fp = re2.exec(w);
      stem = fp[1];
      re2 = new RegExp(s_v);
      if (re2.test(stem)) {
        w = stem;
        re2 = /(at|bl|iz)$/;
        re3 = new RegExp("([^aeiouylsz])\\1$");
        re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
        if (re2.test(w)) {
          w = w + "e";
        } else if (re3.test(w)) {
          re = /.$/;
          w = w.replace(re, "");
        } else if (re4.test(w)) {
          w = w + "e";
        }
      }
    }

    // Step 1c
    re = /^(.+?)y$/;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(s_v);
      if (re.test(stem)) {
        w = stem + "i";
      }
    }

    // Step 2
    re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = new RegExp(mgr0);
      if (re.test(stem)) {
        w = stem + step2list[suffix];
      }
    }

    // Step 3
    re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = new RegExp(mgr0);
      if (re.test(stem)) {
        w = stem + step3list[suffix];
      }
    }

    // Step 4
    re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
    re2 = /^(.+?)(s|t)(ion)$/;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(mgr1);
      if (re.test(stem)) {
        w = stem;
      }
    } else if (re2.test(w)) {
      var fp = re2.exec(w);
      stem = fp[1] + fp[2];
      re2 = new RegExp(mgr1);
      if (re2.test(stem)) {
        w = stem;
      }
    }

    // Step 5
    re = /^(.+?)e$/;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(mgr1);
      re2 = new RegExp(meq1);
      re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
      if (re.test(stem) || (re2.test(stem) && !re3.test(stem))) {
        w = stem;
      }
    }

    re = /ll$/;
    re2 = new RegExp(mgr1);
    if (re.test(w) && re2.test(w)) {
      re = /.$/;
      w = w.replace(re, "");
    }

    if (firstch == "y") {
      w = firstch.toLowerCase() + w.substr(1);
    }

    return w;
  };
})();

const preprocessText = text => {
  text = text.toUpperCase(); // Uniform capitalization
  text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""); // Punctuation removal

  // Stopword removal
  let tokens = text.split(" ").filter(token => {
    return STOPWORDS.indexOf(token) < 0;
  });

  // Stemming
  tokens = tokens.map(token => {
    return PorterStemmer(token);
  });

  // TODO: Lemmatization

  return tokens;
};

const createFrequencyMap = text => {
  // TODO: Remove HTML elements
  let tokens = preprocessText(text.strip());

  let frequencyMap = {};
  for (let token in tokens) {
    let currTokenFreq = frequencyMap[token];
    frequencyMap[token] = currTokenFreq ? frequencyMap[token] + 1 : 1;
  }

  return frequencyMap;
};

/***********
 * PAYLOAD *
 ***********/

const payload = () => {
  let currentURL = window.location.href;

  setInterval(() => {
    let newURL = window.location.href;

    if (currentURL != newURL) {
      currentURL = newURL;

      let subdomain = newURL.split("mail.google.com/mail/u/0/#")[1];
      let emailHash = subdomain.split("/")[1];

      // An email is open
      if (emailHash) {
        let smartReplies = Array.from(document.getElementsByClassName("bra"));

        // Smart Reply elements are present
        if (typeof smartReplies !== "undefined" && smartReplies.length > 0) {
          let receivedEmailAuthor = document.getElementsByClassName("gD");
          let receivedEmailSubject = document.getElementsByClassName("hP")[0];
          let receivedEmail = document.getElementsByClassName("a3s aXjCH ")[0];

          // Send scraped email content to the content script
          window.postMessage(
            {
              type: "scrapedEmailContent",
              value: {
                author: receivedEmailAuthor[receivedEmailAuthor.length - 1]
                  .getAttribute("email")
                  .strip(),
                subject: receivedEmailSubject.innerHTML,
                email: receivedEmail.innerHTML,
								smartReplies: [for (reply of smartReplies) reply.innerHTML]
              }
            },
            "*"
          );
        }
      }
    }
  }, 500);

  // MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  //
  // let observer = new MutationObserver((mutations, observer) => {
  //   let targetElems = Array.from(document.getElementsByClassName("ams bkH"));
  //
  //   if (typeof targetElems !== "undefined" && targetElems.length > 0) {
  //     console.log("Alert!");
  //   }
  // });
  //
  // observer.observe(document, {
  //   subtree: true,
  //   attributes: true
  // });

	const createNewSmartReply = (label, email) => {
		let smartRepliesContainer = document.getElementsByClassName("brb")[0];
		let clonedNode = smartRepliesContainer.lastChild.cloneNode(true);

		clonedNode.innerHTML = label;
		// TODO: Add circle <div>
		// TODO: Add onClick handler

		smartRepliesContainer.appendChild(clonedNode);
	}

  // TODO: Retrieve an ordered array of custom smart replies

	// TODO: Create "Load More" and "Create" elements and append to the list of
	// Smart Replies.
};

/****************
 * JS INJECTION *
 ****************/

const listenerPort = chrome.runtime.connect(
  window.localStorage.getItem("smarterreply-id"),
  { name: "listener" }
);

// Listens for the "injectPayload" event from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message == "injectPayload") {
    console.log("User has loaded Gmail. Injecting payload...");

    let script = document.createElement("script");
    script.textContent = "(" + payload.toString() + ")();";
    document.head.appendChild(script);
  }
});

// Pulls scraped email content, preprocesses it, and sends to background.js
window.addEventListener("message", event => {
  if (event.data.type == "scrapedEmailContent") {
    console.log("Successfully scraped email content.");

    listenerPort.postMessage({
      author: event.data.value.author,
      subjectFreqMap: createFrequencyMap(event.data.value.subject),
      emailFreqMap: createFrequencyMap(event.data.value.email),
			smartReplies: event.data.value.smartReplies
    });
  }
});

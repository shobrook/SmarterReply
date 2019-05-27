/*********************
 * GENERAL UTILITIES *
 *********************/

// For calling GET and SET to the browser's local storage
const storage = chrome.storage.local;

// Sends a message to content scripts running in the current tab
const message = content => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    let activeTabID = tabs[0].id;

    chrome.tabs.sendMessage(activeTabID, { ping: true }, response => {
      if (response && response.pong) {
        console.log("Sending injectScraper event to content script.");
        // Content script is ready
        chrome.tabs.sendMessage(activeTabID, content);
      } else {
        // No listener on the other end
        chrome.tabs.executeScript(activeTabID, { file: "content.js" }, () => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            throw Error("Unable to inject script into tab " + activeTabID);
          }

          // OK, now it's injected and ready
          chrome.tabs.sendMessage(activeTabID, content);
        });
      }
    });
  });
};

/********************************
 * TEXT PREPROCESSING UTILITIES *
 ********************************/

const STOPWORDS = [];

// Porter Stemmer algorithm in pure JS
// Taken from: https://tartarus.org/martin/PorterStemmer/js.txt
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

  // TODO: Lemmatization instead of stemming

  return tokens;
};

const createFrequencyMap = text => {
  // TODO: Remove HTML elements
  let tokens = preprocessText(text.replace(/^\s+|\s+$/g, ""));

  let frequencyMap = {};
  for (let token in tokens) {
    let currTokenFreq = frequencyMap[token];
    frequencyMap[token] = currTokenFreq ? frequencyMap[token] + 1 : 1;
  }

  return frequencyMap;
};

/*******************
 * MESSAGE PASSING *
 *******************/

// Tells content script to inject the JS payload for scraping emails
// chrome.webNavigation.onCompleted.addListener(details => {
chrome.tabs.onUpdated.addListener((tabID, changeInfo, tab) => {
  if (changeInfo.status == "complete" && tab.url.includes("mail.google.com")) {
    message({ message: "injectScraper" });
  }
});

// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) { alert(changeInfo.status); if (changeInfo.status == 'complete') { } });

// Listens for incoming messages from the content scripts
chrome.runtime.onConnect.addListener(port => {
  console.assert(port.name === "mainPort");

  port.onMessage.addListener(msg => {
    if (msg.title === "scrapedEmailContent") {
      let author = msg.author;
      let subjectFreqMap = createFrequencyMap(msg.subject);
      let emailFreqMap = createFrequencyMap(msg.email);
      let smartReplies = msg.smartReplies;

      storage.get(null, smartReplies => {
        let reformattedSmartReplies = Object.keys(smartReplies).map(label => {
          return { label: label, email: smartReplies[label].emailContent };
        });

        // TODO: Pull all custom Smart Replies from storage
        // TODO: Create BoW vectors (with TF-IDF entries) for both the subject and
        // the email frequency maps for each Smart Reply
        // TODO: Create vectors for the messaged subject and email frequency maps
        // TODO: Calculate cosine similarity between each Smart Reply vector and
        // the messaged vectors
        // TODO: Rank Smart Replies with the following formula:
        // R_i = w_1*sim(subjectVec_i, subjectVec) + w_2*sim(emailVec_i, emailVec)
        //       + w_3*(authorFreq_i / totalAuthorFreq_i) + w_4*sim(smartReplyVec_i, smartReplyVec)

        port.postMessage({
          title: "injectSmartReplies",
          smartReplies: reformattedSmartReplies
        });
      });
    } else if (msg.title === "newCustomSmartReply") {
      storage.set(
        {
          [msg.label]: {
            subjectFreqMap: {},
            emailFreqMap: {},
            authorFreqMap: {},
            associatedSmartReplies: {},
            emailContent: msg.email
          }
        },
        () => {}
      );
    }
  });
});

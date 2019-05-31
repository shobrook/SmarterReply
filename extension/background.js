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

const createPartialVector = (freqMap, tokenToIdxMap) => {
  let unseenTokens = new Set([]);
  let partialVec = new Array(Object.keys(tokenToIdxMap).length).fill(0);

  Object.entries(partialVec).forEach(([token, frequency]) => {
    if (token in tokenToIdxMap) {
      partialVec[tokenToIdxMap[token]] = frequency;
    } else {
      unseenTokens.add(token);
    }
  });

  return [partialVec, unseenTokens];
};

const updateVectors = (vectors, maxIdx) =>
  vectors.map(vec => vec.concat(new Array(maxIdx - (vec.length - 1)).fill(0)));

const dotProduct = (u, v) => {
  console.assert(u.length === v.length);

  let result = 0;
  for (let idx in u) {
    result += u[idx] * v[idx];
  }

  return result;
};

const cosineSim = (u, v) => {
  console.log(u);
  console.log(v);
  console.log("");

  console.assert(u.length === v.length);

  let uNorm = 0,
    vNorm = 0;
  for (let idx in u) {
    uNorm += u[idx] ** 2;
    vNorm += v[idx] ** 2;
  }

  return dotProduct(u, v) / (uNorm * vNorm);
};

/*******************
 * MESSAGE PASSING *
 *******************/

// Tells content script to inject the JS payload for scraping emails
chrome.tabs.onUpdated.addListener((tabID, changeInfo, tab) => {
  if (changeInfo.status == "complete" && tab.url.includes("mail.google.com")) {
    // Sends a message to content scripts running in the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      let activeTabID = tabs[0].id;

      chrome.tabs.sendMessage(activeTabID, { ping: true }, response => {
        if (response && response.pong) {
          console.log("Sending injectScraper event to content script."); // TEMP
          // Content script is ready
          chrome.tabs.sendMessage(activeTabID, { message: "injectScraper" });
        } else {
          // No listener on the other end
          chrome.tabs.executeScript(activeTabID, { file: "content.js" }, () => {
            if (chrome.runtime.lastError) {
              throw Error("Unable to inject script into tab " + activeTabID);
            }

            // OK, now it's injected and ready
            chrome.tabs.sendMessage(activeTabID, { message: "injectScraper" });
          });
        }
      });
    });
  }
});

// Listens for incoming messages from the content scripts
chrome.runtime.onConnect.addListener(port => {
  console.assert(port.name === "mainPort");

  // For calling GET and SET to the browser's local storage
  const storage = chrome.storage.local;

  port.onMessage.addListener(msg => {
    if (msg.title === "scrapedEmailContent") {
      let author = msg.author;
      let subjectFreqMap = createFrequencyMap(msg.subject);
      let emailFreqMap = createFrequencyMap(msg.email);
      // let neighboringSmartReplies = msg.smartReplies;

      storage.get(null, smartReplies => {
        if (!("tokenToIdxMap" in smartReplies)) {
          storage.set({ tokenToIdxMap: {} }, () => {});
          port.postMessage({
            title: "injectSmartReplies",
            smartReplies: []
          });

          return;
        }

        let tokenToIdxMap = smartReplies.tokenToIdxMap;
        let subjectVec = createPartialVector(subjectFreqMap, tokenToIdxMap);
        let emailVec = createPartialVector(emailFreqMap, tokenToIdxMap);

        let rankedSmartReplies = [];
        Object.entries(smartReplies).forEach(([replyLabel, content]) => {
          if (replyLabel !== "tokenToIdxMap") {
            let subjectVecs = content.subjectVecs;
            let emailVecs = content.emailVecs;

            if (emailVecs === undefined || emailVecs.length === 0) {
              rankedSmartReplies.push({
                label: replyLabel,
                email: content.reply,
                rank: 0.0
              });

              return;
            }

            let sumVecs = (acc, vec) => acc.map((elem, idx) => vec[idx] + elem);
            let subjectSim = cosineSim(subjectVecs.reduce(sumVecs), subjectVec);
            let emailSim = cosineSim(emailVecs.reduce(sumVecs), emailVec);

            let ratioDenom = Object.values(content.authorFreqMap).reduce(
              (acc, val) => acc + val,
              0
            );
            let authorRatio =
              author in content.authorFreqMap
                ? content.authorFreqMap[author] / ratioDenom
                : 0;

            let features = [subjectSim, emailSim, authorRatio];
            let weights = [0.2, 0.7, 0.1];

            rankedSmartReplies.push({
              label: replyLabel,
              email: content.reply,
              rank: dotProduct(features, weights)
            });
          }
        });

        port.postMessage({
          title: "injectSmartReplies",
          smartReplies: rankedSmartReplies.sort(
            (fstRep, sndRep) => sndRep.rank - fstRep.rank
          )
        });
      });
    } else if (msg.title === "newCustomSmartReply") {
      storage.set(
        {
          [msg.label]: {
            subjectVecs: [],
            emailVecs: [],
            authorFreqMap: {},
            // defaultSmartReplyVecs: [],
            reply: msg.email
          }
        },
        () => {}
      );
    } else if (msg.title === "customSmartReplySent") {
      storage.get("tokenToIdxMap", tokenToIdxMap => {
        let emailContent = msg.emailContent;
        let subjectFreqMap = createFrequencyMap(emailContent.receivedSubject);
        let emailFreqMap = createFrequencyMap(emailContent.receivedEmail);

        let subjectVec, emailVec;
        let unseenSubjTokens, unseenEmailTokens;

        [subjectVec, unseenSubjTokens] = createPartialVector(
          subjectFreqMap,
          tokenToIdxMap
        );
        [emailVec, unseenEmailTokens] = createPartialVector(
          emailFreqMap,
          tokenToIdxMap
        );

        let maxTokenIdx = Object.keys(tokenToIdxMap).length - 1;
        let unseenTokens = new Set([...unseenSubjTokens, ...unseenEmailTokens]);
        if (unseenTokens.length > 0) {
          unseenTokens = Array.from(unseenTokens);

          for (let idx in unseenTokens) {
            let token = unseenTokens[idx];
            maxTokenIdx += idx + 1;

            if (token in subjectFreqMap) {
              subjectVec.push(subjectFreqMap[token]);
            } else {
              subjectVec.push(0);
            }

            if (token in emailFreqMap) {
              emailVec.push(emailFreqMap[token]);
            } else {
              emailVec.push(0);
            }

            tokenToIdx[token] = maxTokenIdx;
          }
        }

        storage.get(null, smartReplies => {
          let updatedSmartReplies = { tokenToIdxMap: tokenToIdxMap };
          Object.entries(smartReplies).forEach(([replyLabel, content]) => {
            if (replyLabel !== "tokenToIdxMap") {
              let updatedSubjVecs = updateVectors(
                content.subjectVecs,
                maxTokenIdx
              );
              let updatedEmailVecs = updateVectors(
                content.emailVecs,
                maxTokenIdx
              );
              let updatedAuthorFreqMap = content.authorFreqMap;

              if (replyLabel === msg.smartReplyLabel) {
                updatedSubjVecs.push(subjectVec);
                updatedEmailVecs.push(emailVec);

                if (msg.author in updatedAuthorFreqMap) {
                  updatedAuthorFreqMap[msg.author] += 1;
                } else {
                  updatedAuthorFreqMap[msg.author] = 1;
                }
              }

              updatedSmartReplies[replyLabel] = {
                ...content,
                subjectVecs: updatedSubjVecs,
                emailVecs: updatedEmailVecs,
                authorFreqMap: updatedAuthorFreqMap
              };
            }
          });

          storage.set(updatedSmartReplies, () => {});
        });
      });
    }
  });
});

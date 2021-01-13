/********************************
 * TEXT PREPROCESSING UTILITIES *
 ********************************/

// Porter Stemmer algorithm in pure JS, taken from:
// https://tartarus.org/martin/PorterStemmer/js.txt
const PorterStemmer = (() => {
  const stepTwoList = {
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
  };
  const stepThreeList = {
    icate: "ic",
    ative: "",
    alize: "al",
    iciti: "ic",
    ical: "ic",
    ful: "",
    ness: ""
  };

  // RegEx Patterns
  const consonant = "[^aeiou]";
  const vowel = "[aeiouy]";
  const consonantSeq = consonant + "[^aeiouy]*";
  const vowelSeq = vowel + "[aeiou]*";
  const mGRZero = "^(" + consonantSeq + ")?" + vowelSeq + consonantSeq; // [C]VC... is m > 0
  const mEQZero =
    "^(" +
    consonantSeq +
    ")?" +
    vowelSeq +
    consonantSeq +
    "(" +
    vowelSeq +
    ")?$"; // [C]VC[V] is m = 1
  const mGROne =
    "^(" +
    consonantSeq +
    ")?" +
    vowelSeq +
    consonantSeq +
    vowelSeq +
    consonantSeq; // [C]VCVC... is m > 1
  const vowelInStem = "^(" + consonantSeq + ")?" + vowel;

  return token => {
    var stem, suffix, firstChar;
    var fstPattern, sndPattern, thdPattern, frthPattern;

    if (token.length < 3) {
      return token;
    }

    firstChar = token.substr(0, 1);
    if (firstChar == "y") {
      token = firstChar.toUpperCase() + token.substr(1);
    }

    // Step 1(a)
    fstPattern = /^(.+?)(ss|i)es$/;
    sndPattern = /^(.+?)([^s])s$/;

    if (fstPattern.test(token)) {
      token = token.replace(fstPattern, "$1$2");
    } else if (sndPattern.test(token)) {
      token = token.replace(sndPattern, "$1$2");
    }

    // Step 1(b)
    fstPattern = /^(.+?)eed$/;
    sndPattern = /^(.+?)(ed|ing)$/;

    if (fstPattern.test(token)) {
      var fp = fstPattern.exec(token);

      fstPattern = new RegExp(mGRZero);
      if (fstPattern.test(fp[1])) {
        fstPattern = /.$/;
        token = token.replace(fstPattern, "");
      }
    } else if (sndPattern.test(token)) {
      var fp = sndPattern.exec(token);

      stem = fp[1];
      sndPattern = new RegExp(vowelInStem);
      if (sndPattern.test(stem)) {
        token = stem;
        sndPattern = /(at|bl|iz)$/;
        thdPattern = new RegExp("([^aeiouylsz])\\1$");
        frthPattern = new RegExp("^" + consonantSeq + vowel + "[^aeiouwxy]$");

        if (sndPattern.test(token)) {
          token += "e";
        } else if (thdPattern.test(token)) {
          fstPattern = /.$/;
          token = token.replace(fstPattern, "");
        } else if (frthPattern.test(token)) {
          token += "e";
        }
      }
    }

    // Step 1(c)
    fstPattern = /^(.+?)y$/;
    if (fstPattern.test(token)) {
      var fp = fstPattern.exec(token);

      stem = fp[1];
      fstPattern = new RegExp(vowelInStem);
      if (fstPattern.test(stem)) {
        token = stem + "i";
      }
    }

    // Step 2
    fstPattern = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
    if (fstPattern.test(token)) {
      var fp = fstPattern.exec(token);

      stem = fp[1];
      suffix = fp[2];
      fstPattern = new RegExp(mGRZero);
      if (fstPattern.test(stem)) {
        token = stem + stepTwoList[suffix];
      }
    }

    // Step 3
    fstPattern = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
    if (fstPattern.test(token)) {
      var fp = fstPattern.exec(token);

      stem = fp[1];
      suffix = fp[2];
      fstPattern = new RegExp(mGRZero);
      if (fstPattern.test(stem)) {
        token = stem + stepThreeList[suffix];
      }
    }

    // Step 4
    fstPattern = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
    sndPattern = /^(.+?)(s|t)(ion)$/;
    if (fstPattern.test(token)) {
      var fp = fstPattern.exec(token);

      stem = fp[1];
      fstPattern = new RegExp(mGROne);
      if (fstPattern.test(stem)) {
        token = stem;
      }
    } else if (sndPattern.test(token)) {
      var fp = sndPattern.exec(token);

      stem = fp[1] + fp[2];
      sndPattern = new RegExp(mGROne);
      if (sndPattern.test(stem)) {
        token = stem;
      }
    }

    // Step 5
    fstPattern = /^(.+?)e$/;
    if (fstPattern.test(token)) {
      var fp = fstPattern.exec(token);

      stem = fp[1];
      fstPattern = new RegExp(mGROne);
      sndPattern = new RegExp(mEQOne);
      thdPattern = new RegExp("^" + consonantSeq + vowel + "[^aeiouwxy]$");
      if (
        fstPattern.test(stem) ||
        (sndPattern.test(stem) && !thdPattern.test(stem))
      ) {
        token = stem;
      }
    }

    fstPattern = /ll$/;
    sndPattern = new RegExp(mGROne);
    if (fstPattern.test(token) && sndPattern.test(token)) {
      fstPattern = /.$/;
      token = token.replace(fstPattern, "");
    }

    if (firstChar == "y") {
      token = firstChar.toLowerCase() + token.substr(1);
    }

    return token;
  };
})();

const preprocessText = async text => {
  text = text.replace(/^\s+|\s+$/g, ""); // Strips newlines and extra whitespace
  text = text.replace(/<\/?[^>]+(>|$)/g, ""); // Removes HTML tags
  text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""); // Punctuation removal
  text = text.toUpperCase(); // Uniform capitalization

  // Stopword removal
  let resp = await fetch(chrome.extension.getURL("../assets/stopwords.json"));
  let stopwords = (await resp.json()).map(stopword => stopword.toUpperCase());
  let tokens = text.split(" ").filter(token => stopwords.indexOf(token) < 0);

  // Stemming
  tokens = tokens.map(token => {
    return PorterStemmer(token);
  });

  return tokens;
};

const createFrequencyMap = text => {
  let tokens = preprocessText(text);

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
  console.assert(u.length === v.length);

  let uNorm = 0,
    vNorm = 0;
  for (let idx in u) {
    uNorm += u[idx] ** 2;
    vNorm += v[idx] ** 2;
  }

  return dotProduct(u, v) / (uNorm * vNorm);
};

/*********
 * HELPERS
 *********/

 const isEmailURL = (url) => {
   if (url.includes("mail.google.com")) {
     if (!url.includes("#")) {
       return false;
     }

     // if there's a '/' after the '#', then an email is opened
     let hashIndex = url.indexOf("#");
     // first, get the part of the url after the #
     let urlAfterHash = url.slice(hashIndex, url.length);
     // if this part includes a /, then an email is open
     if (urlAfterHash.includes("/")) {
       return true;
     }
   }

   return false;
 }

/*******************
 * MESSAGE PASSING *
 *******************/

// Tells content script to inject the JS payload for scraping emails
chrome.tabs.onUpdated.addListener((tabID, changeInfo, tab) => {
  if (changeInfo.status == "complete" && isEmailURL(tab.url)) {
      // Sends a message to content scripts running in the current tab
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        let activeTabID = tabs[0].id;

        chrome.tabs.sendMessage(activeTabID, { ping: true }, response => {
          if (response && response.pong) {
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

      console.log("Gets here at least");
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

        console.log("HIT TSI");
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

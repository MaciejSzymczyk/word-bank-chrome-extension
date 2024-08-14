
function displayModal(word, definition, synonyms, context, origin, clickEvent) {
    var modal = document.createElement('div');
    modal.style.position = 'absolute';
    modal.style.top = `${clickEvent.clientY + window.scrollY}px`;
    modal.style.left = `${clickEvent.clientX + window.scrollX}px`;
    modal.style.width = '300px'; // Adjust the width as needed
    modal.style.height = '150px'; // Adjust the height as needed
    modal.style.background = 'white';
    modal.style.overflow = 'auto'; // Add scrollbar if content overflows
    modal.style.padding = '20px';
    modal.style.border = '2px solid #333';
    modal.style.zIndex = '9999';
    modal.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    modal.style.fontFamily = 'Arial, sans-serif';
    modal.style.fontSize = '16px';
    modal.style.textAlign = 'left';

    var content = `<div style="display: flex; justify-content: space-between; align-items: center;">`;
    content += `<p style="font-weight: bold; margin: 0;">${word}</p>`;
    content += `<button id="addToWordBankBtn" style="position: absolute; top: 10px; right: 30px; cursor: pointer;">Add to Word Bank</button>`;
    content += `</div>`;

    if (definition) {
        content += `<p><strong>Definition:</strong> ${definition}</p>`;
    }

    if (synonyms && synonyms.length > 0) {
        content += `<p><strong>Synonyms:</strong> ${synonyms.join(', ')}</p>`;
    }

    content += `<button id="closeBtn" style="position: absolute; top: 10px; right: 10px; cursor: pointer; background: none; border: none; font-size: 18px;">&times;</button>`;

    modal.innerHTML = content;

    document.body.appendChild(modal);

    // Add an event listener to close the modal when the "Close" button is clicked
    document.getElementById('closeBtn').addEventListener('click', function() {
        document.body.removeChild(modal);
    });

    // Add an event listener to close the modal when the user clicks somewhere else on the page
    document.body.addEventListener('click', function(event) {
        if (!modal.contains(event.target)) {
            document.body.removeChild(modal);
        }
    });

    // Add an event listener for the "Add to Word Bank" button
    document.getElementById('addToWordBankBtn').addEventListener('click', function(event) {
        event.preventDefault();
    
        // Save the word data to Chrome Storage
        addWordToWordBank(word, definition, synonyms, context, origin);
        // Close the modal
        document.body.removeChild(modal);
    });
}
// Function to handle adding a word to the word bank (called when adding words)
function addWordToWordBank(newWord, definition, synonyms, context, origin) {
    const wordData = {
      word: newWord,
      definition: definition,
      synonyms: synonyms,
      context: context,
      origin: origin
    };
  
    saveToWordBank(wordData);
  }

function saveToWordBank(wordData) {
    chrome.storage.local.get({ wordBank: [] }, function (result) {
      const wordBank = result.wordBank;
  
      // Check if the word already exists in the word bank
      const existingWord = wordBank.find(item => item.word === wordData.word);
      if (!existingWord) {
        // Add new word data to the word bank if it doesn't exist
        wordBank.push(wordData);
  
        // Save updated word bank data to Chrome Storage
        chrome.storage.local.set({ wordBank: wordBank }, function () {
          console.log('Word data saved:', wordData);
        });
      } else {
        console.log('Word already exists in the word bank:', wordData.word);
        alert("Word already exists in the word bank")
        // Handle the case where the word already exists in the word bank
      }
    });
  }


// Function to retrieve synonyms for a word from Chrome Storage
function getSynonymsForWord(word, callback) {
    chrome.storage.local.get({ wordBank: [] }, function (result) {
      const wordBank = result.wordBank;
  
      // Find the word data in the word bank array based on the word
      const wordData = wordBank.find(item => item.word === word);
  
      // Retrieve only the synonyms if the word data is found
      const synonyms = wordData ? wordData.synonyms : [];
  
      // Pass the synonyms to the callback function
      callback(synonyms);
    });
  }


// Function to retrieve word data from Chrome Storage
function getWordData(word, callback) {
    chrome.storage.local.get({ wordBank: [] }, function (result) {
      const wordBank = result.wordBank;
  
      // Find the word data in the word bank array based on the word
      const wordData = wordBank.find(item => item.word === word);
  
      // Pass the word data to the callback function
      callback(wordData);
    });
  }

document.addEventListener('dblclick', function(event) {
    var selection = window.getSelection().toString().trim();
    if (selection) {
        fetchDefinitionAndSynonyms(selection, event);
    }
});

function fetchDefinitionAndSynonyms(word, clickEvent) {
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                var definition = data[0].meanings[0].definitions[0].definition;
                var synonyms = data[0].meanings[0].definitions[0].synonyms || [];
                var origin = document.title
                console.log(getContextOfSelectedWord(word))
                displayModal(word, definition, synonyms, getContextOfSelectedWord(word), origin, clickEvent);
            } else {
                displayModal(word, 'Definition not found', [], getContextOfSelectedWord(word), clickEvent);
            }
        })
        .catch(error => {
            console.error('Error fetching definition:', error);
            displayModal(word, 'An error occurred while fetching the definition', [], getContextOfSelectedWord(word), clickEvent);
        });
}



function getContextOfSelectedWord(word) {
  // Get the relevant paragraph from the website's document
  const selection = window.getSelection();
  const para = selection.anchorNode.parentElement.textContent
  console.log(para)
  return getSentencesWithKeyword(para, word)
}

function getSentencesWithKeyword(text, keyword) {
  // Split text into sentences 
  const sentences = text.split(/[.!?]/);

  // Filter sentences that contain the keyword
  const sentencesWithKeyword = sentences.filter(sentence => {
    return sentence.toLowerCase().includes(keyword.toLowerCase());
  });

  return sentencesWithKeyword;
}

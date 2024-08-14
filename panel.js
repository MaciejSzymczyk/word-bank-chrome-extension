
document.addEventListener('DOMContentLoaded', function() {
    var generatePdfBtn = document.getElementById('generatePdfBtn');
    var addWordBtn = document.getElementById('addWordBtn')
    displaySortedWordBank('chronologically'); // Initially display chronologically
    setupSortRadioButtons(); // Call the function to set up event listeners for sorting radio buttons
    
    generatePdfBtn.addEventListener('click', function() {
      // Retrieve word bank data from Chrome storage
      chrome.storage.local.get({ wordBank: [] }, function (result) {
        const wordBank = result.wordBank;
        generatePDFFromWordBank(wordBank); // Generate PDF from the retrieved word bank data
      });
    });
    addWordBtn.addEventListener('click', showAddWordModal)
    const wordList = document.getElementById('wordList');
    // Add event listener to "Show More" buttons
    wordList.addEventListener('click', function(event) {
      if (event.target.classList.contains('show-more-btn')) {
        // Extract the word associated with the clicked button
        const word = event.target.parentElement.textContent.replace("Show More", ""); // Get the text content of the parent element
  
        // Log the word to the console
        retrieveWordDetails(word)
      }
    });
    
  });


function generatePDFFromWordBank() {
  console.log("Function called")
  const doc = new jsPDF();
  let yPos = 10; // Initial Y position

  chrome.storage.local.get('wordBank', function(result) {
    const wordBank = result.wordBank;

    doc.setFontSize(12);
    doc.setFontType('bold')
    doc.text('Word Bank', 14, yPos); // Title for the document
    yPos += 10; // Increase Y position

    wordBank.forEach((wordData) => {
      // Account for cases when no data is available
      const word = wordData.word || 'N/A';
      const definition = wordData.definition || 'No definition available';
      const synonyms = wordData.synonyms && wordData.synonyms.length > 0 ? wordData.synonyms.join(', ') : 'No synonyms available';
      const context = wordData.context || 'No context available';

      // Add content for each word entry
      const content = [
        { title: 'Word:', text: word },
        { title: 'Definition:', text: definition },
        { title: 'Synonyms:', text: synonyms },
        { title: 'Context:', text: context },
      ];
      // Count how many lines an entry will take and add new page if needed
      var numberOfLinesInEntry = 20
      content.forEach(({title, text})=>{
        numberOfLinesInEntry+= doc.splitTextToSize(text, 180).length
      })
      if (yPos+numberOfLinesInEntry>=280){
        doc.addPage()
        yPos=10
      }
      // Write the content to PDF
      content.forEach(({ title, text }) => {
        doc.setFontType('bold');
        doc.text(title, 14, yPos); // Add title
        doc.setFontType('normal');
        yPos += 5; // Increase Y position
        var splitText = doc.splitTextToSize(text, 180);
        console.log(splitText.length)
        doc.text(15, yPos, splitText);
        yPos+=5*splitText.length
      });

      yPos += 5; // Add extra space between entries
    });
    doc.save('wordBank.pdf'); // Save the generated PDF
  });
}

function retrieveWordDetails(word) {
  chrome.storage.local.get({ wordBank: [] }, function(result) {
    const wordBank = result.wordBank;
    const selectedWord = wordBank.find(item => item.word === word);

    if (selectedWord) {
      displayWordDetailsModal(selectedWord);
    } else {
      console.log(`Word details not found for ${word}`);
      // Handle the case where details are not found
    }
  });
}
// Function to display word details in a modal
function displayWordDetailsModal(wordDetails) {
  const modal = document.createElement('div');
  modal.classList.add('modal');

  const overlay = document.createElement('div');
  overlay.classList.add('overlay');

  // Set modal content with word details
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>${wordDetails.word}</h2>
      <p><strong>Definition:</strong> ${wordDetails.definition}</p>
      <p><strong>Synonyms:</strong> ${wordDetails.synonyms.join(', ')}</p>
      <p><strong>Context:</strong> ${wordDetails.context}</p>
      <p><strong>Origin:</strong> ${wordDetails.origin}</p>
    </div>
  `;

  // Append modal and overlay to the document body
  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  const closeButton = modal.querySelector('.close');

  // Close the modal and remove the overlay when the close button is clicked
  closeButton.addEventListener('click', function() {
    document.body.removeChild(overlay);
    document.body.removeChild(modal);
  });
}

// Function to create and show the add word modal
function showAddWordModal() {
  // Create modal elements
  const modalOverlay = document.createElement('div');
  modalOverlay.classList.add('modal-overlay');

  const modal = document.createElement('div');
  modal.classList.add('modal');

  const modalContent = document.createElement('div');
  modalContent.classList.add('modal-content');

  const closeBtn = document.createElement('span');
  closeBtn.classList.add('close');
  closeBtn.textContent = 'x';

  const h2 = document.createElement('h2');
  h2.textContent = 'Add Word';

  const addWordForm = document.createElement('form');
  addWordForm.id = 'addWordForm';

  const wordLabel = document.createElement('label');
  wordLabel.textContent = 'Word:';
  const wordInput = document.createElement('input');
  wordInput.type = 'text';
  wordInput.id = 'word';
  wordInput.name = 'word';
  wordInput.required = true;

  const contextLabel = document.createElement('label');
  contextLabel.textContent = 'Context:';
  const contextTextarea = document.createElement('textarea');
  contextTextarea.id = 'context';
  contextTextarea.name = 'context';
  contextTextarea.required = true;

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Add';

  // Append elements to the modal
  addWordForm.append(wordLabel, wordInput, document.createElement('br'), document.createElement('br'), contextLabel, contextTextarea, document.createElement('br'), document.createElement('br'), submitBtn);
  modalContent.append(closeBtn, h2, addWordForm);
  modal.append(modalContent);
  modalOverlay.append(modal);
  document.body.append(modalOverlay);

  // Close the modal when clicking the close button
  closeBtn.addEventListener('click', () => {
    modalOverlay.remove();
  });

  // Handle form submission
  addWordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const word = wordInput.value.trim();
    const context = contextTextarea.value.trim();
    const origin = 'added manually'
    // Fetch word definition and synonyms from the dictionary API
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const definition = data[0].meanings[0].definitions[0].definition;
        const synonyms = data[0].meanings[0].definitions[0].synonyms || [];

        // Save word data to the word bank including definition and synonyms
        saveToWordBank({ word: word, definition: definition, synonyms: synonyms, context: context, origin: origin });

        // Close the modal after submission
        modalOverlay.remove();
      } else {
        alert('Definition not found for the word.');
      }
    } catch (error) {
      console.error('Error fetching definition:', error);
      alert('An error occurred while fetching the definition.');
    }
  });
}

// Function Ato save word data to Chrome Storage
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
        alert('Word added to the word bank!');
        displaySortedWordBank('chronologically')
      });
    } else {
      console.log('Word already exists in the word bank:', wordData.word);
      alert('Word already exists in the word bank!');
      // Handle the case where the word already exists in the word bank
    }
  });
}

function displaySortedWordBank(sortType) {
  chrome.storage.local.get({ wordBank: [] }, function (result) {
    let wordBank = result.wordBank;

    // Sort the word bank based on the selected sorting type
    if (sortType === 'alphabetically') {
      wordBank = wordBank.sort((a, b) => a.word.localeCompare(b.word));
    }

    const wordListElement = document.getElementById('wordList');

    // Clear previous list items
    wordListElement.innerHTML = '';

    // Create list items for each word and append to the word list
    wordBank.forEach(function (wordData) {
      const listItem = document.createElement('li');

      // Create container for word and "Show More" button
      const wordContainer = document.createElement('div');
      wordContainer.classList.add('word-container');

      // Add word text to the container
      const wordText = document.createElement('span');
      wordText.textContent = wordData.word;

      // Create "Show More" button for each word
      const showMoreButton = document.createElement('button');
      showMoreButton.textContent = 'Show More';
      showMoreButton.classList.add('show-more-btn');

      // Append word and button to the container
      wordContainer.appendChild(wordText);
      wordContainer.appendChild(showMoreButton);

      // Append container to the list item
      listItem.appendChild(wordContainer);
      wordListElement.appendChild(listItem);
    });
  });
}

// Function to handle grouping by origin and displaying the word bank
function displayGroupedByOrigin(wordBank) {
  const groupedByOrigin = {};

  // Group words by their origin
  wordBank.forEach(function(wordData) {
    if (!groupedByOrigin[wordData.origin]) {
      groupedByOrigin[wordData.origin] = [];
    }
    groupedByOrigin[wordData.origin].push(wordData);
  });

  const wordListElement = document.getElementById('wordList');

  // Clear previous list items
  wordListElement.innerHTML = '';

  // Display words grouped by origin
  for (const [origin, words] of Object.entries(groupedByOrigin)) {
    const originHeader = document.createElement('h3');
    originHeader.textContent = `Origin: ${origin}`;
    wordListElement.appendChild(originHeader);

    // Create list items for each word within the origin group
    words.forEach(function(wordData) {
      const listItem = document.createElement('li');

      // Create container for word and "Show More" button
      const wordContainer = document.createElement('div');
      wordContainer.classList.add('word-container');

      // Add word text to the container
      const wordText = document.createElement('span');
      wordText.textContent = wordData.word;

      // Create "Show More" button for each word
      const showMoreButton = document.createElement('button');
      showMoreButton.textContent = 'Show More';
      showMoreButton.classList.add('show-more-btn');

      // Append word and button to the container
      wordContainer.appendChild(wordText);
      wordContainer.appendChild(showMoreButton);

      // Append container to the list item
      listItem.appendChild(wordContainer);
      wordListElement.appendChild(listItem);

    });
  }
}

function displayRow(wordData) {
    const listItem = document.createElement('li');

    // Create container for word and "Show More" button
    const wordContainer = document.createElement('div');
    wordContainer.classList.add('word-container');

    // Add word text to the container
    const wordText = document.createElement('span');
    wordText.textContent = wordData.word;

    // Create "Show More" button for each word
    const showMoreButton = document.createElement('button');
    showMoreButton.textContent = 'Show More';
    showMoreButton.classList.add('show-more-btn');

    // Append word and button to the container
    wordContainer.appendChild(wordText);
    wordContainer.appendChild(showMoreButton);

    // Append container to the list item
    listItem.appendChild(wordContainer);
    wordListElement.appendChild(listItem);
}
// Function to add event listener to the sorting radio buttons
function setupSortRadioButtons() {
  const sortRadioButtons = document.getElementsByName('sortOption');
  sortRadioButtons.forEach(function(radioButton) {
    radioButton.addEventListener('change', function() {
      const sortType = this.value;
      if (sortType === 'groupByOrigin') {
        chrome.storage.local.get({ wordBank: [] }, function (result) {
          const wordBank = result.wordBank;
          displayGroupedByOrigin(wordBank);
        });
      } else {
        displaySortedWordBank(sortType);
      }
    });
  });
}

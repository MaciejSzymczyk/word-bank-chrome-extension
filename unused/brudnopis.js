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

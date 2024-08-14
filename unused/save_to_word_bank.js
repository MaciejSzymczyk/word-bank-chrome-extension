
export function saveToWordBank(wordData) {
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
    });
    } else {
    console.log('Word already exists in the word bank:', wordData.word);
    alert('Word already exists in the word bank!');
    // Handle the case where the word already exists in the word bank
    }
});
}


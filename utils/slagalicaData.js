let words = require('./words').words;

function generateLetters(){
    let generatedLetters = []; // Final array with random effect
    let vowels = []; // Vowels, we don't use this
    let nonVowels = []; // NonVowels, we don't use this
    let allLetters = []; // Vowels + NonVowels
  
    let word = words[Math.floor(Math.random() * (words.length - 1))].toUpperCase(); // Chosen word
    let numberOfVowelsInChosenWord = 0; // Number of vowels in chosen word
    let numberOfNonVowelsInChosenWord = 0; // Number of nonVowels in chosen word
    console.log(word);
  
    // Loop through whole word and add letters to corresponding array, increase counters
    for(let i = 0; i < word.length; i++){
      if(isVowel(word[i])){
        vowels.push(word[i]);
        allLetters.push(word[i]);
        numberOfVowelsInChosenWord++;
      }else{
        nonVowels.push(word[i]);
        allLetters.push(word[i]);
        numberOfNonVowelsInChosenWord++;
      }
    }
  
    // Minimum is numberofvowels in chosen word, max is 6, see w3school on Math.random()
    let allowedNumberOfVowels = Math.floor(Math.random() * (7 - numberOfVowelsInChosenWord)) + numberOfVowelsInChosenWord;
  
    // If allowednumberofVowels is 6 and there are 3 vowels in chosen word, chose another 3 vowels
    if(allowedNumberOfVowels > numberOfVowelsInChosenWord){    
      for(let i = 0; i < allowedNumberOfVowels - numberOfVowelsInChosenWord; i++){
        let vowel = randomVowel();
        vowels.push(vowel);
        allLetters.push(vowel);
      }
    }
    
    // Find remaining nonVowels
    for(let i = 0; i < 12 - allowedNumberOfVowels - numberOfNonVowelsInChosenWord; i++){
      let nonVowel = randomLetter();
      nonVowels.push(nonVowel);
      allLetters.push(nonVowel);
    }
  
    // Add random effect to letters
    for(let i = 0; i < 12; i++){
      let index = Math.floor(Math.random() * (allLetters.length - 1)); // Random number from 0 to 11
      generatedLetters.push(allLetters[index]); // Get letter
      allLetters.splice(index, 1); // Delete letter so I don't get it again
    }
  
    let object = {
      words: words, // database for words
      generatedLetters: generatedLetters,
      word: word
    }
  
    return object;
  };
  
  function randomLetter() {
    let characters = 'BVGDĐŽZJKLMNPRSTFHCČŠ'; // LJ NJ DZ missing
  
    return characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  function randomVowel(){
    let characters = 'AEIOU';
  
    return characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  function isVowel(char){
    let vowels = 'AEIOU';
  
    for(let i = 0; i < vowels.length; i++){
      if(vowels[i] == char){
        return true;
      }
    }
  
    return false;
  }

exports.dataForSlagalica = generateLetters;
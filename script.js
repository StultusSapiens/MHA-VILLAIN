// Global variables
let storyData;
let currentChapterIndex = 0;
let currentSceneIndex = 0;
let isAutoMode = false;
let audioContext;
let backgroundMusic;
let typingTimeout;
let isTyping = false;
let isAudioEnabled = true; // Global audio toggle, on by default
let characterSounds = {}; // Object to store character sound effects
let isMusicEnabled = true; // Background music toggle
let isDialogueEnabled = true; // Character dialogue toggle
let currentCharacterAudio = null; // Store currently playing character sound

// DOM elements
const introScreen = document.getElementById('intro-screen');
const storyContainer = document.getElementById('story-container');
const characterName = document.getElementById('characterName');
const typewriter = document.getElementById('typewriter');
const backButton = document.getElementById('backButton');
const autoButton = document.getElementById('autoButton');
const nextButton = document.getElementById('nextButton');
const toggleOptionsButton = document.getElementById('toggle-options-button');
const optionsDropdown = document.getElementById('options-dropdown');
const homeButton = document.getElementById('home-button');
const characterInfoButton = document.getElementById('character-info-button');
const toggleAudioButton = document.getElementById('toggle-audio-button');
const toggleMusicButton = document.getElementById('toggle-music-button');
const toggleDialogueButton = document.getElementById('toggle-dialogue-button');

// Event listeners
document.getElementById('startButton').addEventListener('click', startStory);
backButton.addEventListener('click', goToPreviousScene);
autoButton.addEventListener('click', toggleAutoMode);
toggleOptionsButton.addEventListener('click', toggleOptions);
homeButton.addEventListener('click', goToHome);
characterInfoButton.addEventListener('click', showCharacterInfo);
toggleAudioButton.addEventListener('click', toggleAudio);
toggleMusicButton.addEventListener('click', toggleMusic);
toggleDialogueButton.addEventListener('click', toggleDialogue);
nextButton.addEventListener('click', () => {
  if (isTyping) {
      // If typing is in progress, complete the current dialogue immediately
      clearTypingEffect();
      typewriter.textContent = storyData.chapters[currentChapterIndex].scenes[currentSceneIndex].dialogue.text;
      isTyping = false;
  } else {
      goToNextScene();
  }
});
toggleAudioButton.addEventListener('click', toggleAudio);

// Load story data from JSON
async function loadStoryData() {
    try {
        const response = await fetch('config.json');
        storyData = await response.json();
        customizeUI(storyData.uiConfig);
    } catch (error) {
        console.error('Error loading story data:', error);
    }
}

// Customize UI based on JSON configuration
function customizeUI(uiConfig) {
    Object.entries(uiConfig).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
    });
    document.body.style.fontFamily = uiConfig.fontFamily;
}

// Start the story
function startStory() {
    introScreen.classList.add('fade-out');
    setTimeout(() => {
        introScreen.style.display = 'none';
        storyContainer.classList.remove('hidden');
        storyContainer.classList.add('fade-in');
        loadChapter(currentChapterIndex);
    }, 1000);
}

// Load a chapter
function loadChapter(chapterIndex) {
  const chapter = storyData.chapters[chapterIndex];
  currentSceneIndex = 0;
  loadBackgroundMusic(chapter.backgroundMusic);
  loadScene(chapter.scenes[currentSceneIndex]);
}

// Load a scene
function loadScene(scene) {
    updateBackground(scene.background);
    updateCharacters(scene.characters);
    displayDialogue(scene.dialogue);
    playBackgroundMusic(scene.backgroundMusic);
}

// Update background with smooth transition
function updateBackground(backgroundUrl) {
    const background = document.querySelector('.story-background');
    background.style.opacity = 0;
    setTimeout(() => {
        background.style.backgroundImage = `url(${backgroundUrl})`;
        background.style.opacity = 1;
    }, 500);
}

// Update characters with smooth transition
function updateCharacters(characters) {
    const characterContainer = document.querySelector('.character-container');
    characterContainer.innerHTML = '';
    characters.forEach((char, index) => {
        const charImg = document.createElement('img');
        charImg.src = char.image;
        charImg.alt = char.name;
        charImg.classList.add('character-image');
        charImg.style.opacity = 0;
        charImg.style.transform = 'translateY(50px)';
        characterContainer.appendChild(charImg);
        
        setTimeout(() => {
            charImg.style.opacity = 1;
            charImg.style.transform = 'translateY(0)';
        }, 100 * (index + 1));
    });
}

function clearTypingEffect() {
  clearTimeout(typingTimeout);
  isTyping = false;
}

// Display dialogue with typewriter effect
function displayDialogue(dialogue) {
  clearTypingEffect();
  characterName.textContent = dialogue.speaker;
  typewriter.textContent = '';
  let i = 0;
  const speed = storyData.uiConfig.typingSpeed || 50;

  playCharacterSound(dialogue.speaker);

  function typeWriter() {
      if (i < dialogue.text.length) {
          typewriter.textContent += dialogue.text.charAt(i);
          i++;
          typingTimeout = setTimeout(typeWriter, speed);
      } else if (isAutoMode) {
          setTimeout(goToNextScene, storyData.uiConfig.autoModeDelay || 3000);
      }
      isTyping = i < dialogue.text.length;
  }

  typeWriter();
}


// Play background music
function playBackgroundMusic(musicUrl) {
    if (!isMusicEnabled || !isAudioEnabled) return;

    initAudioContext();
    if (backgroundMusic) backgroundMusic.stop();

    fetch(musicUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            backgroundMusic = audioContext.createBufferSource();
            backgroundMusic.buffer = audioBuffer;
            backgroundMusic.connect(audioContext.destination);
            backgroundMusic.loop = true;
            backgroundMusic.start();
        })
        .catch(error => console.error('Error loading background music:', error));
}

// Navigation functions
function goToPreviousScene() {
    if (currentSceneIndex > 0) {
        currentSceneIndex--;
        loadScene(storyData.chapters[currentChapterIndex].scenes[currentSceneIndex]);
    } else if (currentChapterIndex > 0) {
        currentChapterIndex--;
        const previousChapter = storyData.chapters[currentChapterIndex];
        currentSceneIndex = previousChapter.scenes.length - 1;
        loadScene(previousChapter.scenes[currentSceneIndex]);
    }
}

function goToNextScene() {
  clearTypingEffect();
  const currentChapter = storyData.chapters[currentChapterIndex];
  if (currentSceneIndex < currentChapter.scenes.length - 1) {
      currentSceneIndex++;
      loadScene(currentChapter.scenes[currentSceneIndex]);
  } else if (currentChapterIndex < storyData.chapters.length - 1) {
      currentChapterIndex++;
      currentSceneIndex = 0;
      loadChapter(currentChapterIndex);
  } else {
      endStory();
  }
}

function toggleAutoMode() {
    isAutoMode = !isAutoMode;
    autoButton.textContent = isAutoMode ? 'Manual' : 'Auto';
    autoButton.classList.toggle('active');
    if (isAutoMode && !isTyping) {
        goToNextScene();
    }
}

function toggleOptions() {
    optionsDropdown.classList.toggle('hidden');
}

function goToHome() {
    location.reload();
}

function showCharacterInfo() {
    window.open(storyData.characterInfoUrl, '_blank');
}

// Toggle audio function
function toggleAudio() {
    isAudioEnabled = !isAudioEnabled;
    if (isAudioEnabled) {
        audioContext.resume();
        if (backgroundMusic && isMusicEnabled) backgroundMusic.start();
    } else {
        audioContext.suspend();
        if (backgroundMusic) backgroundMusic.stop();
        if (currentCharacterAudio) currentCharacterAudio.stop();
    }
    updateAudioButtonIcons();
}

function toggleMusic() {
    isMusicEnabled = !isMusicEnabled;
    if (isMusicEnabled && isAudioEnabled && backgroundMusic) {
        backgroundMusic.start();
    } else if (backgroundMusic) {
        backgroundMusic.stop();
    }
    updateMusicButtonIcons();
}

function toggleDialogue() {
    isDialogueEnabled = !isDialogueEnabled;
    updateDialogueButtonIcons();
}

// Load and play background music
function loadBackgroundMusic(musicUrl) {
  if (!isAudioEnabled) return;
  
  initAudioContext();
  
  if (backgroundMusic) {
      backgroundMusic.stop();
  }

  fetch(musicUrl)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
          backgroundMusic = audioContext.createBufferSource();
          backgroundMusic.buffer = audioBuffer;
          backgroundMusic.connect(audioContext.destination);
          backgroundMusic.loop = true;
          backgroundMusic.start();
      })
      .catch(error => console.error('Error loading background music:', error));
}

// Load character sound effects
function loadCharacterSounds() {
  storyData.characters.forEach(character => {
      if (character.soundEffect) {
          fetch(character.soundEffect)
              .then(response => response.arrayBuffer())
              .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
              .then(audioBuffer => {
                  characterSounds[character.name] = audioBuffer;
              })
              .catch(error => console.error(`Error loading sound for ${character.name}:`, error));
      }
  });
}

// Play character sound effect
function playCharacterSound(characterName) {
    if (!isAudioEnabled || !isDialogueEnabled) return;

    initAudioContext();
    const soundBuffer = characterSounds[characterName];
    
    if (currentCharacterAudio) {
        currentCharacterAudio.stop();
    }

    if (soundBuffer) {
        currentCharacterAudio = audioContext.createBufferSource();
        currentCharacterAudio.buffer = soundBuffer;
        currentCharacterAudio.connect(audioContext.destination);
        currentCharacterAudio.start();
    }
}

function updateAudioButtonIcons() {
    toggleAudioButton.innerHTML = isAudioEnabled ? 
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>` :
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>`;
}

function updateMusicButtonIcons() {
    toggleMusicButton.innerHTML = isMusicEnabled ?
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
        </svg>` :
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
            <line x1="9" y1="9" x2="21" y2="7"></line>
        </svg>`;
}

function updateDialogueButtonIcons() {
    toggleDialogueButton.innerHTML = isDialogueEnabled ?
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>` :
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            <line x1="3" y1="21" x2="21" y2="3"></line>
        </svg>`;
}

function endStory() {
  // Create a button element
  const creditsButton = document.createElement('button');
  creditsButton.textContent = 'View Credits';
  creditsButton.className = 'credits-button';
  
  // Set the button's click event to redirect
  creditsButton.onclick = function() {
      window.location.href = storyData.creditsUrl;
  };

  // Clear the existing content and append the button
  const typewriter = document.getElementById('typewriter'); // Make sure to use the correct element ID
  typewriter.innerHTML = '<p>The story has ended.</p>';
  typewriter.appendChild(creditsButton);
  
  // Disable the next button
  nextButton.disabled = true;
}

// Initialize the story
loadStoryData().then(() => {
  console.log('Story data loaded successfully');
  initAudioContext();
  loadCharacterSounds();
  animateBackgroundOrbs();
});

// Initialize audio context
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    updateAudioButtonIcons();
    updateMusicButtonIcons();
    updateDialogueButtonIcons();
}
// Animate background orbs
function animateBackgroundOrbs() {
    const orbs = document.querySelectorAll('.orb');
    orbs.forEach((orb, index) => {
        orb.style.animation = `float ${20 + index * 5}s ease-in-out infinite`;
        orb.style.animationDelay = `${index * 2}s`;
    });
}

// Add smooth scrolling to credits link
document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('credits-link')) {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        window.open(href, '_blank');
    }
});
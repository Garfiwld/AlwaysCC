// Languages offered as subtitle preferences (also used as auto-translate targets)
const LANGUAGES = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani",
  "Basque", "Belarusian", "Bengali", "Bosnian", "Bulgarian", "Catalan",
  "Cebuano", "Chinese (Simplified)", "Chinese (Traditional)", "Corsican",
  "Croatian", "Czech", "Danish", "Dutch", "English", "Esperanto", "Estonian",
  "Finnish", "French", "Frisian", "Galician", "Georgian", "German", "Greek",
  "Gujarati", "Haitian Creole", "Hausa", "Hawaiian", "Hebrew", "Hindi",
  "Hmong", "Hungarian", "Icelandic", "Igbo", "Indonesian", "Irish",
  "Italian", "Japanese", "Javanese", "Kannada", "Kazakh", "Khmer",
  "Kinyarwanda", "Korean", "Kurdish", "Kyrgyz", "Lao", "Latin", "Latvian",
  "Lithuanian", "Luxembourgish", "Macedonian", "Malagasy", "Malay",
  "Malayalam", "Maltese", "Maori", "Marathi", "Mongolian",
  "Myanmar (Burmese)", "Nepali", "Norwegian", "Nyanja (Chichewa)",
  "Odia (Oriya)", "Pashto", "Persian", "Polish", "Portuguese", "Punjabi",
  "Romanian", "Russian", "Samoan", "Scots Gaelic", "Serbian", "Sesotho",
  "Shona", "Sindhi", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish",
  "Sundanese", "Swahili", "Swedish", "Tagalog (Filipino)", "Tajik", "Tamil",
  "Tatar", "Telugu", "Thai", "Turkish", "Turkmen", "Ukrainian", "Urdu",
  "Uyghur", "Uzbek", "Vietnamese", "Welsh", "Xhosa", "Yiddish", "Yoruba",
  "Zulu"
];

const DEFAULT_LANGUAGE = "Thai";

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const enabledToggle = document.getElementById('enabled-toggle');
  const subtitlePreference = document.getElementById('subtitle-preference');
  const status = document.getElementById('status');

  // Populate the language list
  LANGUAGES.forEach(language => {
    const option = document.createElement('option');
    option.value = language;
    option.textContent = language;
    subtitlePreference.appendChild(option);
  });

  // Load saved preference (default to Thai if none saved yet)
  chrome.storage.sync.get('preferredSubtitle').then((result) => {
    subtitlePreference.value = result.preferredSubtitle || DEFAULT_LANGUAGE;
  }).catch(error => {
    console.error("Error loading preferences:", error);
  });

  // Load enabled state (default to enabled if none saved yet)
  chrome.storage.sync.get('extensionEnabled').then((result) => {
    enabledToggle.checked = result.extensionEnabled !== false;
  }).catch(error => {
    console.error("Error loading enabled state:", error);
  });

  // Save enabled state immediately when toggled
  enabledToggle.addEventListener('change', function() {
    chrome.storage.sync.set({
      extensionEnabled: enabledToggle.checked
    }).catch(error => {
      console.error("Error saving enabled state:", error);
    });
  });

  // Save preference immediately when the language selection changes
  subtitlePreference.addEventListener('change', function() {
    const preferredValue = subtitlePreference.value;

    chrome.storage.sync.set({
      preferredSubtitle: preferredValue
    }).then(() => {
      status.textContent = 'Saved!';
      status.style.color = '#080';

      setTimeout(() => {
        status.textContent = '';
      }, 1500);
    }).catch(error => {
      status.textContent = 'Error saving preference.';
      status.style.color = '#c00';
      console.error("Error saving preference:", error);
    });
  });
});

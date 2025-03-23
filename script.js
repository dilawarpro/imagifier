const promptForm = document.querySelector(".prompt-form");
const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const generateBtn = document.querySelector(".generate-btn");
const galleryGrid = document.querySelector(".gallery-grid");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const API_KEY = "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";

const examplePrompts = [
  "A breathtakingly beautiful girl in a micro bikini, lying on a sunbed, her flawless curves glistening with tanning oil as she tilts her sunglasses and smiles seductively.",
  "A cute and sexy girl in a tiny crop top and ultra-short denim shorts, leaning against a classic convertible, biting her lip playfully as the wind teases her hair.",
  "A stunning beach goddess in a barely-there string bikini, stepping out of the ocean, water dripping down her sun-kissed skin as she runs her fingers through her wet hair.",
  "A seductive college girl in a tight white tank top and mini skirt, sitting on a desk with one leg crossed, twirling a pen between her lips as she smirks teasingly.",
  "A gorgeous roller-skating girl in booty shorts and a tied-up crop top, gliding down a palm-lined boulevard, her toned legs and playful smile radiating summer vibes.",
  "A wild and untamed beauty in a silky red dress with a deep slit, dancing barefoot in the rain, her wet clothes clinging to every curve as she tilts her head back in bliss.",
  "A sultry cowgirl in ultra-tight daisy dukes and a tied plaid shirt, standing against a wooden fence, her toned stomach exposed as she tips her hat with a wicked grin.",
  "A temptress in silk sheets, wearing only a lacy nightgown, lying back with a knowing smile as moonlight casts a glow on her flawless skin and tousled hair.",
  "A sexy cyberpunk babe in a neon-lit nightclub, wearing a glowing bodysuit that hugs her curves perfectly, her intense gaze and confident smirk radiating pure allure.",
  "A ravishing bikini model lying on a luxury yacht, sipping a cocktail as the sun highlights every perfect curve of her flawless, tanned body.",
  
  "A ruggedly handsome man in an unbuttoned white shirt, standing on a tropical beach, his chiseled abs glistening under the sunset as he runs a hand through his messy hair.",
  "A playful and flirty guy at a pool party, wearing only swim trunks, splashing water as he flashes a teasing, sexy smile that melts hearts instantly."
];



// Set theme based on saved preference or system default
(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
  document.body.classList.toggle("dark-theme", isDarkTheme);
  themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();
// Switch between light and dark themes
const toggleTheme = () => {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};
// Calculate width/height based on chosen ratio
const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);
  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);
  // Ensure dimensions are multiples of 16 (AI model requirements)
  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;
  return { width: calculatedWidth, height: calculatedHeight };
};
// Convert blob to base64 data URL
const blobToDataURL = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
// Replace loading spinner with the actual image and add Fancybox link and download button
const updateImageCard = async (index, blob) => {
  const imageUrl = await blobToDataURL(blob); // Convert blob to base64
  const fileName = `imagifier.dilawarpro.com Image ${index + 1}.png`; // Set a prefixed file name
  const imgCard = document.getElementById(`img-card-${index}`);
  if (!imgCard) return;
  imgCard.classList.remove("loading");
  imgCard.innerHTML = `
    <a data-fancybox="gallery" href="${imageUrl}" class="fancybox-link">
      <img class="result-img" src="${imageUrl}" alt="Generated Image" />
    </a>
    <a href="${imageUrl}" download="${fileName}" class="img-download-btn" title="Download Image">
      <i class="fa-solid fa-download"></i>
    </a>`;
};
// Initialize Fancybox with a download button
Fancybox.bind("[data-fancybox='gallery']", {
  Toolbar: {
    display: ["download", "close"],
  },
  Buttons: {
    download: {
      tpl: '<a download data-fancybox-download class="fancybox__button fancybox__button--download" title="Download" href="{{src}}">' +
           '<i class="fa-solid fa-download"></i>' +
           "</a>",
    },
  },
  Thumbs: {
    autoStart: true,
  },
});
// Send requests to Hugging Face API to create images
const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
  const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
  const { width, height } = getImageDimensions(aspectRatio);
  generateBtn.setAttribute("disabled", "true");
  // Create an array of image generation promises
  const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
    try {
      // Send request to the AI model API
      const response = await fetch(MODEL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "x-use-cache": "false",
        },
        body: JSON.stringify({
          inputs: promptText,
          parameters: { width, height },
        }),
      });
      if (!response.ok) throw new Error((await response.json())?.error);
      // Convert response to a blob and update the image card
      const blob = await response.blob();
      updateImageCard(i, blob);
    } catch (error) {
      console.error(error);
      const imgCard = document.getElementById(`img-card-${i}`);
      imgCard.classList.replace("loading", "error");
      imgCard.querySelector(".status-text").textContent = "Generation failed! Check console for more details.";
    }
  });
  await Promise.allSettled(imagePromises);
  generateBtn.removeAttribute("disabled");
};
// Show gallery grid after images are generated
const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
  galleryGrid.style.display = "grid"; // Show the gallery grid
  galleryGrid.innerHTML = "";
  for (let i = 0; i < imageCount; i++) {
    galleryGrid.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
      </div>`;
  }
  // Stagger animation
  document.querySelectorAll(".img-card").forEach((card, i) => {
    setTimeout(() => card.classList.add("animate-in"), 100 * i);
  });
  generateImages(selectedModel, imageCount, aspectRatio, promptText); // Generate Images
};
// Handle form submission
const handleFormSubmit = (e) => {
  e.preventDefault();
  // Get form values
  const selectedModel = modelSelect.value;
  const imageCount = parseInt(countSelect.value) || 1;
  const aspectRatio = ratioSelect.value || "1/1";
  const promptText = promptInput.value.trim();
  createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};
// Fill prompt input with random example (typing effect)
promptBtn.addEventListener("click", () => {
  const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  let i = 0;
  promptInput.focus();
  promptInput.value = "";
  // Disable the button during typing animation
  promptBtn.disabled = true;
  promptBtn.style.opacity = "0.5";
  // Typing effect
  const typeInterval = setInterval(() => {
    if (i < prompt.length) {
      promptInput.value += prompt.charAt(i);
      i++;
    } else {
      clearInterval(typeInterval);
      promptBtn.disabled = false;
      promptBtn.style.opacity = "0.8";
    }
  }, 10); // Speed of typing
});
themeToggle.addEventListener("click", toggleTheme);
promptForm.addEventListener("submit", handleFormSubmit);

// Add event listener for image preview
document.querySelector('.gallery-grid').addEventListener('click', (event) => {
  if (event.target.tagName === 'IMG') {
    const imageUrl = event.target.src;
    const previewImage = document.getElementById('previewImage');
    const downloadImage = document.getElementById('downloadImage');

    previewImage.src = imageUrl;
    downloadImage.href = imageUrl;

    const imagePreviewModal = new bootstrap.Modal(document.getElementById('imagePreviewModal'));
    imagePreviewModal.show();
  }
});
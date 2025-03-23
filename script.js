const promptForm = document.querySelector(".prompt-form");
const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const generateBtn = document.querySelector(".generate-btn");
const galleryGrid = document.querySelector(".gallery-grid");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const API_KEY = "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"; // Hugging Face API Key
// Example prompts
const examplePrompts = [
  "A colossal tree with an entire futuristic city built within its glowing, twisting roots and branches, floating in the sky above a neon-lit ocean.",
  "A mystical black cat with cosmic eyes, walking along the edge of a glowing portal that reveals a parallel universe filled with floating islands and celestial creatures.",
  "A forgotten temple submerged in crystal-clear water, where ancient statues of deities are covered in coral, and fish swim through the remains of a lost civilization.",
  "A nomadic caravan traveling across a desert of shifting, golden dunes under a sky filled with floating whale-like creatures that glow with soft, pulsating light.",
  "A clockwork phoenix rising from a storm of metallic feathers, its body made of intricate gears and glowing molten energy, soaring over a futuristic cityscape.",
  "A hidden doorway in a forest that leads to a secret garden floating in the void, where gravity bends, and waterfalls flow in reverse toward the sky.",
  "A celestial dragon made of pure stardust, coiling around a massive ringed planet, with its eyes glowing like miniature galaxies.",
  "A tiny village built inside the petals of a massive, bioluminescent flower that blooms only under the light of a mysterious blue moon.",
  "An astronaut exploring the ruins of an ancient alien civilization on a distant planet, where glowing hieroglyphs shift and change as they step closer.",
  "A lighthouse standing at the edge of a floating sea, its beam illuminating a sky filled with ghostly ships sailing through the clouds.",
  "A mystical bakery where enchanted pastries float in the air, changing colors and shapes, while a witch in a starry apron prepares a cake that shimmers like the night sky.",
  "A futuristic samurai, clad in high-tech armor with glowing neon accents, standing atop a rain-soaked rooftop in a cyberpunk city filled with holograms and flying lanterns.",
  "A lost library hidden beneath a frozen lake, where ancient books encased in ice glow softly, revealing glimpses of forgotten knowledge.",
  "A lone traveler standing before a colossal stone doorway carved into a mountain, where mysterious glowing runes shift and rearrange themselves like a living puzzle.",
  "A surreal carnival where the rides float in midair, the roller coasters twist through interdimensional portals, and the cotton candy glows like tiny galaxies."
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
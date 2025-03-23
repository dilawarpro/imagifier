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
  "A breathtakingly beautiful woman in a sheer, flowing red gown, standing on a balcony at midnight, the city lights illuminating her flawless curves as she gazes seductively at the viewer.",
  "A sultry femme fatale with smoldering eyes, dressed in a form-fitting black dress with a dangerously high slit, leaning against a luxury sports car under neon city lights.",
  "A stunning woman stepping out of a crystal-clear infinity pool, water droplets glistening on her sun-kissed skin as she looks over her shoulder with a teasing smile.",
  "A seductive belly dancer in an exotic golden outfit, her toned body moving hypnotically as glowing lanterns cast flickering shadows on her shimmering curves.",
  "A confident woman in a lace corset and silk robe, standing at the window of a high-rise penthouse, her hair tousled as the cityscape glows behind her.",
  "A beach goddess in a barely-there bikini, lying on golden sand with waves gently caressing her body, her piercing gaze full of temptation and desire.",
  "A dark enchantress in a figure-hugging, off-the-shoulder black dress, casting a spell with her intense gaze as glowing magical symbols swirl around her.",
  "A cyberpunk seductress in a neon-lit club, her glowing tattoos tracing along her curves, her metallic bodysuit accentuating every move as she leans in with a playful smirk.",
  "A sultry cowgirl leaning against a wooden fence, her tight denim shorts hugging her hips as she tips her hat and flashes a wickedly inviting smile.",
  "A stunning fashion model on a dimly lit runway, her sheer dress flowing around her as she walks with a hypnotic, slow stride, exuding pure confidence and allure.",
  "A temptress in silk sheets, her body draped in the soft fabric as she lies back with a knowing smile, moonlight casting a glow on her flawless skin.",
  "A passionate tango dancer in a dangerously low-cut dress, pressed against her partner as they move in perfect harmony, their chemistry almost tangible.",
  "A wild, untamed beauty dancing in the rain, her wet dress clinging to her curves as she tilts her head back, lost in the moment of raw sensuality.",
  "A powerful queen in a barely-there golden ensemble, lounging on a throne adorned with crimson velvet, her gaze commanding yet filled with untamed passion.",
  "A seductive masked woman at an exclusive masquerade ball, her lace mask enhancing the mystery in her smoldering eyes as she teases the viewer with a playful smile."
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
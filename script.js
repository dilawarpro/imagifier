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
  "A highly advanced humanoid robot with a sleek, metallic exoskeleton, glowing blue eyes, and intricate mechanical joints, standing in a futuristic research lab surrounded by holographic displays and AI-driven tools.",
  "A towering cybernetic mech with reinforced armor, standing in a neon-lit cityscape as drones hover around it, scanning the area with glowing sensors.",
  "A biomechanical AI-powered drone with articulated limbs and adaptive wings, soaring over a futuristic megacity, scanning skyscrapers with precision lasers.",
  "A hyper-realistic robotic police unit patrolling a bustling futuristic metropolis, equipped with cutting-edge surveillance systems and non-lethal crowd control tech.",
  "A self-learning AI android with synthetic skin and exposed circuitry, sitting in a high-tech lounge, processing vast amounts of data through a holographic interface.",
  "A highly detailed robotic arm assembling microchips with extreme precision in a fully automated AI-driven factory, surrounded by an army of smaller robotic assistants.",
  "A colossal cybernetic war machine walking through a battlefield, its mechanical limbs covered in reinforced plating while tactical drones provide real-time battlefield analysis.",
  "A futuristic robotic chef in a high-tech kitchen, preparing gourmet dishes with precision laser-cutting tools, molecular gastronomy technology, and AI-assisted plating.",
  "A swarm of tiny nanobot repair drones working together to fix a damaged spacecraft, seamlessly moving in perfect synchronization to rebuild its exterior.",
  "A cybernetically enhanced robotic dog with a sleek carbon-fiber exoskeleton and AI-powered tracking systems, sprinting through a futuristic park alongside autonomous drones.",
  "A towering industrial construction robot welding a skyscraper in real-time, its arms extending with telescopic precision while AR-guided drones monitor the structure.",
  "A next-generation rescue robot navigating through disaster rubble using AI-driven sensors, deploying micro-drones to locate survivors with infrared scanning.",
  "A futuristic sentient AI housed within a towering glass and metal server hub, its core pulsating with streams of glowing data as quantum processors compute at unimaginable speeds.",
  "A sleek autonomous racing robot speeding through a neon-lit track, its AI-driven aerodynamic design shifting dynamically to optimize speed and efficiency.",
  "An advanced robotic astronaut exploring the surface of an exoplanet, its body covered in adaptive plating, equipped with AI-driven sensors scanning for signs of alien life.",
  "A hyper-realistic robotic sculptor using AI to carve intricate designs into metal and stone, creating breathtaking futuristic art in an avant-garde gallery.",
  "A futuristic AI-powered robotic medic performing life-saving surgery with laser precision, its articulated limbs adjusting dynamically while a holographic display provides real-time data.",
  "A battle-ready exosuit with retractable plasma weapons, worn by a highly advanced robotic soldier standing in a cyberpunk warzone with neon lights reflecting off its armor.",
  "A quantum-powered AI hub, where thousands of interconnected robotic processors form a vast neural network, glowing softly as they exchange data in real time.",
  "A massive robotic cargo carrier with hydraulic limbs, lifting entire shipping containers effortlessly at a high-tech, fully automated spaceport.",
  "A futuristic robotic wildlife park where AI-driven mechanical animals roam freely, replicating the behaviors of real creatures in a perfect synthetic ecosystem."
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
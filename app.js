class RecipeFinder {
  constructor() {
    this.ingredients = new Set()
    this.baseUrl = "https://www.themealdb.com/api/json/v1/1"
    this.favorites = JSON.parse(localStorage.getItem("favorites")) || {}
    this.mealPlan = JSON.parse(localStorage.getItem("mealPlan")) || {}
    this.darkMode = localStorage.getItem("darkMode") === "true"
    this.setupEventListeners()
    this.initializeApp()
    this.applyTheme()
  }

  async initializeApp() {
    await this.loadCategories()
    await this.loadAreas()
    this.showSection("search")
    this.renderFavorites()
    this.renderMealPlan()
  }

  setupEventListeners() {
    // Navigation
    document.querySelector(".nav-links").addEventListener("click", (e) => {
      if (e.target.classList.contains("nav-btn")) {
        this.showSection(e.target.dataset.section)
      }
    })

    // Mobile menu toggle
    document.getElementById("mobile-menu-toggle").addEventListener("click", () => {
      document.querySelector(".nav-links").classList.toggle("show-mobile-menu")
    })

    // Search by name
    document.getElementById("recipe-search").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.searchByName()
      }
    })
    document.getElementById("search-by-name-btn").addEventListener("click", () => {
      this.searchByName()
    })

    // Ingredients
    document.getElementById("ingredient-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.addIngredient()
      }
    })
    document.getElementById("add-ingredient").addEventListener("click", () => {
      this.addIngredient()
    })
    document.getElementById("voice-input-btn").addEventListener("click", () => {
      this.startVoiceInput()
    })
    document.getElementById("search-recipes").addEventListener("click", () => {
      this.searchByIngredients()
    })
    document.getElementById("clear-ingredients").addEventListener("click", () => {
      this.clearIngredients()
    })

    // Filters
    document.getElementById("category-filter").addEventListener("change", (e) => {
      this.filterByCategory(e.target.value)
    })
    document.getElementById("area-filter").addEventListener("change", (e) => {
      this.filterByArea(e.target.value)
    })

    // Modal
    document.querySelector(".close").addEventListener("click", () => this.closeModal())
    window.addEventListener("click", (e) => {
      if (e.target === document.getElementById("recipe-modal")) {
        this.closeModal()
      }
    })

    // Dark mode toggle
    document.getElementById("dark-mode-toggle").addEventListener("click", () => {
      this.toggleDarkMode()
    })

    // Newsletter form
    document.getElementById("newsletter-form").addEventListener("submit", (e) => {
      e.preventDefault()
      const email = document.getElementById("newsletter-email").value
      this.showToast(`Thanks for subscribing with ${email}!`, "success")
      document.getElementById("newsletter-email").value = ""
    })
  }

  // Theme Management
  applyTheme() {
    if (this.darkMode) {
      document.body.classList.add("dark-mode")
      document.getElementById("dark-mode-toggle").innerHTML = '<i class="fas fa-sun"></i>'
    } else {
      document.body.classList.remove("dark-mode")
      document.getElementById("dark-mode-toggle").innerHTML = '<i class="fas fa-moon"></i>'
    }
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode
    localStorage.setItem("darkMode", this.darkMode)
    this.applyTheme()
  }

  // Navigation and Section Management
  showSection(sectionName) {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.section === sectionName)
    })

    document.querySelectorAll("section").forEach((section) => {
      section.classList.remove("active-section")
    })

    const section = document.getElementById(`${sectionName}-section`)
    if (section) {
      section.classList.add("active-section")

      // Special section handling
      if (sectionName === "random") this.loadRandomRecipe()
      if (sectionName === "favorites") this.renderFavorites()
      if (sectionName === "meal-plan") this.renderMealPlan()

      // Close mobile menu after selection
      document.querySelector(".nav-links").classList.remove("show-mobile-menu")
    }
  }

  // API Calls
  async fetchData(endpoint) {
    this.showLoading()
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`)
      if (!response.ok) throw new Error("Network response was not ok")
      return await response.json()
    } catch (error) {
      console.error("API Error:", error)
      this.showError("Failed to fetch data. Please try again.")
      return null
    } finally {
      this.hideLoading()
    }
  }

  // Loading and Error Management
  showLoading() {
    document.getElementById("loading-spinner").style.display = "flex"
  }

  hideLoading() {
    document.getElementById("loading-spinner").style.display = "none"
  }

  showError(message) {
    this.showToast(message, "error")
  }

  showToast(message, type = "info") {
    const toast = document.createElement("div")
    toast.className = `toast ${type}`
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas ${type === "error" ? "fa-exclamation-circle" : type === "success" ? "fa-check-circle" : "fa-info-circle"}"></i>
        <span>${message}</span>
      </div>
      <button class="toast-close"><i class="fas fa-times"></i></button>
    `

    document.getElementById("toast-container").appendChild(toast)

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      toast.classList.add("toast-hide")
      setTimeout(() => toast.remove(), 300)
    }, 5000)

    // Close button
    toast.querySelector(".toast-close").addEventListener("click", () => {
      toast.classList.add("toast-hide")
      setTimeout(() => toast.remove(), 300)
    })
  }

  // Ingredient Management
  addIngredient() {
    const input = document.getElementById("ingredient-input")
    const ingredient = input.value.trim().toLowerCase()

    if (ingredient && !this.ingredients.has(ingredient)) {
      this.ingredients.add(ingredient)
      this.renderIngredients()
      input.value = ""
    }
  }

  removeIngredient(ingredient) {
    this.ingredients.delete(ingredient)
    this.renderIngredients()
  }

  clearIngredients() {
    this.ingredients.clear()
    this.renderIngredients()
  }

  renderIngredients() {
    const container = document.getElementById("ingredients-list")
    container.innerHTML = ""

    if (this.ingredients.size === 0) {
      container.innerHTML = '<div class="no-ingredients">No ingredients added yet</div>'
      return
    }

    this.ingredients.forEach((ingredient) => {
      const tag = document.createElement("div")
      tag.className = "ingredient-tag"
      tag.innerHTML = `
        ${ingredient}
        <button class="remove-ingredient" onclick="recipeFinder.removeIngredient('${ingredient}')">
          <i class="fas fa-times"></i>
        </button>
      `
      container.appendChild(tag)
    })
  }

  // Voice Input
  startVoiceInput() {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onstart = () => {
        document.getElementById("voice-input-btn").classList.add("recording")
        this.showToast("Listening...", "info")
      }

      recognition.onend = () => {
        document.getElementById("voice-input-btn").classList.remove("recording")
      }

      recognition.onresult = (event) => {
        const ingredient = event.results[0][0].transcript.toLowerCase()
        document.getElementById("ingredient-input").value = ingredient
        this.addIngredient()
      }

      recognition.onerror = (event) => {
        this.showError("Voice recognition error: " + event.error)
      }

      recognition.start()
    } else {
      this.showError("Voice input is not supported in your browser.")
    }
  }

  // Search and Filter Functions
  async searchByName() {
    const searchTerm = document.getElementById("recipe-search").value.trim()
    if (!searchTerm) {
      this.showError("Please enter a search term")
      return
    }

    const data = await this.fetchData(`/search.php?s=${encodeURIComponent(searchTerm)}`)
    if (data && data.meals) {
      this.displayResults(data.meals)
    } else {
      this.displayResults([])
    }
  }

  async searchByIngredients() {
    if (this.ingredients.size === 0) {
      this.showError("Please add at least one ingredient.")
      return
    }

    const mainIngredient = Array.from(this.ingredients)[0]
    const data = await this.fetchData(`/filter.php?i=${encodeURIComponent(mainIngredient)}`)

    if (data && data.meals) {
      const detailedRecipes = await Promise.all(
        data.meals.slice(0, 15).map((meal) => this.fetchData(`/lookup.php?i=${meal.idMeal}`)),
      )

      const filteredMeals = detailedRecipes
        .filter((data) => data && data.meals && data.meals[0])
        .map((data) => data.meals[0])
        .filter((recipe) => this.matchesIngredients(recipe))

      this.displayResults(filteredMeals)
    } else {
      this.displayResults([])
    }
  }

  async filterByCategory(category) {
    if (!category) return

    const data = await this.fetchData(`/filter.php?c=${encodeURIComponent(category)}`)
    if (data && data.meals) {
      this.displayResults(data.meals)
    }
  }

  async filterByArea(area) {
    if (!area) return

    const data = await this.fetchData(`/filter.php?a=${encodeURIComponent(area)}`)
    if (data && data.meals) {
      this.displayResults(data.meals)
    }
  }

  // Data Loading Functions
  async loadCategories() {
    const data = await this.fetchData("/categories.php")
    if (data && data.categories) {
      this.updateCategoryFilter(data.categories)
      this.updateCategoriesGrid(data.categories)
    }
  }

  updateCategoryFilter(categories) {
    const select = document.getElementById("category-filter")
    select.innerHTML = '<option value="">All Categories</option>'

    categories.forEach((category) => {
      const option = document.createElement("option")
      option.value = category.strCategory
      option.textContent = category.strCategory
      select.appendChild(option)
    })
  }

  updateCategoriesGrid(categories) {
    const grid = document.querySelector("#categories-section .categories-grid")
    grid.innerHTML = ""

    categories.forEach((category) => {
      const card = document.createElement("div")
      card.className = "category-card"
      card.onclick = () => {
        this.filterByCategory(category.strCategory)
        this.showSection("results")
      }

      card.innerHTML = `
        <img src="${category.strCategoryThumb}" alt="${category.strCategory}">
        <h3>${category.strCategory}</h3>
        <p>${category.strCategoryDescription.substring(0, 100)}...</p>
      `

      grid.appendChild(card)
    })
  }

  async loadAreas() {
    const data = await this.fetchData("/list.php?a=list")
    if (data && data.meals) {
      this.updateAreaFilter(data.meals)
      this.updateAreasGrid(data.meals)
    }
  }

  updateAreaFilter(areas) {
    const select = document.getElementById("area-filter")
    select.innerHTML = '<option value="">All Cuisines</option>'

    areas.forEach((area) => {
      const option = document.createElement("option")
      option.value = area.strArea
      option.textContent = area.strArea
      select.appendChild(option)
    })
  }

  updateAreasGrid(areas) {
    const grid = document.querySelector("#areas-section .areas-grid")
    grid.innerHTML = ""

    // Map of country codes for flags
    const countryCodes = {
      American: "us",
      British: "gb",
      Canadian: "ca",
      Chinese: "cn",
      Dutch: "nl",
      Egyptian: "eg",
      French: "fr",
      Greek: "gr",
      Indian: "in",
      Irish: "ie",
      Italian: "it",
      Jamaican: "jm",
      Japanese: "jp",
      Kenyan: "ke",
      Malaysian: "my",
      Mexican: "mx",
      Moroccan: "ma",
      Polish: "pl",
      Portuguese: "pt",
      Russian: "ru",
      Spanish: "es",
      Thai: "th",
      Tunisian: "tn",
      Turkish: "tr",
      Vietnamese: "vn",
    }

    areas.forEach((area) => {
      const countryCode = countryCodes[area.strArea] || "unknown"
      const card = document.createElement("div")
      card.className = "area-card"
      card.onclick = () => {
        this.filterByArea(area.strArea)
        this.showSection("results")
      }

      card.innerHTML = `
        <div class="area-flag">
          ${
            countryCode !== "unknown"
              ? `<img src="https://flagcdn.com/48x36/${countryCode}.png" alt="${area.strArea} flag">`
              : `<i class="fas fa-globe"></i>`
          }
        </div>
        <h3>${area.strArea} Cuisine</h3>
      `

      grid.appendChild(card)
    })
  }

  async loadRandomRecipe() {
    const data = await this.fetchData("/random.php")
    if (data && data.meals) {
      document.getElementById("random-section").innerHTML = this.createDetailedRecipeCard(data.meals[0])
    }
  }

  // Display Functions
  displayResults(meals) {
    const container = document.getElementById("results-section")
    container.innerHTML = ""

    if (!meals || meals.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search" aria-hidden="true"></i>
          <p>No recipes found. Try different search terms or filters.</p>
          <button class="btn primary" onclick="recipeFinder.showSection('search')">
            <i class="fas fa-arrow-left"></i> Back to Search
          </button>
        </div>`
      return
    }

    const resultsHeader = document.createElement("div")
    resultsHeader.className = "results-header"
    resultsHeader.innerHTML = `
      <h2>Found ${meals.length} Recipe${meals.length !== 1 ? "s" : ""}</h2>
      <div class="results-actions">
        <button class="btn" onclick="recipeFinder.showSection('search')">
          <i class="fas fa-arrow-left"></i> Back to Search
        </button>
      </div>
    `
    container.appendChild(resultsHeader)

    const resultsGrid = document.createElement("div")
    resultsGrid.className = "results-grid"
    container.appendChild(resultsGrid)

    meals.forEach((meal) => {
      resultsGrid.appendChild(this.createRecipeCard(meal))
    })
  }

  createRecipeCard(meal) {
    const isFavorite = this.favorites[meal.idMeal]
    const card = document.createElement("div")
    card.className = "recipe-card"

    card.innerHTML = `
      <div class="recipe-card-image">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
        <button class="favorite-btn ${isFavorite ? "active" : ""}" 
          onclick="event.stopPropagation(); recipeFinder.toggleFavorite('${meal.idMeal}', '${meal.strMeal.replace(/'/g, "\\'")}', '${meal.strMealThumb}')">
          <i class="fas ${isFavorite ? "fa-heart" : "fa-heart"}"></i>
        </button>
      </div>
      <div class="recipe-card-content">
        <h3>${meal.strMeal}</h3>
        <div class="recipe-meta">
          <span><i class="fas fa-globe"></i> ${meal.strArea || "Various"}</span>
          <span><i class="fas fa-tag"></i> ${meal.strCategory || "General"}</span>
        </div>
        <button class="btn view-recipe" onclick="recipeFinder.showRecipeDetails('${meal.idMeal}')">
          View Recipe
        </button>
      </div>
    `

    return card
  }

  async showRecipeDetails(id) {
    const data = await this.fetchData(`/lookup.php?i=${id}`)
    if (data && data.meals) {
      const recipe = data.meals[0]
      const modal = document.getElementById("recipe-modal")
      const content = document.getElementById("modal-recipe-content")

      content.innerHTML = this.createDetailedRecipeCard(recipe)

      // Setup rating system
      this.setupRatingSystem(recipe.idMeal)

      // Setup meal planning
      this.setupMealPlanning(recipe)

      modal.style.display = "block"

      // Setup sharing
      this.setupSharing(recipe)
    }
  }

  closeModal() {
    document.getElementById("recipe-modal").style.display = "none"
  }

  // Favorites Management
  toggleFavorite(id, name, image) {
    if (this.favorites[id]) {
      delete this.favorites[id]
      this.showToast(`Removed ${name} from favorites`, "info")
    } else {
      this.favorites[id] = {
        id: id,
        name: name,
        image: image,
        dateAdded: new Date().toISOString(),
      }
      this.showToast(`Added ${name} to favorites`, "success")
    }

    localStorage.setItem("favorites", JSON.stringify(this.favorites))

    // Update UI
    const favBtns = document.querySelectorAll(`.favorite-btn[onclick*="${id}"]`)
    favBtns.forEach((btn) => {
      btn.classList.toggle("active", this.favorites[id] !== undefined)
    })

    // Update favorites section if visible
    if (document.getElementById("favorites-section").classList.contains("active-section")) {
      this.renderFavorites()
    }
  }

  renderFavorites() {
    const container = document.getElementById("favorites-section")
    container.innerHTML = ""

    const favoritesArray = Object.values(this.favorites)

    if (favoritesArray.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-heart-broken" aria-hidden="true"></i>
          <p>You haven't saved any favorites yet.</p>
          <button class="btn primary" onclick="recipeFinder.showSection('search')">
            Find Recipes
          </button>
        </div>`
      return
    }

    const header = document.createElement("div")
    header.className = "section-header"
    header.innerHTML = `<h2>Your Favorite Recipes</h2>`
    container.appendChild(header)

    const grid = document.createElement("div")
    grid.className = "favorites-grid"
    container.appendChild(grid)

    favoritesArray.forEach((favorite) => {
      const card = document.createElement("div")
      card.className = "favorite-card"
      card.innerHTML = `
        <div class="favorite-card-image">
          <img src="${favorite.image}" alt="${favorite.name}" loading="lazy">
          <button class="remove-favorite" onclick="recipeFinder.toggleFavorite('${favorite.id}', '${favorite.name.replace(/'/g, "\\'")}', '${favorite.image}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="favorite-card-content">
          <h3>${favorite.name}</h3>
          <button class="btn view-recipe" onclick="recipeFinder.showRecipeDetails('${favorite.id}')">
            View Recipe
          </button>
        </div>
      `
      grid.appendChild(card)
    })
  }

  // Meal Planning
  addToMealPlan(recipeId, recipeName, recipeImage, date) {
    if (!this.mealPlan[date]) {
      this.mealPlan[date] = []
    }

    // Check if already in meal plan for this date
    const existingIndex = this.mealPlan[date].findIndex((meal) => meal.id === recipeId)

    if (existingIndex >= 0) {
      this.showToast(`${recipeName} is already in your meal plan for ${new Date(date).toLocaleDateString()}`, "info")
      return
    }

    this.mealPlan[date].push({
      id: recipeId,
      name: recipeName,
      image: recipeImage,
    })

    localStorage.setItem("mealPlan", JSON.stringify(this.mealPlan))
    this.showToast(`Added ${recipeName} to your meal plan for ${new Date(date).toLocaleDateString()}`, "success")

    // Update meal plan section if visible
    if (document.getElementById("meal-plan-section").classList.contains("active-section")) {
      this.renderMealPlan()
    }
  }

  removeFromMealPlan(date, index) {
    if (this.mealPlan[date] && this.mealPlan[date][index]) {
      const recipeName = this.mealPlan[date][index].name
      this.mealPlan[date].splice(index, 1)

      // Remove the date if no meals left
      if (this.mealPlan[date].length === 0) {
        delete this.mealPlan[date]
      }

      localStorage.setItem("mealPlan", JSON.stringify(this.mealPlan))
      this.showToast(`Removed ${recipeName} from your meal plan`, "info")

      // Update meal plan section
      this.renderMealPlan()
    }
  }

  setupMealPlanning(recipe) {
    const mealPlanSection = document.getElementById("meal-plan-form")

    // Get next 7 days
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      dates.push({
        value: date.toISOString().split("T")[0],
        label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      })
    }

    mealPlanSection.innerHTML = `
      <h3>Add to Meal Plan</h3>
      <div class="meal-plan-form">
        <select id="meal-plan-date">
          ${dates.map((date) => `<option value="${date.value}">${date.label}</option>`).join("")}
        </select>
        <button class="btn primary" id="add-to-meal-plan">
          <i class="fas fa-calendar-plus"></i> Add to Meal Plan
        </button>
      </div>
    `

    document.getElementById("add-to-meal-plan").addEventListener("click", () => {
      const date = document.getElementById("meal-plan-date").value
      this.addToMealPlan(recipe.idMeal, recipe.strMeal, recipe.strMealThumb, date)
    })
  }

  renderMealPlan() {
    const container = document.getElementById("meal-plan-section")
    container.innerHTML = ""

    const dates = Object.keys(this.mealPlan).sort()

    if (dates.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-calendar" aria-hidden="true"></i>
          <p>You haven't planned any meals yet.</p>
          <button class="btn primary" onclick="recipeFinder.showSection('search')">
            Find Recipes to Plan
          </button>
        </div>`
      return
    }

    const header = document.createElement("div")
    header.className = "section-header"
    header.innerHTML = `<h2>Your Meal Plan</h2>`
    container.appendChild(header)

    const mealPlanContainer = document.createElement("div")
    mealPlanContainer.className = "meal-plan-container"
    container.appendChild(mealPlanContainer)

    dates.forEach((date) => {
      const dayPlan = document.createElement("div")
      dayPlan.className = "day-plan"

      const dateObj = new Date(date)
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })

      dayPlan.innerHTML = `
        <div class="day-header">
          <h3>${formattedDate}</h3>
        </div>
        <div class="day-meals">
          ${this.mealPlan[date]
            .map(
              (meal, index) => `
            <div class="meal-item">
              <img src="${meal.image}" alt="${meal.name}">
              <div class="meal-details">
                <h4>${meal.name}</h4>
                <div class="meal-actions">
                  <button class="btn small" onclick="recipeFinder.showRecipeDetails('${meal.id}')">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn small danger" onclick="recipeFinder.removeFromMealPlan('${date}', ${index})">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      `

      mealPlanContainer.appendChild(dayPlan)
    })
  }

  // Rating System
  setupRatingSystem(recipeId) {
    const ratings = JSON.parse(localStorage.getItem("ratings")) || {}
    const currentRating = ratings[recipeId] || 0

    const ratingContainer = document.getElementById("recipe-rating")
    ratingContainer.innerHTML = `
      <h3>Rate this Recipe</h3>
      <div class="rating-stars">
        ${[1, 2, 3, 4, 5]
          .map(
            (star) => `
          <span class="star ${star <= currentRating ? "active" : ""}" data-value="${star}">
            <i class="fas fa-star"></i>
          </span>
        `,
          )
          .join("")}
      </div>
      <div class="rating-text">${currentRating > 0 ? `Your rating: ${currentRating}/5` : "Rate this recipe"}</div>
    `

    // Add event listeners to stars
    ratingContainer.querySelectorAll(".star").forEach((star) => {
      star.addEventListener("click", () => {
        const value = Number.parseInt(star.dataset.value)
        ratings[recipeId] = value
        localStorage.setItem("ratings", JSON.stringify(ratings))

        // Update UI
        ratingContainer.querySelectorAll(".star").forEach((s, index) => {
          s.classList.toggle("active", index < value)
        })
        ratingContainer.querySelector(".rating-text").textContent = `Your rating: ${value}/5`

        this.showToast("Thanks for rating this recipe!", "success")
      })
    })
  }

  // Sharing Functionality
  setupSharing(recipe) {
    const shareContainer = document.getElementById("recipe-share")

    // Create a shareable URL (in a real app, this would be a proper URL)
    const shareText = `Check out this delicious ${recipe.strMeal} recipe I found!`
    const shareUrl = `https://recipefinder.example.com/recipe/${recipe.idMeal}`

    shareContainer.innerHTML = `
      <h3>Share this Recipe</h3>
      <div class="share-buttons">
        <button class="btn share-btn facebook" onclick="recipeFinder.shareRecipe('facebook', '${shareText}', '${shareUrl}')">
          <i class="fab fa-facebook-f"></i>
        </button>
        <button class="btn share-btn twitter" onclick="recipeFinder.shareRecipe('twitter', '${shareText}', '${shareUrl}')">
          <i class="fab fa-twitter"></i>
        </button>
        <button class="btn share-btn pinterest" onclick="recipeFinder.shareRecipe('pinterest', '${shareText}', '${shareUrl}', '${recipe.strMealThumb}')">
          <i class="fab fa-pinterest-p"></i>
        </button>
        <button class="btn share-btn email" onclick="recipeFinder.shareRecipe('email', '${shareText}', '${shareUrl}')">
          <i class="fas fa-envelope"></i>
        </button>
        <button class="btn share-btn copy" onclick="recipeFinder.copyRecipeLink('${shareUrl}')">
          <i class="fas fa-link"></i>
        </button>
      </div>
    `
  }

  shareRecipe(platform, text, url, image = "") {
    let shareUrl = ""

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        break
      case "pinterest":
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(image)}&description=${encodeURIComponent(text)}`
        break
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent("Recipe Recommendation")}&body=${encodeURIComponent(`${text}\n\n${url}`)}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank")
    }
  }

  copyRecipeLink(url) {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.showToast("Link copied to clipboard!", "success")
      })
      .catch((err) => {
        this.showError("Failed to copy link")
        console.error("Could not copy text: ", err)
      })
  }

  // Helper Functions
  matchesIngredients(recipe) {
    const recipeIngredients = new Set()
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`]
      if (ingredient && ingredient.trim()) {
        recipeIngredients.add(ingredient.toLowerCase())
      }
    }

    return Array.from(this.ingredients).every((ingredient) =>
      Array.from(recipeIngredients).some((recipeIng) => recipeIng.includes(ingredient.toLowerCase())),
    )
  }

  createDetailedRecipeCard(recipe) {
    const ingredients = []
    const nutritionFacts = this.generateNutritionFacts(recipe)

    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`]
      const measure = recipe[`strMeasure${i}`]
      if (ingredient && ingredient.trim()) {
        ingredients.push(`<li><span class="measure">${measure}</span> ${ingredient}</li>`)
      }
    }

    // Format instructions into steps
    const instructions = recipe.strInstructions
      .split(/\r\n|\n|\r/)
      .filter((step) => step.trim() !== "")
      .map(
        (step, index) =>
          `<div class="instruction-step"><span class="step-number">${index + 1}</span><p>${step}</p></div>`,
      )
      .join("")

    return `
      <div class="recipe-detail">
        <div class="recipe-header">
          <h2>${recipe.strMeal}</h2>
          <div class="recipe-actions">
            <button class="btn favorite-btn ${this.favorites[recipe.idMeal] ? "active" : ""}" 
              onclick="recipeFinder.toggleFavorite('${recipe.idMeal}', '${recipe.strMeal.replace(/'/g, "\\'")}', '${recipe.strMealThumb}')">
              <i class="fas ${this.favorites[recipe.idMeal] ? "fa-heart" : "fa-heart"}"></i>
              ${this.favorites[recipe.idMeal] ? "Saved" : "Save"}
            </button>
          </div>
        </div>
        
        <div class="recipe-image-container">
          <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="recipe-detail-image">
        </div>
        
        <div class="recipe-info">
          <div class="info-item"><i class="fas fa-globe"></i> Cuisine: ${recipe.strArea}</div>
          <div class="info-item"><i class="fas fa-tag"></i> Category: ${recipe.strCategory}</div>
          ${
            recipe.strTags
              ? `<div class="info-item"><i class="fas fa-tags"></i> Tags: ${recipe.strTags
                  .split(",")
                  .map((tag) => `<span class="recipe-tag">${tag.trim()}</span>`)
                  .join("")}</div>`
              : ""
          }
          ${recipe.strYoutube ? `<div class="info-item"><i class="fab fa-youtube"></i> <a href="${recipe.strYoutube}" target="_blank" class="youtube-link">Watch Video Tutorial</a></div>` : ""}
        </div>

        <div class="recipe-content">
          <div class="ingredients-section">
            <h3>Ingredients</h3>
            <ul class="ingredients-list detailed">
              ${ingredients.join("")}
            </ul>
            
            <div id="nutrition-facts" class="nutrition-facts">
              <h3>Estimated Nutrition Facts</h3>
              <div class="nutrition-grid">
                <div class="nutrition-item">
                  <span class="nutrition-value">${nutritionFacts.calories}</span>
                  <span class="nutrition-label">Calories</span>
                </div>
                <div class="nutrition-item">
                  <span class="nutrition-value">${nutritionFacts.protein}g</span>
                  <span class="nutrition-label">Protein</span>
                </div>
                <div class="nutrition-item">
                  <span class="nutrition-value">${nutritionFacts.carbs}g</span>
                  <span class="nutrition-label">Carbs</span>
                </div>
                <div class="nutrition-item">
                  <span class="nutrition-value">${nutritionFacts.fat}g</span>
                  <span class="nutrition-label">Fat</span>
                </div>
              </div>
              <p class="nutrition-disclaimer">* Nutrition values are estimated and may vary</p>
            </div>
          </div>
          
          <div class="instructions-section">
            <h3>Instructions</h3>
            <div class="instructions">
              ${instructions}
            </div>
          </div>
        </div>
        
        <div class="recipe-actions-container">
          <div id="recipe-rating" class="recipe-rating">
            <!-- Rating system will be added here -->
          </div>
          
          <div id="meal-plan-form" class="meal-plan-form">
            <!-- Meal planning form will be added here -->
          </div>
          
          <div id="recipe-share" class="recipe-share">
            <!-- Share buttons will be added here -->
          </div>
        </div>
      </div>
    `
  }

  // Generate mock nutrition facts based on recipe category and ingredients
  generateNutritionFacts(recipe) {
    // This is a simplified mock function - in a real app, you would use a nutrition API
    let baseCalories = 0
    let proteinFactor = 0
    let carbsFactor = 0
    let fatFactor = 0

    // Adjust base values by category
    switch (recipe.strCategory) {
      case "Dessert":
        baseCalories = 350
        proteinFactor = 0.5
        carbsFactor = 2.5
        fatFactor = 1.5
        break
      case "Seafood":
        baseCalories = 250
        proteinFactor = 2.5
        carbsFactor = 0.8
        fatFactor = 1.0
        break
      case "Vegetarian":
        baseCalories = 200
        proteinFactor = 1.0
        carbsFactor = 2.0
        fatFactor = 0.8
        break
      case "Chicken":
      case "Beef":
      case "Pork":
        baseCalories = 300
        proteinFactor = 2.0
        carbsFactor = 1.0
        fatFactor = 1.2
        break
      default:
        baseCalories = 275
        proteinFactor = 1.5
        carbsFactor = 1.5
        fatFactor = 1.0
    }

    // Count ingredients to adjust values
    let ingredientCount = 0
    for (let i = 1; i <= 20; i++) {
      if (recipe[`strIngredient${i}`] && recipe[`strIngredient${i}`].trim()) {
        ingredientCount++
      }
    }

    // Adjust based on ingredient count
    const calorieAdjustment = ingredientCount * 15

    return {
      calories: Math.round(baseCalories + calorieAdjustment),
      protein: Math.round(10 * proteinFactor),
      carbs: Math.round(30 * carbsFactor),
      fat: Math.round(12 * fatFactor),
    }
  }
}

// Initialize the application
const recipeFinder = new RecipeFinder()

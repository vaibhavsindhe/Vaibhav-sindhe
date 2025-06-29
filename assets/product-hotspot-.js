class HotspotSection extends HTMLElement {
  constructor() {
    super();
    this.hotspots = this.querySelectorAll(".hotspot-icon");
    this.popup = this.querySelector(".hotspot-card-popup-overlay");
    this.popupContent = this.popup.querySelector(".hotspot-card-popup-content")
    this.popupLoader = this.popup.querySelector(".icon-loader");
  }

  connectedCallback() {
    this.hotspots.forEach((hotspot) => {
      hotspot.addEventListener("click", () => {
        this.showPopup();
        this.showProduct(hotspot.getAttribute("data-product-handle"));
      })
    })
  }
  showPopup() {
    this.popup.classList.remove("hidden");
    this.popup.querySelector(".hotspot-card-popup-close").addEventListener("click", () => {
      this.popup.classList.add("hidden");
      this.popupContent.innerHTML = '';
      this.popupContent.appendChild(this.popupLoader);
    })
  }
  async showProduct(productHandle) {
    try {
      const cardProductUrl = `/products/${productHandle}?view=product-card`;
      const response = await fetch(cardProductUrl);
      if (!response.ok) throw new Error('Failed to fetch product');
      let card = await response.text();
      this.popupContent.innerHTML = card;
    } catch (error) {
      console.error('Error fetching product card:', error);
    }
  }
}
customElements.define("hotspot-section", HotspotSection);

class CustomVariantSelector extends HTMLElement {
  constructor() {
    super();
    this.variants = [];
    this.selectedOptions = {};
    this.autoVariantId = this.closest("hotspot-section").getAttribute("data-auto-variant-id");
    this.addAutoVariantId = false;
  }

  connectedCallback() {
    this.variants = JSON.parse(this.dataset.variants);
    this.radios = this.querySelectorAll('input[type=radio]');
    this.atcButton = this.querySelector('.hpc_atc-button');
    this.colorVariantContainer = this.querySelector('.hpc_color-variant');
    this.sizeVariantContainer = this.querySelector(".hpc_size-variant");

    // Create highlight element
    this.highlight = document.createElement('div');
    this.highlight.className = 'variant-highlight';
    this.setupHighlightStyle();
    this.colorVariantContainer.appendChild(this.highlight);

    this.radios.forEach(radio => {
      radio.addEventListener('change', () => {
        this.handleChange();
        this.updateHighlight();
        this.updateDropdown(event);
      });
    });

    // this.selectDefaultVariant();

    this.atcButton.addEventListener("click", () => {
      this.addToCart(this.atcButton);
    });
  }

  handleChange() {
    const selectedOption1 = this.querySelector('input[name="option1"]:checked')?.value;
    const selectedOption2 = this.querySelector('input[name="option2"]:checked')?.value;

    if (selectedOption1 == "M" && selectedOption2 == "White") {
      this.addAutoVariantId = true;
    }

    const matchedVariant = this.variants.find(v =>
      v.option1 === selectedOption1 &&
      v.option2 === selectedOption2
    );

    if (matchedVariant) {
      this.atcButton.setAttribute("data-selected-variant-id", matchedVariant.id);
    }

    const labels = this.colorVariantContainer.querySelectorAll('label');
    labels.forEach(label => label.classList.remove('active'));

    const checkedInput = this.colorVariantContainer.querySelector('input[name="option2"]:checked');
    const activeLabel = checkedInput?.closest('label');
    if (activeLabel) {
      activeLabel.classList.add('active');
    }
  }

  selectDefaultVariant() {
    const firstVariant = this.variants[0];
    if (!firstVariant) return;

    this.optionNames = ['option1', 'option2'];
    this.optionNames.forEach((opt) => {
      const value = firstVariant[opt];
      if (!value) return;
      const radio = this.querySelector(`input[name="${opt}"][value="${value}"]`);
      if (radio) {
        radio.checked = true;
      }
    });

    this.atcButton.setAttribute("data-selected-variant-id", firstVariant.id);
    this.updateHighlight(); // highlight first by default
  }

  addToCart(atcButton) {
    const selectedVariantId = atcButton.getAttribute("data-selected-variant-id");
    if (!selectedVariantId) {
      this.querySelector(".hpc_atc-error-message").classList.add("show");
      setTimeout(() => {
        this.querySelector(".hpc_atc-error-message").classList.remove("show");
      }, 3000);
      return;
    };

    const items = [
      {
        id: selectedVariantId,
        quantity: 1
      }
    ];

    if (this.addAutoVariantId && this.this.autoVariantId) {
      items.push({
        id: this.autoVariantId,
        quantity: 1
      });
    }

    const formData = { items };

    fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then(response => response.json())
      .then(data => {
        window.location.href = "/cart";
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }

  updateHighlight() {
    const checkedInput = this.colorVariantContainer.querySelector('input[name="option2"]:checked');
    if (!checkedInput || !checkedInput.closest(".hpc_color-variant")) return;
    const checkedLabel = checkedInput.closest('label');
    if (!checkedLabel) return;
    const colorSpanWidth = checkedLabel.querySelector(".color-swatch").offsetWidth

    const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = checkedLabel;
    this.highlight.style.width = `${offsetWidth - colorSpanWidth}px`;
    this.highlight.style.height = `${offsetHeight}px`;
    this.highlight.style.left = `${offsetLeft + colorSpanWidth}px`;
    this.highlight.style.top = `${offsetTop}px`;
  }

  setupHighlightStyle() {
    Object.assign(this.highlight.style, {
      position: 'absolute',
      backgroundColor: 'black',
      zIndex: '0',
      transition: 'all 0.3s ease',
      pointerEvents: 'none',
    });

    this.colorVariantContainer.style.position = 'relative';
  }

  updateDropdown(event) {
    if (event.target.closest(".hpc_size-variant")) {
      this.sizeVariantContainer.querySelector(".selected-size-text").textContent = event.target.value;
      this.sizeVariantContainer.removeAttribute("open")
    }
  }
}

customElements.define("custom-variant-selector", CustomVariantSelector);
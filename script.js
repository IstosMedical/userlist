"use strict";

const DATA_URL = "./customers.json";
const PAGE_SIZE = 12;

const state = {
  customers: [],
  filteredCustomers: [],
  currentPage: 1
};

const elements = {
  searchInput: document.getElementById("searchInput"),
  locationFilter: document.getElementById("locationFilter"),
  equipmentFilter: document.getElementById("equipmentFilter"),
  sortSelect: document.getElementById("sortSelect"),
  clearFiltersButton: document.getElementById("clearFiltersButton"),
  emptyClearButton: document.getElementById("emptyClearButton"),
  customerResults: document.getElementById("customer-results"),
  loadingState: document.getElementById("loadingState"),
  errorState: document.getElementById("errorState"),
  emptyState: document.getElementById("emptyState"),
  resultsSummary: document.getElementById("resultsSummary"),
  pagination: document.getElementById("pagination"),
  totalCustomersStat: document.getElementById("totalCustomersStat"),
  currentYear: document.getElementById("currentYear")
};

function cleanText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeText(value) {
  return cleanText(value).toLowerCase();
}

function getCustomerName(customer) {
  return cleanText(customer.customer || customer.name || "Unnamed Customer");
}

function getCustomerLocation(customer) {
  return cleanText(customer.location || "Location not specified");
}

function getCustomerSetup(customer) {
  return cleanText(customer.setup_type || "Equipment Supply");
}

function getEquipmentList(customer) {
  return Array.isArray(customer.equipment) ? customer.equipment : [];
}

function getEquipmentNames(customer) {
  return getEquipmentList(customer)
    .map(function (item) {
      return cleanText(item.name || "");
    })
    .filter(Boolean);
}

function getSearchText(customer) {
  const equipmentText = getEquipmentList(customer)
    .map(function (item) {
      return [
        item.name || "",
        item.model || "",
        item.quantity || ""
      ].join(" ");
    })
    .join(" ");

  return normalizeText([
    customer.sr_no || "",
    getCustomerName(customer),
    customer.contact_person || "",
    getCustomerLocation(customer),
    customer.setup_type || "",
    equipmentText
  ].join(" "));
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function populateFilters() {
  const locations = [];
  const equipmentNames = [];

  state.customers.forEach(function (customer) {
    const location = getCustomerLocation(customer);

    if (
      location &&
      location !== "Location not specified" &&
      locations.indexOf(location) === -1
    ) {
      locations.push(location);
    }

    getEquipmentNames(customer).forEach(function (equipmentName) {
      if (equipmentNames.indexOf(equipmentName) === -1) {
        equipmentNames.push(equipmentName);
      }
    });
  });

  locations.sort(function (a, b) {
    return a.localeCompare(b);
  });

  equipmentNames.sort(function (a, b) {
    return a.localeCompare(b);
  });

  elements.locationFilter.innerHTML = "";
  elements.equipmentFilter.innerHTML = "";

  elements.locationFilter.appendChild(
    createOption("", "All locations")
  );

  elements.equipmentFilter.appendChild(
    createOption("", "All equipment")
  );

  locations.forEach(function (location) {
    elements.locationFilter.appendChild(
      createOption(location, location)
    );
  });

  equipmentNames.forEach(function (equipmentName) {
    elements.equipmentFilter.appendChild(
      createOption(equipmentName, equipmentName)
    );
  });
}

function filterCustomers() {
  const searchTerm = normalizeText(elements.searchInput.value);
  const selectedLocation = normalizeText(elements.locationFilter.value);
  const selectedEquipment = normalizeText(elements.equipmentFilter.value);

  state.filteredCustomers = state.customers.filter(function (customer) {
    const matchesSearch =
      !searchTerm || getSearchText(customer).includes(searchTerm);

    const matchesLocation =
      !selectedLocation ||
      normalizeText(getCustomerLocation(customer)) === selectedLocation;

    const matchesEquipment =
      !selectedEquipment ||
      getEquipmentList(customer).some(function (item) {
        return normalizeText(item.name) === selectedEquipment;
      });

    return matchesSearch && matchesLocation && matchesEquipment;
  });

  sortCustomers();
}

function sortCustomers() {
  const sortBy = elements.sortSelect.value;

  state.filteredCustomers.sort(function (a, b) {
    const nameA = getCustomerName(a);
    const nameB = getCustomerName(b);
    const locationA = getCustomerLocation(a);
    const locationB = getCustomerLocation(b);
    const serialA = Number(a.sr_no || 999999);
    const serialB = Number(b.sr_no || 999999);

    if (sortBy === "name-desc") {
      return nameB.localeCompare(nameA);
    }

    if (sortBy === "location-asc") {
      return (
        locationA.localeCompare(locationB) ||
        nameA.localeCompare(nameB)
      );
    }

    if (sortBy === "sr-asc") {
      return serialA - serialB;
    }

    return nameA.localeCompare(nameB);
  });
}

function getTotalPages() {
  return Math.max(
    1,
    Math.ceil(state.filteredCustomers.length / PAGE_SIZE)
  );
}

function getCurrentPageCustomers() {
  const start = (state.currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  return state.filteredCustomers.slice(start, end);
}

function getEquipmentPreview(customer) {
  const names = getEquipmentNames(customer);

  if (names.length === 0) {
    return "Equipment information is not available.";
  }

  const visibleNames = names.slice(0, 3);
  const remaining = names.length - visibleNames.length;

  if (remaining > 0) {
    return visibleNames.join(", ") + " and " + remaining + " more";
  }

  return visibleNames.join(", ");
}

function createCustomerCard(customer) {
  const article = document.createElement("article");
  const cardTop = document.createElement("div");
  const cardBody = document.createElement("div");
  const cardFooter = document.createElement("div");

  const serial = document.createElement("span");
  const setup = document.createElement("span");
  const title = document.createElement("h3");
  const location = document.createElement("p");
  const locationDot = document.createElement("span");
  const equipmentText = document.createElement("p");
  const equipmentLabel = document.createElement("strong");
  const itemCount = document.createElement("span");
  const detailsButton = document.createElement("button");

  const equipment = getEquipmentList(customer);

  article.className = "customer-card";
  cardTop.className = "customer-card-top";
  cardBody.className = "customer-card-body";
  cardFooter.className = "customer-card-footer";

  serial.className = "customer-serial";
  setup.className = "customer-setup";
  location.className = "customer-location";
  locationDot.className = "location-dot";
  equipmentText.className = "customer-equipment-preview";
  itemCount.className = "equipment-count";
  detailsButton.className = "details-button";

  serial.textContent = "#" + cleanText(customer.sr_no || "—");
  setup.textContent = getCustomerSetup(customer);
  title.textContent = getCustomerName(customer);

  location.appendChild(locationDot);
  location.appendChild(
    document.createTextNode(getCustomerLocation(customer))
  );

  equipmentLabel.textContent = "Installed solutions: ";
  equipmentText.appendChild(equipmentLabel);
  equipmentText.appendChild(
    document.createTextNode(getEquipmentPreview(customer))
  );

  itemCount.textContent =
    equipment.length +
    " " +
    (equipment.length === 1 ? "equipment item" : "equipment items");

  detailsButton.type = "button";
  detailsButton.textContent = "View Equipment";

  detailsButton.addEventListener("click", function () {
    showCustomerEquipment(customer);
  });

  cardTop.appendChild(serial);
  cardTop.appendChild(setup);

  cardBody.appendChild(title);
  cardBody.appendChild(location);
  cardBody.appendChild(equipmentText);

  cardFooter.appendChild(itemCount);
  cardFooter.appendChild(detailsButton);

  article.appendChild(cardTop);
  article.appendChild(cardBody);
  article.appendChild(cardFooter);

  return article;
}

function renderCustomerCards() {
  const customers = getCurrentPageCustomers();

  elements.customerResults.innerHTML = "";

  customers.forEach(function (customer) {
    elements.customerResults.appendChild(
      createCustomerCard(customer)
    );
  });

  elements.customerResults.setAttribute("aria-busy", "false");
}

function showCustomerEquipment(customer) {
  const equipment = getEquipmentList(customer);

  let message = getCustomerName(customer) + "\n";
  message += "Location: " + getCustomerLocation(customer) + "\n\n";
  message += "Installed Equipment:\n\n";

  if (equipment.length === 0) {
    message += "Equipment details are not available.";
  } else {
    equipment.forEach(function (item, index) {
      const itemName = cleanText(item.name || "Equipment");
      const model = cleanText(item.model || "Model not specified");
      const quantity = cleanText(item.quantity || "1");

      message +=
        (index + 1) +
        ". " +
        itemName +
        "\n   Model: " +
        model +
        "\n   Quantity: " +
        quantity +
        "\n\n";
    });
  }

  window.alert(message);
}

function createPageButton(label, page, options) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "page-button";
  button.textContent = label;

  if (options && options.active) {
    button.classList.add("is-active");
    button.setAttribute("aria-current", "page");
  }

  if (options && options.disabled) {
    button.disabled = true;
  }

  button.addEventListener("click", function () {
    if (button.disabled || page === state.currentPage) {
      return;
    }

    state.currentPage = page;
    renderPage();

    document.getElementById("customer-results").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  return button;
}

function renderPagination() {
  const totalPages = getTotalPages();

  elements.pagination.innerHTML = "";

  if (state.filteredCustomers.length <= PAGE_SIZE) {
    elements.pagination.hidden = true;
    return;
  }

  elements.pagination.hidden = false;

  elements.pagination.appendChild(
    createPageButton("←", state.currentPage - 1, {
      disabled: state.currentPage === 1
    })
  );

  let startPage = Math.max(1, state.currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let page = startPage; page <= endPage; page += 1) {
    elements.pagination.appendChild(
      createPageButton(String(page), page, {
        active: page === state.currentPage
      })
    );
  }

  elements.pagination.appendChild(
    createPageButton("→", state.currentPage + 1, {
      disabled: state.currentPage === totalPages
    })
  );
}

function updateResultsSummary() {
  const total = state.filteredCustomers.length;

  if (total === 0) {
    elements.resultsSummary.textContent =
      "No customer records match your search or selected filters.";
    return;
  }

  const start = (state.currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(state.currentPage * PAGE_SIZE, total);

  elements.resultsSummary.textContent =
    "Showing " +
    start +
    "–" +
    end +
    " of " +
    total +
    " customer records.";
}

function renderPage() {
  const totalPages = getTotalPages();

  if (state.currentPage > totalPages) {
    state.currentPage = totalPages;
  }

  const hasResults = state.filteredCustomers.length > 0;

  elements.emptyState.hidden = hasResults;
  elements.customerResults.hidden = !hasResults;

  updateResultsSummary();

  if (hasResults) {
    renderCustomerCards();
    renderPagination();
  } else {
    elements.customerResults.innerHTML = "";
    elements.pagination.innerHTML = "";
    elements.pagination.hidden = true;
  }
}

function applyFilters() {
  state.currentPage = 1;
  filterCustomers();
  renderPage();
}

function clearFilters() {
  elements.searchInput.value = "";
  elements.locationFilter.value = "";
  elements.equipmentFilter.value = "";
  elements.sortSelect.value = "name-asc";

  applyFilters();
  elements.searchInput.focus();
}

async function loadCustomers() {
  try {
    elements.loadingState.hidden = false;
    elements.errorState.hidden = true;
    elements.emptyState.hidden = true;
    elements.customerResults.setAttribute("aria-busy", "true");

    const response = await fetch(DATA_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        "Unable to load customers.json. HTTP status: " +
        response.status
      );
    }

    const responseText = await response.text();
    const data = JSON.parse(responseText);

    if (!Array.isArray(data)) {
      throw new Error(
        "customers.json is invalid. The file must contain a JSON array."
      );
    }

    state.customers = data.filter(function (customer) {
      return customer && typeof customer === "object";
    });

    state.filteredCustomers = state.customers.slice();

    if (elements.totalCustomersStat) {
      elements.totalCustomersStat.textContent =
        state.customers.length + "+";
    }

    populateFilters();
    filterCustomers();
    renderPage();
  } catch (error) {
    console.error("Customer data error:", error);

    elements.customerResults.innerHTML = "";
    elements.customerResults.setAttribute("aria-busy", "false");
    elements.resultsSummary.textContent =
      "Customer records could not be loaded.";

    const errorParagraph = elements.errorState.querySelector("p");

    if (errorParagraph) {
      errorParagraph.textContent = error.message;
    }

    elements.errorState.hidden = false;
  } finally {
    elements.loadingState.hidden = true;
  }
}

function initialiseEvents() {
  let searchTimeout;

  elements.searchInput.addEventListener("input", function () {
    window.clearTimeout(searchTimeout);

    searchTimeout = window.setTimeout(function () {
      applyFilters();
    }, 250);
  });

  elements.locationFilter.addEventListener("change", applyFilters);
  elements.equipmentFilter.addEventListener("change", applyFilters);
  elements.sortSelect.addEventListener("change", applyFilters);

  elements.clearFiltersButton.addEventListener("click", clearFilters);

  if (elements.emptyClearButton) {
    elements.emptyClearButton.addEventListener("click", clearFilters);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  if (elements.currentYear) {
    elements.currentYear.textContent = new Date().getFullYear();
  }

  initialiseEvents();
  loadCustomers();
});

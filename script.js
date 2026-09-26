"use strict";

const DATA_URL = "customers.json";
const PAGE_SIZE = 12;

const state = {
  customers: [],
  filteredCustomers: [],
  currentPage: 1,
  activeCustomer: null
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
  currentYear: document.getElementById("currentYear"),
  customerModal: document.getElementById("customerModal"),
  modalCustomerName: document.getElementById("modalCustomerName"),
  modalLocation: document.getElementById("modalLocation"),
  modalSetupType: document.getElementById("modalSetupType"),
  modalEquipmentList: document.getElementById("modalEquipmentList"),
  closeModalButton: document.getElementById("closeModalButton"),
  closeModalFooterButton: document.getElementById("closeModalFooterButton")
};

function normaliseText(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function safeString(value, fallback = "Not specified") {
  const cleanValue = String(value ?? "").trim();
  return cleanValue || fallback;
}

function getCustomerEquipment(customer) {
  return Array.isArray(customer.equipment) ? customer.equipment : [];
}

function getSearchableCustomerText(customer) {
  const equipmentText = getCustomerEquipment(customer)
    .map((item) => `${item.name ?? ""} ${item.model ?? ""}`)
    .join(" ");

  return normaliseText(
    [
      customer.customer,
      customer.name,
      customer.location,
      customer.state,
      customer.region,
      customer.setup_type,
      customer.contact_person,
      equipmentText
    ].join(" ")
  );
}

function getCustomerName(customer) {
  return safeString(customer.customer || customer.name, "Unnamed Customer");
}

function getCustomerLocation(customer) {
  return safeString(customer.location, "Location not specified");
}

function getCustomerSetupType(customer) {
  return safeString(customer.setup_type, "Standard Equipment Supply");
}

function getEquipmentNames(customer) {
  return getCustomerEquipment(customer)
    .map((item) => safeString(item.name, "Equipment"))
    .filter(Boolean);
}

function getEquipmentPreview(customer) {
  const equipmentNames = getEquipmentNames(customer);

  if (equipmentNames.length === 0) {
    return "Equipment information is not available.";
  }

  const maxItems = 3;
  const visibleItems = equipmentNames.slice(0, maxItems);
  const remainingCount = equipmentNames.length - visibleItems.length;

  let preview = visibleItems.join(", ");

  if (remainingCount > 0) {
    preview += ` and ${remainingCount} more`;
  }

  return preview;
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function populateFilters(customers) {
  const locations = [
    ...new Set(
      customers
        .map((customer) => getCustomerLocation(customer))
        .filter((location) => location !== "Location not specified")
    )
  ].sort((a, b) => a.localeCompare(b, "en"));

  const equipmentNames = [
    ...new Set(
      customers.flatMap((customer) => getEquipmentNames(customer))
    )
  ].sort((a, b) => a.localeCompare(b, "en"));

  locations.forEach((location) => {
    elements.locationFilter.appendChild(createOption(location, location));
  });

  equipmentNames.forEach((equipmentName) => {
    elements.equipmentFilter.appendChild(
      createOption(equipmentName, equipmentName)
    );
  });
}

function filterCustomers() {
  const searchTerm = normaliseText(elements.searchInput.value);
  const selectedLocation = normaliseText(elements.locationFilter.value);
  const selectedEquipment = normaliseText(elements.equipmentFilter.value);

  state.filteredCustomers = state.customers.filter((customer) => {
    const matchesSearch =
      !searchTerm || getSearchableCustomerText(customer).includes(searchTerm);

    const matchesLocation =
      !selectedLocation ||
      normaliseText(getCustomerLocation(customer)) === selectedLocation;

    const matchesEquipment =
      !selectedEquipment ||
      getCustomerEquipment(customer).some(
        (item) => normaliseText(item.name) === selectedEquipment
      );

    return matchesSearch && matchesLocation && matchesEquipment;
  });

  sortCustomers();
}

function sortCustomers() {
  const sortValue = elements.sortSelect.value;

  state.filteredCustomers.sort((customerA, customerB) => {
    const nameA = getCustomerName(customerA);
    const nameB = getCustomerName(customerB);
    const locationA = getCustomerLocation(customerA);
    const locationB = getCustomerLocation(customerB);

    switch (sortValue) {
      case "name-desc":
        return nameB.localeCompare(nameA, "en");

      case "location-asc":
        return (
          locationA.localeCompare(locationB, "en") ||
          nameA.localeCompare(nameB, "en")
        );

      case "sr-asc":
        return Number(customerA.sr_no || 9999) - Number(customerB.sr_no || 9999);

      case "name-asc":
      default:
        return nameA.localeCompare(nameB, "en");
    }
  });
}

function getPageCount() {
  return Math.max(1, Math.ceil(state.filteredCustomers.length / PAGE_SIZE));
}

function getPaginatedCustomers() {
  const startIndex = (state.currentPage - 1) * PAGE_SIZE;
  return state.filteredCustomers.slice(startIndex, startIndex + PAGE_SIZE);
}

function createCustomerCard(customer) {
  const equipment = getCustomerEquipment(customer);
  const card = document.createElement("article");
  const top = document.createElement("div");
  const body = document.createElement("div");
  const footer = document.createElement("div");
  const serialNumber = document.createElement("span");
  const setupType = document.createElement("span");
  const title = document.createElement("h3");
  const location = document.createElement("p");
  const locationDot = document.createElement("span");
  const equipmentPreview = document.createElement("p");
  const equipmentCount = document.createElement("span");
  const detailsButton = document.createElement("button");

  card.className = "customer-card";
  top.className = "customer-card-top";
  body.className = "customer-card-body";
  footer.className = "customer-card-footer";
  serialNumber.className = "customer-serial";
  setupType.className = "customer-setup";
  location.className = "customer-location";
  locationDot.className = "location-dot";
  equipmentPreview.className = "customer-equipment-preview";
  equipmentCount.className = "equipment-count";
  detailsButton.className = "details-button";

  serialNumber.textContent = `#${safeString(customer.sr_no, "—")}`;
  setupType.textContent = getCustomerSetupType(customer);
  title.textContent = getCustomerName(customer);

  location.appendChild(locationDot);
  location.appendChild(document.createTextNode(getCustomerLocation(customer)));

  const label = document.createElement("strong");
  label.textContent = "Installed solutions: ";
  equipmentPreview.appendChild(label);
  equipmentPreview.appendChild(document.createTextNode(getEquipmentPreview(customer)));

  equipmentCount.textContent = `${equipment.length} ${
    equipment.length === 1 ? "equipment item" : "equipment items"
  }`;

  detailsButton.type = "button";
  detailsButton.textContent = "View Details";
  detailsButton.setAttribute(
    "aria-label",
    `View installed equipment at ${getCustomerName(customer)}`
  );

  detailsButton.addEventListener("click", () => {
    openCustomerModal(customer);
  });

  top.append(serialNumber, setupType);
  body.append(title, location, equipmentPreview);
  footer.append(equipmentCount, detailsButton);
  card.append(top, body, footer);

  return card;
}

function renderCustomerCards() {
  const paginatedCustomers = getPaginatedCustomers();

  elements.customerResults.replaceChildren();

  paginatedCustomers.forEach((customer) => {
    elements.customerResults.appendChild(createCustomerCard(customer));
  });

  elements.customerResults.setAttribute("aria-busy", "false");
}

function createPaginationButton(label, pageNumber, options = {}) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "page-button";
  button.textContent = label;
  button.disabled = Boolean(options.disabled);

  if (options.active) {
    button.classList.add("is-active");
    button.setAttribute("aria-current", "page");
  }

  button.setAttribute(
    "aria-label",
    options.ariaLabel || `Go to page ${pageNumber}`
  );

  button.addEventListener("click", () => {
    if (button.disabled || pageNumber === state.currentPage) {
      return;
    }

    state.currentPage = pageNumber;
    render();
    document.getElementById("customer-results").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  return button;
}

function renderPagination() {
  const totalPages = getPageCount();
  const fragment = document.createDocumentFragment();

  elements.pagination.replaceChildren();

  if (state.filteredCustomers.length <= PAGE_SIZE) {
    elements.pagination.hidden = true;
    return;
  }

  elements.pagination.hidden = false;

  fragment.appendChild(
    createPaginationButton("←", state.currentPage - 1, {
      disabled: state.currentPage === 1,
      ariaLabel: "Go to previous page"
    })
  );

  const maxVisiblePages = 5;
  let startPage = Math.max(1, state.currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let page = startPage; page <= endPage; page += 1) {
    fragment.appendChild(
      createPaginationButton(String(page), page, {
        active: page === state.currentPage
      })
    );
  }

  fragment.appendChild(
    createPaginationButton("→", state.currentPage + 1, {
      disabled: state.currentPage === totalPages,
      ariaLabel: "Go to next page"
    })
  );

  elements.pagination.appendChild(fragment);
}

function updateResultsSummary() {
  const total = state.filteredCustomers.length;
  const overallTotal = state.customers.length;

  if (total === 0) {
    elements.resultsSummary.textContent = "No customer records match your criteria.";
    return;
  }

  const start = (state.currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(state.currentPage * PAGE_SIZE, total);

  elements.resultsSummary.replaceChildren(
    document.createTextNode(`Showing ${start}–${end} of `),
    createStrongText(`${total}`),
    document.createTextNode(
      total === overallTotal ? " customer records." : " matching customer records."
    )
  );
}

function createStrongText(text) {
  const strong = document.createElement("strong");
  strong.textContent = text;
  return strong;
}

function toggleDisplayStates() {
  const hasCustomers = state.filteredCustomers.length > 0;

  elements.emptyState.hidden = hasCustomers;
  elements.customerResults.hidden = !hasCustomers;
  elements.pagination.hidden = !hasCustomers || state.filteredCustomers.length <= PAGE_SIZE;
}

function render() {
  const totalPages = getPageCount();

  if (state.currentPage > totalPages) {
    state.currentPage = totalPages;
  }

  updateResultsSummary();
  toggleDisplayStates();

  if (state.filteredCustomers.length > 0) {
    renderCustomerCards();
    renderPagination();
  } else {
    elements.customerResults.replaceChildren();
    elements.pagination.replaceChildren();
  }
}

function applyFilters() {
  state.currentPage = 1;
  filterCustomers();
  render();
}

function clearFilters() {
  elements.searchInput.value = "";
  elements.locationFilter.value = "";
  elements.equipmentFilter.value = "";
  elements.sortSelect.value = "name-asc";

  applyFilters();
  elements.searchInput.focus();
}

function addEquipmentItemToModal(item) {
  const row = document.createElement("div");
  const name = document.createElement("span");
  const model = document.createElement("span");
  const quantity = document.createElement("span");

  row.className = "modal-equipment-item";
  name.className = "modal-equipment-name";
  model.className = "modal-equipment-model";
  quantity.className = "modal-equipment-qty";

  name.textContent = safeString(item.name, "Equipment");
  model.textContent = safeString(item.model, "Model not specified");

  const itemQuantity = item.quantity ?? item.quantity_text ?? 1;
  quantity.textContent = `Qty: ${itemQuantity}`;

  row.append(name, model, quantity);

  return row;
}

function openCustomerModal(customer) {
  state.activeCustomer = customer;

  elements.modalCustomerName.textContent = getCustomerName(customer);
  elements.modalLocation.textContent = getCustomerLocation(customer);
  elements.modalSetupType.textContent = getCustomerSetupType(customer);

  elements.modalEquipmentList.replaceChildren();

  const equipment = getCustomerEquipment(customer);

  if (equipment.length === 0) {
    const noEquipment = document.createElement("p");
    noEquipment.textContent = "Equipment details are not currently available.";
    elements.modalEquipmentList.appendChild(noEquipment);
  } else {
    equipment.forEach((item) => {
      elements.modalEquipmentList.appendChild(addEquipmentItemToModal(item));
    });
  }

  if (typeof elements.customerModal.showModal === "function") {
    elements.customerModal.showModal();
  } else {
    elements.customerModal.setAttribute("open", "");
  }
}

function closeCustomerModal() {
  if (elements.customerModal.open) {
    elements.customerModal.close();
  } else {
    elements.customerModal.removeAttribute("open");
  }

  state.activeCustomer = null;
}

function handleModalBackdropClick(event) {
  const dialog = elements.customerModal;
  const dialogDimensions = dialog

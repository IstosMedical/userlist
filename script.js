document.addEventListener("DOMContentLoaded", () => {
  fetch("customers.json")
    .then(response => response.json())
    .then(customers => {
      const container = document.getElementById("customer-list");
      customers.forEach(c => {
        const card = document.createElement("div");
        card.className = "customer-card";
        card.innerHTML = `
          <img src="assets/placeholder.png" alt="Equipment Image">
          <h3>${c.name}</h3>
          <p><strong>Location:</strong> ${c.location}</p>
          <p><strong>Setup:</strong> ${c.setup}</p>
          <p><strong>Equipments:</strong> ${c.equipments}</p>
        `;
        container.appendChild(card);
      });
    })
    .catch(err => console.error("Error loading customers:", err));
});

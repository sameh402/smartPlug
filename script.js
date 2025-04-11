// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCs_MnEZvqL7k1IqRNqMp0Fswi7m4Au2Uk",
  authDomain: "samrt-plug.firebaseapp.com",
  databaseURL: "https://samrt-plug-default-rtdb.firebaseio.com",
  projectId: "samrt-plug",
  storageBucket: "samrt-plug.firebasestorage.app",
  messagingSenderId: "434863813283",
  appId: "1:434863813283:web:0852ccb9ae43880d220516",
  measurementId: "G-6ZYGJXFETC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let currentPlugId = null;
let cardToDelete = null;

// Function to open the plug info card modal
function openCard() {
  document.getElementById("plug-card").style.display = "block";
  // Show both Done and Cancel buttons
  document.getElementById("done-btn").style.display = "inline-block";
  document.getElementById("cancel-btn").style.display = "inline-block";
}

// Function to add plug info to the DOM and Firebase
function doneAction() {
  const plugId = document.getElementById("plug-id").value.trim();
  const plugName = document.getElementById("plug-name").value.trim();

  if (!plugId || !plugName) return;

  // Reference to the 'Plugs' node in Firebase
  const plugRef = database.ref('Plugs/' + plugId);

  // Save plug data to Firebase
  plugRef.set({
    name: plugName,
    status: 'off', // Initial status
  }).then(() => {
    console.log("Data successfully written to Firebase");

    // Add the new plug info card to the DOM
    const cardContainer = document.getElementById("cards-container");

    const newCard = document.createElement("div");
    newCard.classList.add("plug-info");
    newCard.setAttribute("id", `plug-${plugId}`);

    newCard.innerHTML = `
      <h3>Plug Name: ${plugName}</h3>
      <div class="switch-container">
        <input type="checkbox" id="status-toggle-${plugId}" onchange="toggleStatus('${plugId}')" />
      </div>
      <i class="fas fa-cog settings-icon" onclick="openSettings('${plugId}', '${plugName}')"></i>
      <i class="fas fa-trash delete-icon" onclick="promptDelete('plug-${plugId}')"></i>
    `;

    cardContainer.appendChild(newCard);

    // Reset modal and inputs
    document.getElementById("plug-card").style.display = "none";
    document.getElementById("plug-id").value = "";
    document.getElementById("plug-name").value = "";
    document.getElementById("done-btn").style.display = "none";
    document.getElementById("cancel-btn").style.display = "none";
  }).catch((error) => {
    console.error("Error writing data to Firebase:", error);
  });
}

// Function to cancel the add plug process
function cancelAction() {
  // Hide the modal without saving
  document.getElementById("plug-card").style.display = "none";
  document.getElementById("plug-id").value = "";
  document.getElementById("plug-name").value = "";
  document.getElementById("done-btn").style.display = "none";
  document.getElementById("cancel-btn").style.display = "none";
}

// Function to open settings modal for editing plug details
function openSettings(plugId, plugName) {
  currentPlugId = plugId;
  document.getElementById("edit-plug-name").value = plugName;
  document.getElementById("edit-plug-id").value = plugId;
  document.getElementById("settings-modal").style.display = "block";
}

// Function to save settings after editing plug details
function saveSettings() {
  const newPlugName = document.getElementById("edit-plug-name").value.trim();
  const newPlugId = document.getElementById("edit-plug-id").value.trim();

  if (!newPlugId || !newPlugName) return;

  // Update the plug info in Firebase
  const plugRef = database.ref('Plugs/' + currentPlugId);

  plugRef.update({
    name: newPlugName,
  }).then(() => {
    console.log("Data successfully updated in Firebase");

    // Update the plug card in the DOM
    const card = document.getElementById(`plug-${currentPlugId}`);
    if (card) {
      card.querySelector("h3").innerHTML = `Plug Name: ${newPlugName}`;
      card.querySelector(".settings-icon").setAttribute("onclick", `openSettings('${newPlugId}', '${newPlugName}')`);
      card.querySelector(".delete-icon").setAttribute("onclick", `promptDelete('plug-${newPlugId}')`);
      card.setAttribute("id", `plug-${newPlugId}`);
    }

    // Close settings modal
    document.getElementById("settings-modal").style.display = "none";
  }).catch((error) => {
    console.error("Error updating data in Firebase:", error);
  });
}

// Function to prompt for deleting a plug card
function promptDelete(cardId) {
  cardToDelete = cardId;
  document.getElementById("confirm-delete-modal").style.display = "block";
}

// Function to confirm the deletion of a plug card
function confirmDelete() {
  if (cardToDelete) {
    const card = document.getElementById(cardToDelete);
    if (card) card.remove();

    // Delete from Firebase as well
    const plugId = cardToDelete.replace('plug-', '');
    const plugRef = database.ref('Plugs/' + plugId);
    plugRef.remove().then(() => {
      console.log("Data successfully deleted from Firebase");
    }).catch((error) => {
      console.error("Error deleting data from Firebase:", error);
    });
  }

  cancelDelete();
}

// Function to cancel the deletion prompt
function cancelDelete() {
  cardToDelete = null;
  document.getElementById("confirm-delete-modal").style.display = "none";
}

// Function to toggle plug status and save to Firebase
function toggleStatus(plugId) {
  const status = document.getElementById(`status-toggle-${plugId}`).checked ? 'on' : 'off';

  // Update status in Firebase
  const plugRef = database.ref('Plugs/' + plugId);
  plugRef.update({
    status: status,
  }).then(() => {
    console.log(`Plug ${plugId} status updated to ${status}`);
  }).catch((error) => {
    console.error("Error updating status in Firebase:", error);
  });
}

// Function to read the plugs from Firebase and display them
function readPlugs() {
  const plugRef = database.ref('Plugs');

  // Listen for changes in the 'Plugs' node in Firebase
  plugRef.on('child_added', (snapshot) => {
    const plug = snapshot.val();
    const plugId = snapshot.key;

    // Add the new plug info card to the DOM
    const cardContainer = document.getElementById("cards-container");

    const newCard = document.createElement("div");
    newCard.classList.add("plug-info");
    newCard.setAttribute("id", `plug-${plugId}`);

    newCard.innerHTML = `
      <h3>Plug Name: ${plug.name}</h3>
      <div class="switch-container">
        <input type="checkbox" id="status-toggle-${plugId}" onchange="toggleStatus('${plugId}')" ${plug.status === 'on' ? 'checked' : ''} />
      </div>
      <i class="fas fa-cog settings-icon" onclick="openSettings('${plugId}', '${plug.name}')"></i>
      <i class="fas fa-trash delete-icon" onclick="promptDelete('plug-${plugId}')"></i>
    `;

    cardContainer.appendChild(newCard);
  });

  // Optionally, listen for changes to the plug status or deletion
  plugRef.on('child_changed', (snapshot) => {
    const plug = snapshot.val();
    const plugId = snapshot.key;

    // Update the status of the corresponding plug card in the DOM
    const card = document.getElementById(`plug-${plugId}`);
    if (card) {
      const statusToggle = card.querySelector(`#status-toggle-${plugId}`);
      if (statusToggle) {
        statusToggle.checked = plug.status === 'on';
      }
    }
  });

  plugRef.on('child_removed', (snapshot) => {
    const plugId = snapshot.key;

    // Remove the corresponding plug card from the DOM
    const card = document.getElementById(`plug-${plugId}`);
    if (card) {
      card.remove();
    }
  });
}

// Call the function to read and display plugs when the page loads
window.onload = readPlugs;

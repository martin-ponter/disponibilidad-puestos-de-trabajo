


const officeRooms = {
	Toledo: [
		"Sala Principal",
		"Sala Norte",
		"Sala Reuniones",
		"Open Space",
	],
	Madrid: ["Sala A", "Sala B", "Sala Dirección", "Sala Colaborativa"],
	Consuegra: ["Sala Central", "Sala Archivo", "Sala Clientes"],
};

const officeDeskData = {
	Toledo: [
		{ id: "T1", available: true },
		{ id: "T2", available: true },
		{ id: "T3", available: false },
		{ id: "T4", available: true },
		{ id: "T5", available: false },
		{ id: "T6", available: true },
		{ id: "T7", available: true },
		{ id: "T8", available: true },
	],
	Madrid: [
		{ id: "M1", available: true },
		{ id: "M2", available: false },
		{ id: "M3", available: true },
		{ id: "M4", available: true },
		{ id: "M5", available: false },
		{ id: "M6", available: false },
		{ id: "M7", available: true },
		{ id: "M8", available: true },
	],
	Consuegra: [
		{ id: "C1", available: false },
		{ id: "C2", available: true },
		{ id: "C3", available: true },
		{ id: "C4", available: true },
		{ id: "C5", available: false },
		{ id: "C6", available: true },
		{ id: "C7", available: true },
		{ id: "C8", available: false },
	],
};

let officeSelect = null
let roomSelect = null
let dateInput = null;
let startTimeInput = null
let endTimeInput = null
let emptyState = null
let mapWrapper = null
let desksGrid = null
let mapSubtitle = null
let reserveBtn = null
let selectedDeskBadge = null
let selectedDeskText = null
let modal = null
let modalIcon = null
let modalTitle = null
let modalMessage = null
let closeModalBtn = null



document.addEventListener('DOMContentLoaded', () => {
	officeSelect = document.getElementById("office");
	roomSelect = document.getElementById("room");
	dateInput = document.getElementById("date");
	startTimeInput = document.getElementById("start-time");
	endTimeInput = document.getElementById("end-time");
	emptyState = document.getElementById("empty-state");
	mapWrapper = document.getElementById("map-wrapper");
	desksGrid = document.getElementById("desks-grid");
	mapSubtitle = document.getElementById("map-subtitle");
	reserveBtn = document.getElementById("reserve-btn");
	selectedDeskBadge = document.getElementById("selected-desk-badge");
	selectedDeskText = document.getElementById("selected-desk-text");
	modal = document.getElementById("reservation-modal");
	modalIcon = document.getElementById("modal-icon");
	modalTitle = document.getElementById("modal-title");
	modalMessage = document.getElementById("modal-message");
	closeModalBtn = document.getElementById("close-modal-btn");
})


let selectedDesk = null;

function populateRooms() {
	const office = officeSelect.value;
	roomSelect.innerHTML = "";

	if (!office) {
		roomSelect.disabled = true;
		roomSelect.innerHTML = `<option value="">Primero elige una oficina</option>`;
		renderMap();
		return;
	}

	roomSelect.disabled = false;
	roomSelect.innerHTML = `<option value="">Selecciona una sala</option>`;

	officeRooms[office].forEach((room) => {
		const option = document.createElement("option");
		option.value = room;
		option.textContent = room;
		roomSelect.appendChild(option);
	});

	renderMap();
}

function getDeskCardClasses(available, isSelected) {
	const base =
		"desk group relative flex min-h-[92px] cursor-pointer items-center justify-center rounded-3xl border-2 text-sm font-semibold transition duration-200";

	if (!available) {
		return `${base} cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700`;
	}

	if (isSelected) {
		return `${base} border-blue-400 bg-blue-50 text-blue-700 shadow-md shadow-blue-100`;
	}

	return `${base} border-emerald-200 bg-emerald-50 text-emerald-700 hover:scale-[1.02] hover:border-emerald-300`;
}

function renderMap() {
	const office = officeSelect.value;
	const room = roomSelect.value;
	selectedDesk = null;
	selectedDeskBadge.classList.add("hidden");
	selectedDeskText.textContent = "-";
	reserveBtn.disabled = true;

	if (!office || !room) {
		emptyState.classList.remove("hidden");
		mapWrapper.classList.add("hidden");
		mapSubtitle.textContent =
			"Selecciona una oficina y una sala para visualizar el plano.";
		return;
	}

	emptyState.classList.add("hidden");
	mapWrapper.classList.remove("hidden");
	mapSubtitle.textContent = `${office} · ${room}`;

	desksGrid.innerHTML = "";

	const desks = officeDeskData[office] || [];

	desks.forEach((desk) => {
		const deskButton = document.createElement("button");
		deskButton.type = "button";
		deskButton.dataset.deskId = desk.id;
		deskButton.dataset.available = desk.available ? "true" : "false";
		deskButton.className = getDeskCardClasses(desk.available, false);

		deskButton.innerHTML = `
            <div class="flex flex-col items-center justify-center gap-2">
              <span class="text-base">${desk.id}</span>
              <span class="rounded-full px-2 py-1 text-[11px] font-medium ${desk.available
				? "bg-emerald-100 text-emerald-700"
				: "bg-rose-100 text-rose-700"
			}">
                ${desk.available ? "Disponible" : "Ocupada"}
              </span>
            </div>
          `;

		deskButton.addEventListener("click", () => {
			if (!desk.available) return;

			selectedDesk = desk.id;

			[...desksGrid.querySelectorAll(".desk")].forEach((el) => {
				const isAvailable = el.dataset.available === "true";
				const isSelected = el.dataset.deskId === selectedDesk;
				el.className = getDeskCardClasses(isAvailable, isSelected);
			});

			selectedDeskText.textContent = selectedDesk;
			selectedDeskBadge.classList.remove("hidden");
			validateReserveButton();
		});

		desksGrid.appendChild(deskButton);
	});
}

function validateReserveButton() {
	const canReserve =
		dateInput.value &&
		officeSelect.value &&
		roomSelect.value &&
		startTimeInput.value &&
		endTimeInput.value &&
		selectedDesk;

	reserveBtn.disabled = !canReserve;
}

function openModal(success, message) {
	modalTitle.textContent = success
		? "Reserva completada"
		: "No se pudo completar";
	modalMessage.textContent = message;

	modalIcon.textContent = success ? "✅" : "❌";
	modalIcon.className = success
		? "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl"
		: "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl";

	modal.classList.remove("pointer-events-none", "opacity-0");
}

function closeModal() {
	modal.classList.add("pointer-events-none", "opacity-0");
}
officeSelect.addEventListener("change", () => {
	populateRooms();
	validateReserveButton();
});

console.log('1')

roomSelect.addEventListener("change", () => {
	renderMap();
	validateReserveButton();
});

console.log('1')

dateInput.addEventListener("change", validateReserveButton);
startTimeInput.addEventListener("change", validateReserveButton);
endTimeInput.addEventListener("change", validateReserveButton);

console.log('1')

reserveBtn.addEventListener("click", () => {
	const date = dateInput.value;
	const office = officeSelect.value;
	const room = roomSelect.value;
	const start = startTimeInput.value;
	const end = endTimeInput.value;

	if (!date || !office || !room || !start || !end || !selectedDesk) {
		openModal(
			false,
			"Faltan campos por completar para poder realizar la reserva.",
		);
		return;
	}

	if (start >= end) {
		openModal(
			false,
			"La hora de fin debe ser posterior a la hora de inicio.",
		);
		return;
	}

	const success = true;

	if (success) {
		openModal(
			true,
			`La reserva para el día ${date} en la oficina de ${office}, sala ${room}, mesa ${selectedDesk}, desde las ${start} hasta las ${end}, se ha realizado correctamente.`,
		);
	} else {
		openModal(
			false,
			`No se pudo completar la reserva para el día ${date} en la oficina de ${office}.`,
		);
	}
});
if (closeModalBtn != null)
	closeModalBtn.addEventListener("click", closeModal);
if (modal != null)
	modal.addEventListener("click", (e) => {
		if (e.target === modal) closeModal();
	});



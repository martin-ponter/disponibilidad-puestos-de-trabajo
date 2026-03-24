document.addEventListener("DOMContentLoaded", () => {
	window.BX24.init(function () {
		window.BX24.callMethod("user.current", {}, (userResult) => {
			if (userResult.error()) {
				console.error("Error obteniendo usuario actual:", userResult.error());
				return;
			}

			const currentUser = userResult.data();
			const currentUserId = Number(currentUser.ID);

			console.log("Usuario actual:", currentUser);

			window.BX24.callMethod(
				"crm.item.list",
				{
					entityTypeId: 1058,
					select: [
						"id",
						"title",
						"ufCrm22_1774265772",
						"ufCrm22_1774265887",
						"ufCrm22_1774266047",
						"ufCrm22_1774266138",
						"ufCrm22_1774266164",
						"ufCrm22_1774266190",
						"ufCrm22_1774266223",
						"ufCrm22_1774266245",
						"ufCrm22_1774266267",
						"ufCrm22_1774266293",
						"ufCrm22_1774266335",
						"ufCrm22_1774342876"
					],
					filter: {
						ufCrm22_1774265772: currentUserId
					}
				},
				(result) => {
					if (result.error()) {
						console.error("Error obteniendo registros:", result.error());
						return;
					}

					console.log("Registros del usuario actual:", result);
					console.log("Items:", result.data().items || []);
				}
			);
		});
	});
});
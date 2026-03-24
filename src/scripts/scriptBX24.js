document.addEventListener("DOMContentLoaded", () => {
	window.BX24.init(function () {
		console.log("BX24 initialized successfully.");

		window.BX24.callMethod(
			'user.get',
			{},
			function (result) {
				if (result.error()) {
					console.error("Error fetching user data: ", result.error());
				} else {
					console.log("User data: ", result.data());
				}
			}
		);
	});
});
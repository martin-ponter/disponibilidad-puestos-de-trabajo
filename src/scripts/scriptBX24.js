(function bootstrapBitrixInstallState() {
	if (typeof window === "undefined") {
		return;
	}

	const searchParams = new URLSearchParams(window.location.search);
	const hasBitrixQuery =
		searchParams.has("APP_SID") ||
		searchParams.has("DOMAIN") ||
		searchParams.has("AUTH_ID");
	const hasBitrixWindowName =
		typeof window.name === "string" && window.name.includes("|");

	if (!window.BX24 && !hasBitrixQuery && !hasBitrixWindowName) {
		return;
	}

	if (window.__bitrixInstallStateCheckStarted) {
		return;
	}

	const MAX_ATTEMPTS = 40;
	const RETRY_DELAY_MS = 250;

	const markCompleted = () => {
		window.__bitrixInstallStateCheckCompleted = true;
	};

	const isInstalled = (value) =>
		value === true || value === 1 || value === "1" || value === "true";

	const finishInstallIfNeeded = () => {
		if (window.__bitrixInstallStateCheckCompleted) {
			return;
		}

		window.__bitrixInstallStateCheckStarted = true;

		window.BX24.init(() => {
			if (!window.BX24 || typeof window.BX24.callMethod !== "function") {
				markCompleted();
				return;
			}

			window.BX24.callMethod("app.info", {}, (result) => {
				const data =
					typeof result?.data === "function" ? result.data() : result?.data;
				const installed = isInstalled(data?.INSTALLED);

				if (!installed && typeof window.BX24.installFinish === "function") {
					window.BX24.installFinish();
				}

				markCompleted();
			});
		});
	};

	const waitForBitrix = (attempt = 0) => {
		if (window.__bitrixInstallStateCheckCompleted) {
			return;
		}

		if (window.BX24 && typeof window.BX24.init === "function") {
			finishInstallIfNeeded();
			return;
		}

		if (attempt >= MAX_ATTEMPTS) {
			return;
		}

		window.setTimeout(() => {
			waitForBitrix(attempt + 1);
		}, RETRY_DELAY_MS);
	};

	waitForBitrix();
})();

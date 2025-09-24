import validator from "validator";

function sanitizeEmail(email: string): string
{
	let cleanEmail = validator.trim(email);
	cleanEmail = validator.stripLow(cleanEmail);

	const normalized = validator.normalizeEmail(cleanEmail,
	{
		gmail_remove_dots: false,
		gmail_remove_subaddress: true,
	});
	if (!normalized) {
		throw new Error("Invalid email format during sanitization");
	}
	return (normalized);
}

function isValidUsername(username: string): boolean {
	return validator.matches(username, /^[a-zA-Z0-9_\-\s]+$/);
}


export function processEmailInput(email: string): string
{
	if (!validator.isEmail(email)) {
		throw new Error("Invalid email format");
	}

	const sanitized = sanitizeEmail(email);
	return (sanitized);
}

export function processUsername(name: string) {
	if (!/^[a-zA-Z0-9_\-\s]+$/.test(name)) {
		throw new Error("Invalid username format");
	}
	return name.trim();
}

export function check2faToken(token: string): boolean
{
	token = String(token).trim();
	if (token.length !== 6)
		return false;
	return /^\d{6}$/.test(token);
}

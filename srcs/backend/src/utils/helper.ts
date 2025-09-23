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
	return validator.matches(username, /^[a-zA-Z0-9_-]{3,20}$/);
}

function sanitizeUsername(username: string): string
{
	let clean = validator.trim(username);
	clean = validator.stripLow(clean);
	clean = validator.blacklist(clean, "<>\"'&/");
	return (clean);
}

export function processEmailInput(email: string): string
{
	if (!validator.isEmail(email)) {
		throw new Error("Invalid email format");
	}

	const sanitized = sanitizeEmail(email);
	return (sanitized);
}

export function processUsername(username: string): string
{
	const sanitized = sanitizeUsername(username);
	if (!isValidUsername(sanitized)) {
		throw new Error("Invalid username format");
	}
	return (sanitized);
}

export function check2faToken(token: string): boolean
{
	token = String(token).trim();
	if (token.length !== 6)
		return false;
	return /^\d{6}$/.test(token);
}

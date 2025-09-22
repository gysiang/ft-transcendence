export function validAlias(s: string): string | null {
    const t = s.trim();
    if (t.length < 1 || t.length > 32) return 'Alias must be less then 32 characters.';
    if (!/^[A-Za-z0-9 ]+$/.test(t)) return 'Only letters and numbers are allowed.';
    return null;
}

export function validGoal(n: number): string | null {
    if (!Number.isInteger(n)) return 'Goals must be an Integer.';
    if (n < 1 || n > 10) return 'Goals must be between 1 and 10.';
    return null;
}

export function setFieldError(input: HTMLInputElement, msg: string | null) {
    let err = input.nextElementSibling as HTMLDivElement | null;
    if (!err || !err.classList.contains('field-error')) {
        err = document.createElement('div');
        err.className = 'field-error text-red-600 text-sm mt-1';
        input.after(err);
    }
    if (msg) {
        input.classList.add('border-red-500');
        input.setAttribute('aria-invalid', 'true');
        err.textContent = msg;
    }
    else {
        input.classList.remove('border-red-500');
        input.removeAttribute('aria-invalid');
        err.textContent = '';
    }
}

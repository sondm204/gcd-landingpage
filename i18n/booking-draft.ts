// In-memory only: contact details and files never enter localStorage or cookies.
type Field = { name: string; value: string; checked?: boolean; files?: FileList };
export type BookingDraft = { selected: number; brand: string; discountCode: string; requestKey: string | null; fields: Field[] };
let draft: BookingDraft | null = null;

export function captureBookingDraft(form: HTMLFormElement, state: Omit<BookingDraft, "fields">) {
  if (!form.getClientRects().length) return;
  const fields = Array.from(form.elements).flatMap(element => {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) || !element.name) return [];
    return [{ name: element.name, value: element.value, ...(element instanceof HTMLInputElement ? { checked: element.checked, files: element.files || undefined } : {}) }];
  });
  draft = { ...state, fields };
}
export function takeBookingDraft() { const saved = draft; draft = null; return saved; }
export function restoreBookingFields(form: HTMLFormElement, saved: BookingDraft) {
  saved.fields.forEach(field => {
    const element = form.elements.namedItem(field.name);
    if (element instanceof HTMLInputElement) {
      if (element.type === "file") { if (field.files) element.files = field.files; }
      else { element.value = field.value; if (field.checked !== undefined) element.checked = field.checked; }
    } else if (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) element.value = field.value;
  });
}

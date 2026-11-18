// File inputs also emit a bubbling `cancel` event when their picker is dismissed.
// Only a cancel originating on this dialog (e.g. Escape) should close the form.
export function handleDialogCancel(event,onClose){
 event.stopPropagation();
 if(event.target!==event.currentTarget)return;
 event.preventDefault();
 onClose?.();
}

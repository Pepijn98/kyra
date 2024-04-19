export function useResetFocus(event: PointerEvent): void {
    if (event.target) {
        let target = event.target as HTMLElement;
        if (target.tagName === "SPAN" && target.parentElement) {
            target = target.parentElement;
        }

        target.blur();
    }
}

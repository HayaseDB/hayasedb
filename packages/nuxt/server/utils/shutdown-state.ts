let draining = false

export function startDraining(): void {
  draining = true
}

export function isDraining(): boolean {
  return draining
}
